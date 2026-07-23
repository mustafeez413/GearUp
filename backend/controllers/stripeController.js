const stripe = require('../services/stripeService');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Payout = require('../models/Payout');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Advertisement = require('../models/Advertisement');
const { createNotification } = require('./notificationController');
const sendEmail = require('../utils/sendEmail');
const { getBuyerOrderApprovedTemplate, getManufacturerOrderApprovedTemplate } = require('../templates/orderApprovedTemplate');
const { recordOrderPaymentTransactions } = require('../utils/orderTransactionSync');

const TRACKING_LABELS = {
    pending: 'Order placed',
    pending_approval: 'Payment proof submitted',
    verified: 'Payment verified',
    processing: 'Seller accepted — processing',
    shipped: 'Order shipped',
    delivered: 'Order delivered',
    completed: 'Delivery confirmed by buyer',
    cancelled: 'Order cancelled'
};

function appendTrackingLog(order, status, user, extraMessage) {
    const key = (status || '').toLowerCase();
    const message = extraMessage || TRACKING_LABELS[key] || `Status: ${status}`;
    if (!order.trackingLog) order.trackingLog = [];
    const last = order.trackingLog[order.trackingLog.length - 1];
    if (last && last.status === key && last.message === message) return;
    order.trackingLog.push({
        status: key,
        message,
        updatedBy: user.id || user._id,
        role: user.role,
        createdAt: new Date()
    });
}

// @desc    Create Stripe PaymentIntent
// @route   POST /api/stripe/create-payment-intent
// @access  Private
exports.createPaymentIntent = async (req, res) => {
    try {
        const { orderId } = req.body;
        if (!orderId) {
            return res.status(400).json({ success: false, error: 'Order ID is required' });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        // Validate that order is pending
        if (order.status !== 'pending' || order.isPaymentVerified) {
            return res.status(400).json({ success: false, error: 'Order is not in a pending payment state' });
        }

        // Create PaymentIntent (PKR smallest unit is cents equivalent, so multiply by 100)
        const amount = Math.round(order.totalAmount * 100);
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'pkr',
            metadata: {
                orderId: order._id.toString(),
                buyerId: order.buyer.toString()
            }
        });

        // Save stripePaymentIntentId on Order
        order.stripePaymentIntentId = paymentIntent.id;
        order.paymentMethod = 'card_payment';
        await order.save();

        res.status(200).json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });
    } catch (err) {
        console.error('[stripe] Create PaymentIntent error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// @desc    Handle Stripe webhooks (payment_intent.succeeded, payment_intent.payment_failed, payment_intent.canceled)
// @route   POST /api/stripe/webhook
// @access  Public (Stripe signed)
exports.handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('[stripe-webhook] Signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const eventType = event.type;
    console.log(`[stripe-webhook] Received event: ${eventType}`);

    try {
        if (eventType === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            const orderId = paymentIntent.metadata.orderId;

            if (!orderId) {
                console.error('[stripe-webhook] No orderId in metadata');
                return res.status(400).json({ success: false, error: 'No orderId in metadata' });
            }

            const order = await Order.findById(orderId);
            if (!order) {
                console.error(`[stripe-webhook] Order ${orderId} not found`);
                return res.status(404).json({ success: false, error: 'Order not found' });
            }

            // Check if already processed (idempotency)
            if (order.isPaymentVerified || ['verified', 'Held', 'Released', 'released', 'held'].includes(order.paymentStatus)) {
                console.log(`[stripe-webhook] Order ${orderId} is already payment verified/held/released.`);
                return res.status(200).json({ success: true, message: 'Already processed' });
            }

            // Update order to Held state
            order.paymentStatus = 'Held';
            order.isPaymentVerified = true;
            order.status = 'processing';
            order.stripeTransactionId = paymentIntent.latest_charge || paymentIntent.id;
            order.transactionReference = paymentIntent.id;

            // Update each seller portion status
            order.sellerStats = order.sellerStats.map(stat => {
                stat.status = 'processing';
                return stat;
            });

            const trackingUser = { id: order.buyer, role: 'wholesaler' };
            appendTrackingLog(order, 'verified', trackingUser, 'Card payment verified via Stripe');
            appendTrackingLog(order, 'processing', trackingUser, 'Order confirmed — sellers notified');
            
            await order.save();

            // Automate Payout creation
            for (const stat of order.sellerStats) {
                const existingPayout = await Payout.findOne({ order: order._id, seller: stat.seller });
                if (!existingPayout) {
                    await Payout.create({
                        order: order._id,
                        seller: stat.seller,
                        grossAmount: stat.subtotal,
                        commission: stat.platformCommission,
                        netAmount: stat.sellerReceivable,
                        status: 'Holding',
                        buyerTransactionId: paymentIntent.id,
                        notes: 'Escrow holding — automatic settlement on delivery'
                    });
                }
            }

            // Record Transactions (Admin commission, payout logs)
            await recordOrderPaymentTransactions(order);

            // Send notification to sellers
            for (const stat of order.sellerStats) {
                const payMsg = `New order #${order._id.toString().slice(-6)} — Stripe payment secured in escrow.`;
                await createNotification(
                    stat.seller.toString(),
                    payMsg,
                    'order',
                    `/manufacturer/orders/${order._id}`
                ).catch(err => console.error('[stripe-webhook] Notification error:', err));
            }

            // Send emails
            try {
                const populatedOrder = await Order.findById(order._id).populate('buyer', 'email name').populate('items.seller', 'email name');
                if (populatedOrder && populatedOrder.buyer && populatedOrder.buyer.email) {
                    sendEmail({
                        email: populatedOrder.buyer.email,
                        subject: `Order Approved Successfully`,
                        html: getBuyerOrderApprovedTemplate(order._id.toString().slice(-6))
                    }).catch(err => console.error('[EMAIL]', err));
                }

                // Notify all manufacturers
                const notifiedSellers = new Set();
                if (populatedOrder && populatedOrder.items) {
                    for (const item of populatedOrder.items) {
                        const sellerEmail = item.seller?.email;
                        if (sellerEmail && !notifiedSellers.has(sellerEmail)) {
                            notifiedSellers.add(sellerEmail);
                            sendEmail({
                                email: sellerEmail,
                                subject: `New Approved Order`,
                                html: getManufacturerOrderApprovedTemplate(order._id.toString().slice(-6), populatedOrder.buyer.name || 'Buyer')
                            }).catch(err => console.error('[EMAIL]', err));
                        }
                    }
                }
            } catch (emailErr) {
                console.error('[EMAIL] Failed to send payment verified notifications:', emailErr);
            }

            console.log(`[stripe-webhook] Order ${orderId} successfully completed payment integration.`);
        } 
        else if (eventType === 'checkout.session.completed') {
            const session = event.data.object;
            const advertisementId = session.metadata?.advertisementId;
            
            console.log(`[stripe-webhook] Checkout Session ID: ${session.id}`);
            console.log(`[stripe-webhook] Payment Intent ID: ${session.payment_intent}`);
            console.log(`[stripe-webhook] Target Advertisement ID: ${advertisementId}`);
            
            if (advertisementId) {
                try {
                    const ad = await Advertisement.findById(advertisementId);
                    if (!ad) {
                        console.error(`[stripe-webhook] Error: Advertisement ${advertisementId} not found.`);
                        // Return 200 to prevent endless Stripe retries for invalid data
                        return res.status(200).json({ received: true });
                    }
                    
                    if (['draft', 'pending_payment'].includes(ad.status)) {
                        ad.status = 'pending_approval';
                        ad.amountPaid = Number(session.metadata.amount) || (session.amount_total / 100);
                        ad.stripePaymentIntentId = session.payment_intent;
                        ad.stripeCheckoutSessionId = session.id;
                        ad.paidAt = new Date();
                        ad.paymentStatus = 'paid';
                        ad.approvalStatus = 'pending_review';
                        await ad.save();

                        const AdPayment = require('../models/AdPayment');
                        await AdPayment.create({
                            advertisementId: ad._id,
                            manufacturerId: ad.manufacturerId,
                            amount: ad.amountPaid,
                            plan: ad.plan,
                            paymentMethod: 'stripe',
                            status: 'completed',
                            ledgerReference: session.payment_intent || session.id,
                            metadata: {
                                originalPrice: ad.originalPrice,
                                finalPrice: ad.amountPaid,
                                savings: Math.max(0, ad.originalPrice - ad.amountPaid),
                                discountPercent: ad.discountPercent,
                                discountName: ad.discountName
                            }
                        });

                        await createNotification(
                            ad.manufacturerId.toString(),
                            `Payment received for campaign. Awaiting admin approval.`,
                            'system',
                            '/manufacturer/advertising/campaigns'
                        );
                        console.log(`[stripe-webhook] Advertisement update result: SUCCESS. Ad ${advertisementId} marked pending_approval.`);
                    } else {
                        console.log(`[stripe-webhook] Advertisement ${advertisementId} already processed or in invalid state (${ad.status}). Skipping.`);
                    }
                } catch (error) {
                    console.error(`[stripe-webhook] Database update failed for Advertisement ${advertisementId}:`, error.stack);
                    return res.status(500).json({ success: false, error: 'Database update failed' });
                }
            } else {
                console.error(`[stripe-webhook] Error: No advertisementId found in checkout session metadata.`);
            }
        }
        else if (eventType === 'checkout.session.expired') {
            const session = event.data.object;
            const advertisementId = session.metadata?.advertisementId;
            if (advertisementId) {
                try {
                    const ad = await Advertisement.findById(advertisementId);
                    if (ad && ['draft', 'pending_payment'].includes(ad.status)) {
                        ad.paymentStatus = 'cancelled';
                        await ad.save();
                        console.log(`[stripe-webhook] Advertisement ${advertisementId} paymentStatus marked as cancelled due to session expiration.`);
                    }
                } catch (error) {
                    console.error(`[stripe-webhook] Failed to update Advertisement ${advertisementId} on session expiration:`, error.stack);
                }
            }
        }
        else if (eventType === 'payment_intent.payment_failed' || eventType === 'payment_intent.canceled') {
            const paymentIntent = event.data.object;
            const orderId = paymentIntent.metadata.orderId;

            if (orderId) {
                const order = await Order.findById(orderId);
                if (order && order.status !== 'cancelled') {
                    order.status = 'cancelled';
                    order.paymentStatus = 'rejected';
                    
                    const trackingUser = { id: order.buyer, role: 'wholesaler' };
                    appendTrackingLog(order, 'cancelled', trackingUser, `Stripe payment failed: ${paymentIntent.last_payment_error?.message || 'Transaction error'}`);
                    
                    // Revert product stocks
                    for (const item of order.items) {
                        const product = await Product.findById(item.product);
                        if (product) {
                            product.stock += item.quantity;
                            await product.save();
                        }
                    }

                    // Update Transaction collection if records were created
                    await Transaction.updateMany({ order: order._id }, { status: 'Failed' });

                    await order.save();
                    console.log(`[stripe-webhook] Order ${orderId} cancelled due to payment failure.`);
                }
            }
        } else if (eventType === 'charge.refunded') {
            const charge = event.data.object;
            const paymentIntentId = charge.payment_intent;

            if (paymentIntentId) {
                const order = await Order.findOne({
                    $or: [
                        { stripePaymentIntentId: paymentIntentId },
                        { transactionReference: paymentIntentId }
                    ]
                });
                if (order && order.paymentStatus !== 'refunded') {
                    const { refundOrderTransactionally } = require('../utils/payoutSync');
                    await refundOrderTransactionally(order._id, 'Refunded via Stripe dashboard or API');
                    console.log(`[stripe-webhook] Order ${order._id} successfully refunded.`);
                }
            }
        }

        res.status(200).json({ received: true });
    } catch (err) {
        console.error('[stripe-webhook] Webhook handling error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};
