const Transaction = require('../models/Transaction');
const Order = require('../models/Order');
const User = require('../models/User');
const Settings = require('../models/Settings');
const { validateCommissionInput, loadCommissionSettings } = require('../utils/commissionCalculator');
const Refund = require('../models/Refund');
const Payout = require('../models/Payout');
const AuditLog = require('../models/AuditLog');
const { recordOrderPaymentTransactions, reverseOrderPaymentTransactions } = require('../utils/orderTransactionSync');
const sendEmail = require('../utils/sendEmail');

// @desc    Get all transactions with filters (Admin only)
// @route   GET /api/transactions/admin
// @access  Private/Admin
exports.getAdminTransactions = async (req, res, next) => {
    try {
        const { seller, status, type, startDate, endDate, page = 1, limit = 20 } = req.query;
        let query = {};

        // Filter by Seller
        if (seller) {
            query.seller = seller;
        }

        // Filter by Transaction Status
        if (status) {
            query.status = status;
        }

        // Filter by Type
        if (type) {
            query.type = type;
        }

        // Filter by Date Range
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) {
                query.timestamp.$gte = new Date(startDate);
            }
            if (endDate) {
                // Set to end of the day
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.timestamp.$lte = end;
            }
        }

        const skip = (page - 1) * limit;

        const transactions = await Transaction.find(query)
            .populate('order', 'status paymentStatus createdAt')
            .populate('seller', 'name email businessDetails.businessName paymentDetails')
            .populate('buyer', 'name email businessDetails.businessName')
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Transaction.countDocuments(query);

        // Dynamic Filtering by Order Status or Payment Status if provided in query
        let filteredTransactions = transactions;
        const { orderStatus, paymentStatus } = req.query;
        if (orderStatus || paymentStatus) {
            filteredTransactions = transactions.filter(t => {
                if (!t.order) return false;
                let match = true;
                if (orderStatus && t.order.status !== orderStatus) match = false;
                if (paymentStatus && t.order.paymentStatus !== paymentStatus) match = false;
                return match;
            });
        }

        res.status(200).json({
            success: true,
            count: filteredTransactions.length,
            total,
            pages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            data: filteredTransactions
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error retrieving transactions' });
    }
};

// @desc    Get dashboard statistics for Admin Commission Control Panel
// @route   GET /api/transactions/admin/stats
// @access  Private/Admin
exports.getAdminCommissionStats = async (req, res, next) => {
    try {
        // Total Earnings (sum of all deductedCommission from Completed transactions)
        const stats = await Transaction.aggregate([
            { $match: { status: 'Completed' } },
            {
                $group: {
                    _id: null,
                    totalCommission: { $sum: '$deductedCommission' },
                    totalSales: { $sum: '$totalAmount' },
                    totalSellerPayout: { $sum: '$sellerAmount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const refundStats = await Refund.aggregate([
            { $match: { status: 'Approved' } },
            {
                $group: {
                    _id: null,
                    totalRefundedAmount: { $sum: '$refundAmount' },
                    totalCommissionClawedBack: { $sum: '$commissionRefunded' }
                }
            }
        ]);

        const totalCommission = stats[0]?.totalCommission || 0;
        const totalSales = stats[0]?.totalSales || 0;
        const totalSellerPayout = stats[0]?.totalSellerPayout || 0;
        const totalRefunds = refundStats[0]?.totalRefundedAmount || 0;
        const totalCommissionRefunded = refundStats[0]?.totalCommissionClawedBack || 0;

        // Fetch recent settings for display
        const settings = await loadCommissionSettings();

        res.status(200).json({
            success: true,
            data: {
                totalCommission: Math.round(totalCommission * 100) / 100,
                totalSales: Math.round(totalSales * 100) / 100,
                totalSellerPayout: Math.round(totalSellerPayout * 100) / 100,
                netCommission: Math.round((totalCommission - totalCommissionRefunded) * 100) / 100,
                totalRefunds: Math.round(totalRefunds * 100) / 100,
                commissionPercentage: settings.platformFeePercentage,
                commissionEnabled: settings.commissionEnabled,
                commissionChargedTo: settings.commissionChargedTo,
                refundDeductionPolicy: settings.refundDeductionPolicy,
                transactionPolicy: settings.transactionPolicy
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error retrieving statistics' });
    }
};

// @desc    Get current user's payouts and transaction history (Manufacturers/Wholesalers only)
// @route   GET /api/transactions/my-payouts
// @access  Private
exports.getMyTransactions = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        let query = {};
        if (role === 'manufacturer') {
            query.seller = userId;
        } else if (role === 'wholesaler') {
            query.buyer = userId;
        } else {
            return res.status(403).json({ success: false, error: 'Not authorized to view payment records' });
        }

        const transactions = await Transaction.find(query)
            .populate('order', 'status paymentStatus createdAt')
            .populate('seller', 'name businessDetails.businessName paymentDetails')
            .populate('buyer', 'name businessDetails.businessName')
            .sort({ timestamp: -1 })
            .lean();

        // STRICT HIDING: Hide commission details from manufacturer/wholesaler dashboards
        const sanitizedTransactions = transactions.map(t => {
            return {
                _id: t._id,
                order: t.order ? {
                    _id: t.order._id,
                    status: t.order.status,
                    paymentStatus: t.order.paymentStatus,
                    createdAt: t.order.createdAt
                } : null,
                wholesalerName: t.buyer?.businessDetails?.businessName || t.buyer?.name || 'Wholesaler Client',
                manufacturerName: t.seller?.businessDetails?.businessName || t.seller?.name || 'Manufacturer Partner',
                totalAmount: t.totalAmount, // Order total
                // For seller, they see their receivable (final seller amount), for buyer they see their payable (total order amount)
                receivedAmount: role === 'manufacturer' ? t.sellerAmount : undefined,
                payableAmount: role === 'wholesaler' ? t.totalAmount : undefined,
                paymentMethod: t.paymentMethod,
                status: t.status,
                timestamp: t.timestamp || t.createdAt
            };
        });

        // Also fetch payouts if manufacturer
        let payouts = [];
        if (role === 'manufacturer') {
            payouts = await Payout.find({ seller: userId }).sort({ timestamp: -1 });
        }

        res.status(200).json({
            success: true,
            count: sanitizedTransactions.length,
            data: {
                transactions: sanitizedTransactions,
                payouts
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error retrieving payment history' });
    }
};

// @desc    Update commission settings (Admin only)
// @route   PUT /api/transactions/admin/settings
// @access  Private/Admin
exports.updateCommissionSettings = async (req, res, next) => {
    try {
        const {
            platformFeePercentage,
            commissionEnabled,
            commissionChargedTo,
            refundDeductionPolicy,
            transactionPolicy
        } = req.body;

        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings();
        }

        const nextEnabled = commissionEnabled !== undefined ? Boolean(commissionEnabled) : settings.commissionEnabled;
        const nextRate = platformFeePercentage !== undefined ? Number(platformFeePercentage) : settings.platformFeePercentage;

        const validationError = validateCommissionInput({
            commissionEnabled: nextEnabled,
            platformFeePercentage: nextRate
        });
        if (validationError) {
            return res.status(400).json({ success: false, error: validationError });
        }

        if (commissionChargedTo !== undefined && !['manufacturer', 'wholesaler'].includes(commissionChargedTo)) {
            return res.status(400).json({ success: false, error: 'Commission must be charged to manufacturer or wholesaler.' });
        }

        if (platformFeePercentage !== undefined) settings.platformFeePercentage = nextRate;
        if (commissionEnabled !== undefined) settings.commissionEnabled = nextEnabled;
        if (commissionChargedTo !== undefined) settings.commissionChargedTo = commissionChargedTo;
        if (refundDeductionPolicy !== undefined) settings.refundDeductionPolicy = refundDeductionPolicy;
        if (transactionPolicy !== undefined) settings.transactionPolicy = transactionPolicy;

        settings.updatedAt = new Date();
        await settings.save();

        // Audit log trail
        await AuditLog.create({
            action: 'Update commission policy & rules',
            performedBy: req.user.id,
            targetEntity: 'settings',
            status: 'success'
        });

        res.status(200).json({
            success: true,
            message: 'Commission settings updated successfully',
            data: settings
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error updating settings' });
    }
};

// @desc    Get public commission policy (for checkout/cart display)
// @route   GET /api/transactions/commission-policy
// @access  Private (any authenticated user)
exports.getCommissionPolicy = async (req, res, next) => {
    try {
        const settings = await loadCommissionSettings();
        res.status(200).json({
            success: true,
            data: {
                commissionEnabled: settings.commissionEnabled,
                platformFeePercentage: settings.platformFeePercentage,
                commissionChargedTo: settings.commissionChargedTo
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error retrieving commission policy' });
    }
};

// @desc    Initiate payout to a manufacturer (Admin only)
// @route   POST /api/transactions/admin/payouts
// @access  Private/Admin
exports.createPayout = async (req, res, next) => {
    try {
        const { sellerId, amount, payoutMethod, transactionReference } = req.body;

        if (!sellerId || !amount) {
            return res.status(400).json({ success: false, error: 'Please provide seller ID and amount' });
        }

        const seller = await User.findById(sellerId);
        if (!seller || seller.role !== 'manufacturer') {
            return res.status(404).json({ success: false, error: 'Manufacturer not found' });
        }

        const payout = await Payout.create({
            seller: sellerId,
            amount,
            payoutMethod: payoutMethod || 'Bank Transfer',
            transactionReference,
            status: 'Paid'
        });

        // Link with transaction log for unified reports
        await Transaction.create({
            seller: sellerId,
            totalAmount: -amount,
            deductedCommission: 0,
            sellerAmount: -amount,
            commissionPercentage: 0,
            paymentMethod: payoutMethod || 'Bank Transfer',
            status: 'Completed',
            type: 'payout',
            timestamp: payout.createdAt || new Date()
        });

        await AuditLog.create({
            action: `Initiate payout to seller: ${seller.name}`,
            performedBy: req.user.id,
            targetEntity: `payout:${payout._id}`,
            status: 'success'
        });

        res.status(201).json({
            success: true,
            message: 'Payout logged successfully',
            data: payout
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error logging payout' });
    }
};

// @desc    Release a pending settlement to completed (Admin only)
// @route   PUT /api/transactions/admin/settlements/:id/release
// @access  Private/Admin
exports.releaseSettlement = async (req, res, next) => {
    try {
        const transaction = await Transaction.findById(req.params.id).populate('seller', 'email name').populate('order', '_id');
        if (!transaction) {
            return res.status(404).json({ success: false, error: 'Transaction not found' });
        }

        if (transaction.status !== 'Pending' && transaction.status !== 'Held') {
            return res.status(400).json({ success: false, error: 'Transaction is not pending or held' });
        }

        const { releaseOrderPaymentTransactionally } = require('../utils/payoutSync');
        await releaseOrderPaymentTransactionally(transaction.order._id);

        const updatedTx = await Transaction.findById(req.params.id).populate('seller', 'email name').populate('order', '_id');

        // Email Automation: Notify Manufacturer of settlement release
        try {
            if (updatedTx.seller && updatedTx.seller.email) {
                await sendEmail({
                    email: updatedTx.seller.email,
                    subject: `Settlement Released - Order #${updatedTx.order._id.toString().slice(-6)}`,
                    html: `<h3>Payment Settlement Released</h3>
                           <p>Hi ${updatedTx.seller.name},</p>
                           <p>The settlement for order <b>#${updatedTx.order._id.toString().slice(-6)}</b> has been successfully released.</p>
                           <p>Amount: PKR ${updatedTx.sellerAmount}</p>
                           <p>You can view the transaction details in your dashboard.</p>`
                });
            }
        } catch (emailErr) {
            console.error('[EMAIL] Failed to send settlement release notification:', emailErr);
        }

        res.status(200).json({
            success: true,
            message: 'Settlement released successfully',
            data: updatedTx
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error releasing settlement' });
    }
};

// @desc    Initiate a refund record (Admin only)
// @route   POST /api/transactions/admin/refunds
// @access  Private/Admin
exports.createRefund = async (req, res, next) => {
    try {
        const { orderId, reason } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        // Ensure commission transactions exist (wallet / legacy orders may lack them)
        let txs = await Transaction.find({ order: orderId, status: { $in: ['Completed', 'Pending', 'Hold', 'Paid', 'Held', 'Released'] } });
        if (txs.length === 0 && (order.isPaymentVerified || ['verified', 'Held'].includes(order.paymentStatus))) {
            await recordOrderPaymentTransactions(order);
            txs = await Transaction.find({ order: orderId, status: { $in: ['Completed', 'Pending', 'Hold', 'Paid', 'Held', 'Released'] } });
        }
        if (txs.length === 0) {
            return res.status(400).json({ success: false, error: 'No active transaction found for this order' });
        }

        // Call Stripe Refund API if paid via card_payment
        if (order.paymentMethod === 'card_payment' && order.stripePaymentIntentId) {
            try {
                const stripe = require('../services/stripeService');
                await stripe.refunds.create({
                    payment_intent: order.stripePaymentIntentId,
                    reason: 'requested_by_customer'
                });
            } catch (stripeErr) {
                console.error('[stripe-refund] Stripe Refund API call failed:', stripeErr.message);
                return res.status(400).json({ success: false, error: `Stripe Refund failed: ${stripeErr.message}` });
            }
        }

        const { refundOrderTransactionally } = require('../utils/payoutSync');
        const refunds = await refundOrderTransactionally(orderId, reason || 'Customer requested refund');

        // Email Automation: Notify Buyer of Refund
        try {
            const populatedOrder = await Order.findById(orderId).populate('buyer', 'email name');
            if (populatedOrder && populatedOrder.buyer && populatedOrder.buyer.email) {
                await sendEmail({
                    email: populatedOrder.buyer.email,
                    subject: `Order Refunded - #${orderId.slice(-6)}`,
                    html: `<h3>Refund Processed</h3>
                           <p>Hi ${populatedOrder.buyer.name},</p>
                           <p>We have processed a refund for your order <b>#${orderId.slice(-6)}</b>.</p>
                           <p><b>Reason:</b> ${reason || 'Customer requested refund'}</p>
                           <p>The funds will be returned to your original payment method within the standard banking days.</p>`
                });
            }
        } catch (emailErr) {}

        await AuditLog.create({
            action: `Initiate order refund for order #${orderId}`,
            performedBy: req.user.id,
            targetEntity: `order:${orderId}`,
            status: 'success'
        });

        res.status(200).json({
            success: true,
            message: 'Refund processed successfully',
            data: refunds
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error processing refund' });
    }
};

// @desc    Update a transaction status manually (Admin only)
// @route   PUT /api/transactions/:id/status
// @access  Private/Admin
exports.updateTransactionStatus = async (req, res, next) => {
    try {
        const transactionId = req.params.id;
        const { status } = req.body;

        const transaction = await Transaction.findById(transactionId).populate('seller', 'email name');
        if (!transaction) {
            return res.status(404).json({ success: false, error: 'Transaction not found' });
        }

        transaction.status = status;
        
        if (status === 'Paid') {
            transaction.paidDate = Date.now();
            transaction.paidBy = req.user.id;
            
            // Create Notification
            const Notification = require('../models/Notification');
            await Notification.create({
                recipient: transaction.seller._id,
                title: 'Payment Released',
                message: 'Your seller payment has been processed successfully.',
                type: 'payment',
                relatedId: transaction._id
            });

            // Send Email
            try {
                if (transaction.seller && transaction.seller.email) {
                    await sendEmail({
                        email: transaction.seller.email,
                        subject: 'Seller Payment Processed',
                        html: `<h3>Payment Processed</h3>
                               <p>Hi ${transaction.seller.name},</p>
                               <p>Your payment has been processed and marked as paid by the platform administrator.</p>
                               <p>Amount: PKR ${transaction.sellerAmount?.toLocaleString() || transaction.totalAmount?.toLocaleString()}</p>`
                    });
                }
            } catch (emailErr) {
                console.error('[EMAIL] Failed to send payment processed notification:', emailErr);
            }
        }

        await transaction.save();

        await AuditLog.create({
            action: `Update transaction ${transactionId} status to ${status}`,
            performedBy: req.user.id,
            targetEntity: `transaction:${transactionId}`,
            status: 'success'
        });

        res.status(200).json({
            success: true,
            message: 'Transaction updated successfully',
            data: transaction
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error updating transaction' });
    }
};

