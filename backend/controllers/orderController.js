const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Settings = require('../models/Settings');
const {
    loadCommissionSettings,
    resolveFeePercent,
    calculateItemCommission,
    splitCommission,
    calculateBuyerTotal
} = require('../utils/commissionCalculator');
const { createNotification } = require('./notificationController');
const { sendEmail } = require('../services/emailService');
const { getPaymentProofTemplate } = require('../templates/paymentProofTemplate');
const { getBuyerOrderApprovedTemplate, getManufacturerOrderApprovedTemplate } = require('../templates/orderApprovedTemplate');
const { getShipmentTemplate } = require('../templates/shipmentTemplate');
const User = require('../models/User');
const { processWalletPayment, releaseEscrowForOrder, releaseEscrowForSeller, refundOrderEscrow } = require('../services/walletService');
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
        updatedBy: user.id,
        role: user.role,
        createdAt: new Date()
    });
}
const sanitizeOrder = (order) => {
    if (!order) return null;
    return order; // Returning the doc as is, but could be refined if needed
};

// Create order (B2B purchase)
exports.createOrder = async (req, res, next) => {
    try {
        const { items, paymentProof, shippingAddress, notes, paymentMethod, transactionReference } = req.body;
        const buyerId = (req.user._id || req.user.id).toString();

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, error: 'Please add items to order' });
        }

        const usePlatformWallet = paymentMethod === 'platform_wallet';

        if (paymentMethod === 'escrow_transfer') {
            if (!paymentProof) {
                return res.status(400).json({ success: false, error: 'Payment proof is required for escrow transfers.' });
            }
            if (!transactionReference) {
                return res.status(400).json({ success: false, error: 'Transaction ID is required.' });
            }
            const existingTid = await Order.findOne({ transactionReference });
            if (existingTid) {
                return res.status(400).json({ success: false, error: 'This Transaction ID has already been used.' });
            }
        }

        const commissionSettings = await loadCommissionSettings();
        const feePercent = resolveFeePercent(commissionSettings);

        let subtotalAmount = 0;
        let platformCommissionTotal = 0;
        const sellerMap = new Map();
        const orderItems = [];

        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) continue;

            const quantity = parseInt(item.quantity, 10);
            if (isNaN(quantity) || quantity <= 0) {
                return res.status(400).json({ success: false, error: 'Invalid item quantity. Must be a positive integer.' });
            }

            const itemSubtotal = product.pricePerBulkUnit * quantity;
            const itemCommission = calculateItemCommission(itemSubtotal, feePercent);
            const { platformCommission, sellerReceivable } = splitCommission(
                itemSubtotal,
                itemCommission,
                commissionSettings.commissionChargedTo,
                commissionSettings.commissionEnabled
            );

            const sellerId = (product.manufacturer || product.seller)?.toString();
            if (!sellerId) continue;

            orderItems.push({
                product: product._id,
                seller: sellerId,
                name: product.name,
                sku: product.sku || '',
                quantity: quantity,
                price: product.pricePerBulkUnit,
                bulkUnit: product.bulkUnit
            });

            if (!sellerMap.has(sellerId)) {
                sellerMap.set(sellerId, {
                    seller: sellerId,
                    subtotal: 0,
                    platformCommission: 0,
                    sellerReceivable: 0
                });
            }

            const stats = sellerMap.get(sellerId);
            stats.subtotal += itemSubtotal;
            stats.platformCommission += platformCommission;
            stats.sellerReceivable += sellerReceivable;

            subtotalAmount += itemSubtotal;
            platformCommissionTotal += platformCommission;

            product.stock -= quantity;
            await product.save();
        }

        if (orderItems.length === 0) {
            return res.status(400).json({ success: false, error: 'No valid products found for checkout.' });
        }

        // Set initial status based on payment method
        let initialStatus = paymentProof ? 'pending_approval' : 'pending';
        let initialPaymentStatus = paymentProof ? 'pending_approval' : 'pending';
        let isPaymentVerified = false;

        if (usePlatformWallet) {
            initialStatus = 'pending';
            initialPaymentStatus = 'pending';
            isPaymentVerified = false;
        }

        const totalAmount = calculateBuyerTotal(subtotalAmount, platformCommissionTotal, commissionSettings);

        const order = await Order.create({
            buyer: buyerId,
            buyerType: req.user.role || 'wholesaler',
            items: orderItems,
            sellerStats: Array.from(sellerMap.values()).map(s => ({
                ...s,
                status: 'pending' // sellers see it as pending until admin verifies
            })),
            totalAmount,
            platformCommissionTotal,
            commissionRate: commissionSettings.commissionEnabled ? commissionSettings.platformFeePercentage : 0,
            commissionChargedTo: commissionSettings.commissionEnabled ? commissionSettings.commissionChargedTo : 'none',
            paymentProof,
            shippingAddress,
            notes,
            paymentMethod: paymentMethod || 'escrow_transfer',
            transactionReference,
            paymentStatus: initialPaymentStatus,
            isPaymentVerified: isPaymentVerified,
            status: initialStatus
        });

        if (usePlatformWallet) {
            try {
                await processWalletPayment(order, buyerId);
            } catch (walletErr) {
                await Order.findByIdAndDelete(order._id);
                for (const item of orderItems) {
                    const product = await Product.findById(item.product);
                    if (product) {
                        product.stock += item.quantity;
                        await product.save();
                    }
                }
                return res.status(400).json({ success: false, error: walletErr.message });
            }

            order.paymentStatus = 'verified';
            order.isPaymentVerified = true;
            order.status = 'processing';
            for (const stat of order.sellerStats) {
                stat.status = 'processing';
            }
            appendTrackingLog(order, 'verified', req.user, 'Wallet payment — funds held in escrow');
            appendTrackingLog(order, 'processing', req.user, 'Order confirmed — sellers notified');
            await order.save();

            const Payout = require('../models/Payout');
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
                        buyerTransactionId: order.transactionReference || null,
                        notes: 'Escrow holding — automatic settlement on delivery'
                    });
                }
            }

            await recordOrderPaymentTransactions(order);
        }

        for (const sellerId of sellerMap.keys()) {
            const payMsg = usePlatformWallet
                ? `New order #${order._id.toString().slice(-6)} — payment secured in escrow.`
                : `New order #${order._id.toString().slice(-6)} received. Pending payment.`;
            await createNotification(
                sellerId,
                payMsg,
                'order',
                `/manufacturer/orders/${order._id}`
            );
        }

        if (!usePlatformWallet && paymentProof) {
            try {
                const adminUsers = await User.find({ role: 'admin' });
                for (const admin of adminUsers) {
                    sendEmail(
                        admin.email,
                        `New Payment Proof Uploaded - Order #${order._id.toString().slice(-6)}`,
                        getPaymentProofTemplate(order._id.toString().slice(-6), req.user.name || 'Buyer', totalAmount)
                    ).catch(err => console.error('[EMAIL] Failed to send admin notification:', err));
                }
            } catch (emailErr) {
                console.error('[EMAIL] Failed to send admin notification:', emailErr);
            }
        }

        res.status(201).json({ 
            success: true, 
            data: order 
        });
    } catch (error) {
        console.error(`[createOrder] ERROR:`, error);
        res.status(400).json({ success: false, error: error.message });
    }
};

// Get all orders for current user
exports.getOrders = async (req, res, next) => {
    try {
        let query = {};
        console.log(`[getOrders] DEBUG: Fetching orders. Logged-in User ID: ${req.user.id}, Role: ${req.user.role}`);

        if (req.user.role === 'wholesaler' || req.user.role === 'manufacturer') {
            // Fetch orders matching this seller or orders they bought
            query = {
                $or: [
                    { manufacturer: req.user.id },
                    { 'items.seller': req.user.id },
                    { buyer: req.user.id }
                ]
            };
        } else if (req.user.role === 'admin') {
            query = {};
        }

        console.log(`[getOrders] DEBUG: Database query parameters:`, JSON.stringify(query));

        const orders = await Order.find(query)
            .populate('buyer', 'name email role businessDetails')
            .populate('items.product', 'name price pricePerBulkUnit bulkUnit images')
            .populate('items.seller', 'name email businessDetails')
            .populate('sellerStats.seller', 'name email businessDetails')
            .sort('-createdAt');

        console.log(`[getOrders] DEBUG: Fetched raw orders count: ${orders.length}`);

        let formattedOrders = orders.map(order => {
            const obj = order.toObject({ virtuals: true });
            
            // Wholesaler alias fallback
            obj.wholesaler = obj.buyer;
            
            // orderItems alias fallback
            obj.orderItems = obj.items;

            // Image fallback mapping
            if (obj.items) {
                obj.items.forEach(item => {
                    if (item.product) {
                        item.product.image = item.product.images?.[0] || '';
                    }
                });
            }
            if (obj.orderItems) {
                obj.orderItems.forEach(item => {
                    if (item.product) {
                        item.product.image = item.product.images?.[0] || '';
                    }
                });
            }
            return obj;
        });

        if (req.user.role === 'admin') {
            const Payout = require('../models/Payout');
            const Escrow = require('../models/Escrow');
            const Dispute = require('../models/Dispute');
            const {
                loadOperationsContext,
                reconcileOrderPaymentStatus,
                reconcileAllOperations,
                isPaymentReviewRecord,
                computeUnifiedOperationsStats,
                PAYMENT_STATUS,
            } = require('../utils/operationStatus');
            const ctx = await loadOperationsContext();
            await reconcileAllOperations(formattedOrders, [], ctx);

            formattedOrders = await Promise.all(
                formattedOrders.map((o) => reconcileOrderPaymentStatus(o, ctx))
            );

            const reviewOrders = formattedOrders.filter((o) => isPaymentReviewRecord(o, ctx));
            const [payouts, escrows, disputes] = await Promise.all([
                Payout.find().lean(),
                Escrow.find().lean(),
                Dispute.find().select('status order').lean(),
            ]);
            const operationsSummary = computeUnifiedOperationsStats(formattedOrders, payouts, escrows, disputes, ctx);

            const paymentStats = {
                pending: reviewOrders.filter((o) => o.resolvedPaymentStatus === PAYMENT_STATUS.PENDING_VERIFICATION).length,
                verified: reviewOrders.filter((o) => o.resolvedPaymentStatus === PAYMENT_STATUS.VERIFIED).length,
                rejected: reviewOrders.filter((o) => o.resolvedPaymentStatus === PAYMENT_STATUS.REJECTED).length,
                refunded: operationsSummary.refundedOrders,
                reviews: reviewOrders.length,
            };

            return res.status(200).json({
                success: true,
                count: formattedOrders.length,
                paymentStats,
                operationsSummary,
                data: formattedOrders,
            });
        }

        // Debug logging for task requirements
        if (formattedOrders.length > 0) {
            console.log(`[getOrders] DEBUG: Sample Populated Wholesaler:`, JSON.stringify(formattedOrders[0].wholesaler));
            console.log(`[getOrders] DEBUG: Sample Populated Product:`, JSON.stringify(formattedOrders[0].orderItems?.[0]?.product));
        }

        res.status(200).json({
            success: true,
            count: formattedOrders.length,
            data: formattedOrders
        });
    } catch (error) {
        console.error(`[getOrders] ERROR:`, error);
        res.status(400).json({ success: false, error: error.message });
    }
};

// Get single order
exports.getOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('buyer', 'name email role businessDetails')
            .populate('items.product', 'name price pricePerBulkUnit bulkUnit images')
            .populate('items.seller', 'name email businessDetails')
            .populate('sellerStats.seller', 'name email businessDetails');

        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        const uid = req.user.id.toString();
        const refId = (ref) => (ref?._id || ref)?.toString();

        const isBuyer = refId(order.buyer) === uid;
        const isSeller =
            order.items.some((item) => refId(item.seller) === uid) ||
            (order.sellerStats || []).some((s) => refId(s.seller) === uid);
        const isAdmin = req.user.role === 'admin';

        if (!isBuyer && !isSeller && !isAdmin) {
            return res.status(403).json({ success: false, error: 'Not authorized to view this order' });
        }

        const obj = order.toObject({ virtuals: true });
        
        // Wholesaler and orderItems fallbacks
        obj.wholesaler = obj.buyer;
        obj.orderItems = obj.items;

        if (obj.items) {
            obj.items.forEach(item => {
                if (item.product) {
                    item.product.image = item.product.images?.[0] || '';
                }
            });
        }
        if (obj.orderItems) {
            obj.orderItems.forEach(item => {
                if (item.product) {
                    item.product.image = item.product.images?.[0] || '';
                }
            });
        }

        res.status(200).json({ success: true, data: obj });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Update order status (Seller or Admin)
exports.updateOrderStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        // Normalize status strings dynamically to capitalized/lowercase standard
        let normalizedStatus = status;
        if (status) {
            const statusMap = {
                'pending': 'pending',
                'pending_approval': 'pending_approval',
                'verified': 'verified',
                'processing': 'processing',
                'shipped': 'shipped',
                'delivered': 'delivered',
                'cancelled': 'cancelled',
                'completed': 'delivered',
                'pending payment': 'pending',
                'pending approval': 'pending_approval',
                'payment verified': 'verified',
                'order confirmed': 'processing'
            };
            const lower = status.toLowerCase();
            if (statusMap[lower]) {
                normalizedStatus = statusMap[lower];
            }
        }

        const isWalletOrder = order.paymentMethod === 'platform_wallet';
        const actingSellerId = req.user.role === 'manufacturer' ? req.user.id : null;
        const sellerStatBefore = actingSellerId
            ? order.sellerStats.find((s) => s.seller?.toString() === actingSellerId)
            : null;
        const previousSellerStatus = sellerStatBefore?.status;

        // Only allow progression if payment proof exists (bank transfer). Wallet orders are pre-paid.
        const restrictedStatuses = ['processing', 'shipped', 'delivered', 'Processing', 'Shipped', 'Completed'];
        if (restrictedStatuses.includes(normalizedStatus)) {
            if (!isWalletOrder && !order.paymentProof) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Cannot proceed to processing before payment proof/receipt is uploaded.' 
                });
            }
            order.isPaymentVerified = true;
            order.paymentStatus = 'verified';
        }

        if (req.user.role === 'admin') {
            if (normalizedStatus) order.status = normalizedStatus;
        } else if (order.buyer?.toString() === req.user.id && (normalizedStatus === 'delivered' || normalizedStatus === 'completed')) {
            order.status = 'completed';
        } else {
            // Seller can update their portion
            const sellerStat = order.sellerStats.find(s => s.seller?.toString() === req.user.id);
            if (!sellerStat) {
                return res.status(403).json({ success: false, error: 'Not authorized' });
            }
            if (normalizedStatus) sellerStat.status = normalizedStatus;

            // If all sellers marked as Shipped/Completed, update overall order status
            const allSellersSameStatus = order.sellerStats.every(s => s.status === normalizedStatus);
            if (allSellersSameStatus) {
                order.status = normalizedStatus;
            }
        }

        if (order.status === 'cancelled' || normalizedStatus === 'cancelled' || order.status === 'Cancelled') {
            const Transaction = require('../models/Transaction');
            await Transaction.updateMany({ order: order._id }, { status: 'Failed' });
            if (isWalletOrder) {
                try {
                    await refundOrderEscrow(order._id);
                } catch (refundErr) {
                    console.error('[wallet] refund on cancel:', refundErr.message);
                }
            }
        }

        const buyerConfirmedDelivery =
            order.buyer?.toString() === req.user.id &&
            (normalizedStatus === 'delivered' || normalizedStatus === 'completed');

        const sellerMarkedDelivered =
            actingSellerId &&
            normalizedStatus === 'delivered' &&
            previousSellerStatus !== 'delivered';

        if (sellerMarkedDelivered && isWalletOrder) {
            try {
                await releaseEscrowForSeller(order._id, actingSellerId);
            } catch (releaseErr) {
                console.error('[wallet] auto-release on seller deliver:', releaseErr.message);
            }
        }

        if (buyerConfirmedDelivery && isWalletOrder) {
            try {
                await releaseEscrowForOrder(order._id, req.user.id);
            } catch (releaseErr) {
                console.error('[wallet] release on buyer confirm:', releaseErr.message);
            }
        }

        if (normalizedStatus) {
            const trackRole = req.user.role;
            if (actingSellerId && ['processing', 'shipped', 'delivered'].includes(normalizedStatus)) {
                appendTrackingLog(order, normalizedStatus, req.user);
            } else if (order.buyer?.toString() === req.user.id && buyerConfirmedDelivery) {
                appendTrackingLog(order, 'completed', req.user);
            } else if (req.user.role === 'admin' && normalizedStatus) {
                appendTrackingLog(order, normalizedStatus, req.user, `Admin updated status to ${normalizedStatus}`);
            }
        }

        if (order.status === 'completed' || order.status === 'delivered') {
            try {
                const { markPayoutsApprovedForOrder } = require('../utils/payoutSync');
                await markPayoutsApprovedForOrder(order._id);
            } catch (payoutErr) {
                console.error('[payout] auto-approve on delivery:', payoutErr.message);
            }
        }

        await order.save();

        // Email Automation: Shipment Update / Delivery
        try {
            const populatedOrder = await Order.findById(order._id).populate('buyer', 'email name');
            if (populatedOrder && populatedOrder.buyer && populatedOrder.buyer.email) {
                if (normalizedStatus === 'shipped') {
                    sendEmail(
                        populatedOrder.buyer.email,
                        `Order Shipped`,
                        getShipmentTemplate(order._id.toString().slice(-6))
                    ).catch(err => console.error('[EMAIL]', err));
                } else if (normalizedStatus === 'delivered' || normalizedStatus === 'completed') {
                    sendEmail(
                        populatedOrder.buyer.email,
                        `Your Order #${order._id.toString().slice(-6)} has been Delivered!`,
                        `<h3>Delivery Completed</h3>
                               <p>Hi ${populatedOrder.buyer.name},</p>
                               <p>Your order <b>#${order._id.toString().slice(-6)}</b> has been marked as delivered.</p>
                               <p>Thank you for using our platform.</p>`
                    ).catch(err => console.error('[EMAIL]', err));
                }
            }
            
            // Email Automation: Delivery Confirmed by Buyer -> Notify Admin
            if (order.buyer?.toString() === req.user.id && (normalizedStatus === 'delivered' || normalizedStatus === 'completed')) {
                const adminUsers = await User.find({ role: 'admin' });
                for (const admin of adminUsers) {
                    sendEmail(
                        admin.email,
                        `Delivery Confirmed - Order #${order._id.toString().slice(-6)}`,
                        `<h3>Settlement Ready for Release</h3>
                               <p>The buyer has confirmed delivery for order <b>#${order._id.toString().slice(-6)}</b>.</p>
                               <p>The settlement is now ready to be released to the manufacturers.</p>
                               <p>Please log in to the Admin Dashboard > Settlements Tab to release the funds.</p>`
                    ).catch(err => console.error('[EMAIL]', err));
                }
            }
        } catch (emailErr) {
            console.error('[EMAIL] Failed to send status update notification:', emailErr);
        }

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Update payment status (Admin or Seller for verification)
exports.updatePaymentStatus = async (req, res, next) => {
    try {
        const { paymentStatus, transactionReference, paymentProof } = req.body;
        const order = await Order.findById(req.params.id);
        let normalizedPaymentStatus = paymentStatus;

        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        // If user is buyer and uploading proof
        if (order.buyer?.toString() === req.user.id && paymentProof) {
            order.paymentProof = paymentProof;
            order.paymentStatus = 'pending_approval';
            order.status = 'pending_approval';
        } 
        // If user is admin/seller and verifying
        else if (req.user.role === 'admin' || order.sellerStats.some(s => s.seller?.toString() === req.user.id)) {
            // Normalize paymentStatus strings dynamically
            if (paymentStatus) {
                const payMap = {
                    'pending_approval': 'pending_approval',
                    'pending approval': 'pending_approval',
                    'verified': 'verified',
                    'payment verified': 'verified',
                    'rejected': 'rejected',
                    'refunded': 'refunded',
                    'pending': 'pending'
                };
                const lower = paymentStatus.toLowerCase();
                if (payMap[lower]) {
                    normalizedPaymentStatus = payMap[lower];
                }
            }

            if (normalizedPaymentStatus) order.paymentStatus = normalizedPaymentStatus;
            if (transactionReference) order.transactionReference = transactionReference;

            if (normalizedPaymentStatus === 'verified' || normalizedPaymentStatus === 'Payment Verified') {
                order.paymentStatus = 'verified';
                order.isPaymentVerified = true;
                order.status = 'processing'; // Automatically move order to processing state!
                
                // Automate Platform Commission Deduction & Payout Generation
                const Payout = require('../models/Payout');
                const Settings = require('../models/Settings');
                const settings = await Settings.findOne() || { platformFeePercentage: 3 };
                
                // Update seller portion status in sellerStats
                order.sellerStats = order.sellerStats.map(stat => {
                    const sellerId = (stat.seller?._id || stat.seller)?.toString();
                    const loggedInUserId = (req.user.id || req.user._id)?.toString();
                    if (req.user.role === 'admin' || sellerId === loggedInUserId) {
                        return { ...stat.toObject(), status: 'processing' };
                    }
                    return stat;
                });

                // Generate a manual Payout record for each seller for Admin tracking
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
                            buyerTransactionId: order.transactionReference || null,
                            notes: 'Escrow holding — awaiting automatic settlement'
                        });
                    }
                }

                await recordOrderPaymentTransactions(order);
            }
        } else {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        await order.save();

        // Email Automation: Payment Verified (Notify Buyer and Manufacturers)
        if (order.isPaymentVerified && (normalizedPaymentStatus === 'verified' || normalizedPaymentStatus === 'Payment Verified')) {
            try {
                const populatedOrder = await Order.findById(order._id).populate('buyer', 'email name').populate('items.seller', 'email name');
                
                if (populatedOrder && populatedOrder.buyer && populatedOrder.buyer.email) {
                    sendEmail(
                        populatedOrder.buyer.email,
                        `Order Approved Successfully`,
                        getBuyerOrderApprovedTemplate(order._id.toString().slice(-6))
                    ).catch(err => console.error('[EMAIL]', err));
                }

                // Notify all manufacturers
                const notifiedSellers = new Set();
                if (populatedOrder && populatedOrder.items) {
                    for (const item of populatedOrder.items) {
                        const sellerEmail = item.seller?.email;
                        if (sellerEmail && !notifiedSellers.has(sellerEmail)) {
                            notifiedSellers.add(sellerEmail);
                            sendEmail(
                                sellerEmail,
                                `New Approved Order`,
                                getManufacturerOrderApprovedTemplate(order._id.toString().slice(-6), populatedOrder.buyer.name || 'Buyer')
                            ).catch(err => console.error('[EMAIL]', err));
                        }
                    }
                }
            } catch (emailErr) {
                console.error('[EMAIL] Failed to send payment verified notifications:', emailErr);
            }
        } else if (normalizedPaymentStatus === 'rejected' || normalizedPaymentStatus === 'pending') {
            try {
                const populatedOrder = await Order.findById(order._id).populate('buyer', 'email name');
                if (populatedOrder && populatedOrder.buyer && populatedOrder.buyer.email) {
                    if (normalizedPaymentStatus === 'rejected') {
                        sendEmail({
                            email: populatedOrder.buyer.email,
                            subject: `Payment Rejected - Order #${order._id.toString().slice(-6)}`,
                            html: `<h3>Payment Proof Rejected</h3>
                                   <p>Hi ${populatedOrder.buyer.name},</p>
                                   <p>Unfortunately, your payment proof for order <b>#${order._id.toString().slice(-6)}</b> has been rejected by our verification team.</p>
                                   <p>Please contact support or re-upload a valid proof to proceed with your order.</p>`
                        }).catch(err => console.error('[EMAIL]', err));
                    } else if (normalizedPaymentStatus === 'pending') {
                        await sendEmail({
                            email: populatedOrder.buyer.email,
                            subject: `Action Required: Re-upload Payment Proof - Order #${order._id.toString().slice(-6)}`,
                            html: `<h3>Clearer Payment Proof Needed</h3>
                                   <p>Hi ${populatedOrder.buyer.name},</p>
                                   <p>Our team needs a clearer or more accurate payment proof for order <b>#${order._id.toString().slice(-6)}</b>.</p>
                                   <p>Please log in to your dashboard and re-upload the receipt so we can verify your payment and process your order.</p>`
                        });
                    }
                }
            } catch (emailErr) {
                console.error('[EMAIL] Failed to send rejected/reupload notifications:', emailErr);
            }
        }

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Buyer approves order after payment verified (Issue 5: Step 4)
exports.approveOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        if (order.buyer?.toString() !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Only the buyer can approve the order' });
        }

        const isVerified = order.isPaymentVerified || ['verified', 'Payment Verified'].includes(order.paymentStatus);
        if (!isVerified) {
            return res.status(400).json({ success: false, error: 'Order can only be confirmed after payment verification' });
        }

        order.status = 'processing';
        await order.save();

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
