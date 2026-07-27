const User = require('../models/User');
const Order = require('../models/Order');
const Payout = require('../models/Payout');
const Dispute = require('../models/Dispute');
const stripeConnectService = require('../services/stripeConnectService');
const exchangeRateService = require('../services/exchangeRateService');
const { createNotification } = require('./notificationController');

/**
 * Helper to create payout records for an order when payment succeeds
 */
async function createOrderPayouts(orderId) {
    const order = await Order.findById(orderId).populate('items.product');
    if (!order) return [];

    const payouts = [];

    // Group items by seller
    const sellerMap = new Map();

    (order.items || []).forEach(item => {
        const sellerId = (item.seller?._id || item.seller || item.product?.seller || item.product?.manufacturer)?.toString();
        if (!sellerId) return;

        const subtotal = Number(item.price || item.product?.pricePerBulkUnit || 0) * Number(item.quantity || 1);
        
        if (!sellerMap.has(sellerId)) {
            sellerMap.set(sellerId, {
                sellerId,
                grossAmount: 0,
                commission: 0
            });
        }

        const entry = sellerMap.get(sellerId);
        entry.grossAmount += subtotal;
    });

    // Check seller stats if available on order for commission splitting
    if (order.sellerStats && Array.isArray(order.sellerStats)) {
        order.sellerStats.forEach(stat => {
            const sid = (stat.seller?._id || stat.seller)?.toString();
            if (sid && sellerMap.has(sid)) {
                const entry = sellerMap.get(sid);
                entry.grossAmount = stat.subtotal || entry.grossAmount;
                entry.commission = stat.platformCommission || 0;
            }
        });
    }

    for (const [sellerId, data] of sellerMap.entries()) {
        // Prevent duplicate payout for same order + seller
        const existing = await Payout.findOne({ order: order._id, seller: sellerId });
        if (existing) {
            payouts.push(existing);
            continue;
        }

        const grossAmount = Math.max(0, data.grossAmount);
        const platformCommission = Math.max(0, data.commission);
        const netAmount = Math.max(0, grossAmount - platformCommission);

        // Check if there's an active dispute on this order
        const activeDispute = await Dispute.findOne({
            order: order._id,
            status: { $in: ['Open', 'Under Review', 'Escalated'] }
        });

        const isDisputed = Boolean(activeDispute);

        const payout = await Payout.create({
            seller: sellerId,
            order: order._id,
            paymentIntentId: order.stripePaymentIntentId || null,
            grossAmount,
            platformCommission,
            netAmount,
            currency: 'pkr',
            status: isDisputed ? 'Held' : 'Pending',
            disputeHold: isDisputed,
            disputeHoldReason: isDisputed ? 'Held due to active dispute on order' : ''
        });

        payouts.push(payout);
    }

    return payouts;
}

// @desc    Initiate Stripe Connect Express Onboarding
// @route   POST /api/payouts/connect
// @access  Private (Seller: manufacturer / wholesaler)
exports.connectStripeAccount = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const stripeAccountId = await stripeConnectService.createExpressAccount(user);

        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const rolePath = user.role === 'manufacturer' ? 'manufacturer' : 'wholesaler';
        const returnUrl = `${baseUrl}/${rolePath}/payout-settings?stripe_connect=success`;
        const refreshUrl = `${baseUrl}/${rolePath}/payout-settings?stripe_connect=refresh`;

        const onboardingUrl = await stripeConnectService.createAccountOnboardingLink(
            stripeAccountId,
            returnUrl,
            refreshUrl
        );

        return res.json({
            success: true,
            url: onboardingUrl,
            stripeAccountId
        });
    } catch (err) {
        console.error('[connect-stripe-error]', err);
        return res.status(500).json({ success: false, error: err.message || 'Failed to initiate Stripe onboarding' });
    }
};

// @desc    Get Stripe Account status and balance for logged-in seller
// @route   GET /api/payouts/stripe-status
// @access  Private (Seller: manufacturer / wholesaler)
exports.getStripeAccountStatus = async (req, res) => {
    try {
        const user = await stripeConnectService.syncAccountStatus(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        let balance = { available: 0, pending: 0 };
        if (user.stripeAccountId && user.stripePayoutsEnabled) {
            balance = await stripeConnectService.getConnectedAccountBalance(user.stripeAccountId);
        }

        return res.json({
            success: true,
            data: {
                stripeAccountId: user.stripeAccountId,
                stripeAccountStatus: user.stripeAccountStatus || 'Not Connected',
                stripeChargesEnabled: user.stripeChargesEnabled || false,
                stripePayoutsEnabled: user.stripePayoutsEnabled || false,
                stripeOnboardingCompleted: user.stripeOnboardingCompleted || false,
                stripeAccountCreatedAt: user.stripeAccountCreatedAt,
                lastStripeSync: user.lastStripeSync,
                balance
            }
        });
    } catch (err) {
        console.error('[stripe-status-error]', err);
        return res.status(500).json({ success: false, error: err.message || 'Failed to fetch Stripe status' });
    }
};

// @desc    Get Stripe Express Dashboard Login Link
// @route   GET /api/payouts/stripe-login
// @access  Private (Seller)
exports.getStripeLoginLink = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.stripeAccountId) {
            return res.status(400).json({ success: false, error: 'Stripe account not connected' });
        }

        const url = await stripeConnectService.createLoginLink(user.stripeAccountId);
        return res.json({ success: true, url });
    } catch (err) {
        console.error('[stripe-login-link-error]', err);
        return res.status(500).json({ success: false, error: err.message || 'Failed to generate Stripe dashboard link' });
    }
};

// @desc    Get Seller Earnings Summary & Payout History
// @route   GET /api/payouts/earnings
// @access  Private (Seller)
exports.getSellerEarnings = async (req, res) => {
    try {
        const sellerId = req.user.id;
        const payouts = await Payout.find({ seller: sellerId })
            .populate('order', 'orderNumber status paymentStatus createdAt')
            .sort({ createdAt: -1 });

        let lifetimeEarnings = 0;
        let releasedPayoutsTotal = 0;
        let pendingPayoutsTotal = 0;
        let failedPayoutsTotal = 0;
        let lastPayout = null;

        payouts.forEach(p => {
            if (p.status === 'Released') {
                releasedPayoutsTotal += p.netAmount;
                lifetimeEarnings += p.netAmount;
                if (!lastPayout || new Date(p.releasedAt) > new Date(lastPayout.releasedAt)) {
                    lastPayout = p;
                }
            } else if (p.status === 'Pending' || p.status === 'Held') {
                pendingPayoutsTotal += p.netAmount;
            } else if (p.status === 'Failed') {
                failedPayoutsTotal += p.netAmount;
            }
        });

        const user = await User.findById(sellerId);
        let stripeBalance = { available: 0, pending: 0 };
        if (user && user.stripeAccountId && user.stripePayoutsEnabled) {
            stripeBalance = await stripeConnectService.getConnectedAccountBalance(user.stripeAccountId);
        }

        return res.json({
            success: true,
            data: {
                summary: {
                    availableBalance: stripeBalance.available || releasedPayoutsTotal,
                    pendingBalance: stripeBalance.pending || pendingPayoutsTotal,
                    lifetimeEarnings,
                    releasedPayoutsTotal,
                    pendingPayoutsTotal,
                    failedPayoutsTotal,
                    lastPayout: lastPayout ? {
                        id: lastPayout._id,
                        amount: lastPayout.netAmount,
                        date: lastPayout.releasedAt
                    } : null
                },
                payouts: payouts.map(p => ({
                    id: p._id,
                    orderId: p.order?._id,
                    orderNumber: p.order?.orderNumber || `ORD-${String(p.order?._id).slice(-6).toUpperCase()}`,
                    grossAmount: p.grossAmount,
                    platformCommission: p.platformCommission,
                    netAmount: p.netAmount,
                    status: p.status,
                    disputeHold: p.disputeHold,
                    disputeHoldReason: p.disputeHoldReason,
                    createdAt: p.createdAt,
                    releasedAt: p.releasedAt
                }))
            }
        });
    } catch (err) {
        console.error('[get-seller-earnings-error]', err);
        return res.status(500).json({ success: false, error: err.message || 'Failed to load seller earnings' });
    }
};

// @desc    Admin: List Payouts with search and status filters
// @route   GET /api/payouts/admin/list
// @access  Private (Admin)
exports.getAdminPayouts = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 20 } = req.query;
        const query = {};

        if (status && status !== 'all') {
            query.status = status;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const payouts = await Payout.find(query)
            .populate('seller', 'name email role stripeAccountId stripeAccountStatus stripeChargesEnabled stripePayoutsEnabled businessDetails')
            .populate('order', 'orderNumber status paymentStatus stripePaymentIntentId createdAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const totalCount = await Payout.countDocuments(query);

        // Filter search locally if search query is provided
        let filteredPayouts = payouts;
        if (search && search.trim()) {
            const term = search.trim().toLowerCase();
            filteredPayouts = payouts.filter(p => {
                const sellerName = (p.seller?.name || '').toLowerCase();
                const sellerEmail = (p.seller?.email || '').toLowerCase();
                const orderNum = (p.order?.orderNumber || '').toLowerCase();
                const intentId = (p.paymentIntentId || '').toLowerCase();
                const stripeAcc = (p.seller?.stripeAccountId || '').toLowerCase();
                return sellerName.includes(term) || sellerEmail.includes(term) || orderNum.includes(term) || intentId.includes(term) || stripeAcc.includes(term);
            });
        }

        // Normalize any legacy statuses on returned records
        const normalizedPayouts = filteredPayouts.map(p => {
            const obj = typeof p.toObject === 'function' ? p.toObject() : { ...p };
            if (obj.status === 'Approved' || obj.status === 'APPROVED') {
                obj.status = 'Pending';
            } else if (obj.status === 'Holding') {
                obj.status = 'Held';
            }
            return obj;
        });

        // Calculate summary KPI totals for admin header
        const allPayouts = await Payout.find();
        let totalPending = 0;
        let totalReleased = 0;
        let totalHeld = 0;
        let totalFailed = 0;

        allPayouts.forEach(p => {
            let st = p.status;
            if (st === 'Approved' || st === 'APPROVED') st = 'Pending';
            if (st === 'Holding') st = 'Held';

            if (st === 'Pending') totalPending += p.netAmount;
            if (st === 'Released') totalReleased += p.netAmount;
            if (st === 'Held') totalHeld += p.netAmount;
            if (st === 'Failed') totalFailed += p.netAmount;
        });

        return res.json({
            success: true,
            pagination: {
                total: totalCount,
                page: Number(page),
                pages: Math.ceil(totalCount / Number(limit))
            },
            metrics: {
                totalPending,
                totalReleased,
                totalHeld,
                totalFailed
            },
            data: normalizedPayouts
        });
    } catch (err) {
        console.error('[get-admin-payouts-error]', err);
        return res.status(500).json({ success: false, error: err.message || 'Failed to fetch payouts' });
    }
};

// @desc    Admin: Release Payout to Seller via Stripe Transfer
// @route   POST /api/payouts/admin/:id/release
// @access  Private (Admin)
exports.releasePayout = async (req, res) => {
    try {
        const payout = await Payout.findById(req.params.id)
            .populate('seller')
            .populate('order');

        if (!payout) {
            return res.status(404).json({ success: false, error: 'Payout record not found' });
        }

        // STRICT VALIDATIONS: Prevent duplicate payout release
        if (payout.status === 'Released' || payout.releasedAt) {
            return res.status(400).json({ success: false, error: 'Payout has already been released' });
        }

        if (payout.netAmount <= 0) {
            return res.status(400).json({ success: false, error: 'Payout net amount must be greater than zero' });
        }

        const order = payout.order;
        if (!order) {
            return res.status(400).json({ success: false, error: 'Associated order not found' });
        }

        // Validate Order Status = Completed / Delivered
        const orderStatus = (order.status || '').toLowerCase();
        if (!['completed', 'delivered'].includes(orderStatus)) {
            return res.status(400).json({ success: false, error: `Order must be Completed or Delivered before releasing payment (Current: ${order.status})` });
        }

        // Validate Payment Status (buyer's payment lifecycle)
        let orderPaymentStatus = (order.paymentStatus || '').trim();
        let lowerPayStatus = orderPaymentStatus.toLowerCase();

        if (['released', 'held', 'holding'].includes(lowerPayStatus)) {
            order.paymentStatus = 'Paid';
            await order.save();
            orderPaymentStatus = 'Paid';
            lowerPayStatus = 'paid';
        }

        const validPaidStatuses = ['paid', 'payment verified', 'verified', 'completed'];
        if (!validPaidStatuses.includes(lowerPayStatus)) {
            return res.status(400).json({ success: false, error: `Order payment status must be Paid before releasing payout (Current: ${order.paymentStatus})` });
        }

        // Validate Active Dispute
        const activeDispute = await Dispute.findOne({
            order: order._id,
            status: { $in: ['Open', 'Under Review', 'Escalated'] }
        });

        if (activeDispute || payout.disputeHold) {
            payout.status = 'Held';
            payout.disputeHold = true;
            payout.disputeHoldReason = 'Held Due To Active Dispute';
            await payout.save();
            return res.status(400).json({ success: false, error: 'Cannot release payment: Held Due To Active Dispute' });
        }

        // Validate Seller & Stripe Connect Onboarding & Verification Status
        const seller = payout.seller;
        if (!seller) {
            return res.status(400).json({ success: false, error: 'Seller account not found' });
        }

        if (!seller.stripeAccountId) {
            return res.status(400).json({
                success: false,
                error: `Cannot release payout: Seller "${seller.name || seller.email}" has not connected a Stripe Connect account.`
            });
        }

        // Sync fresh Stripe Connect account status from Stripe API
        await stripeConnectService.syncAccountStatus(seller._id);
        const refreshedSeller = await User.findById(seller._id);

        if (!refreshedSeller || !refreshedSeller.stripeAccountId) {
            return res.status(400).json({
                success: false,
                error: `Cannot release payout: Seller "${seller.name || seller.email}" does not have a valid connected Stripe account.`
            });
        }

        if (!refreshedSeller.stripeOnboardingCompleted) {
            return res.status(400).json({
                success: false,
                error: `Cannot release payout: Seller "${refreshedSeller.name}" has not completed Stripe Connect onboarding.`
            });
        }

        if (!refreshedSeller.stripeChargesEnabled) {
            return res.status(400).json({
                success: false,
                error: `Cannot release payout: Seller "${refreshedSeller.name}" Stripe account charges are not enabled.`
            });
        }

        if (!refreshedSeller.stripePayoutsEnabled) {
            return res.status(400).json({
                success: false,
                error: `Cannot release payout: Seller "${refreshedSeller.name}" Stripe account payouts are not enabled.`
            });
        }

        if (refreshedSeller.stripeAccountStatus !== 'Verified') {
            return res.status(400).json({
                success: false,
                error: `Cannot release payout: Seller "${refreshedSeller.name}" Stripe Connect account status is "${refreshedSeller.stripeAccountStatus || 'Unverified'}". Account must be fully Verified before payouts can be released.`
            });
        }

        // 1. Retrieve exchange rate and convert PKR -> EUR
        let conversionData;
        try {
            conversionData = await exchangeRateService.convertPkrToEur(payout.netAmount);
        } catch (convErr) {
            console.error('[exchange-rate-failed]', convErr);
            payout.transferError = `Exchange rate retrieval failed: ${convErr.message}`;
            await payout.save();
            return res.status(400).json({ success: false, error: `Exchange rate retrieval failed: ${convErr.message}` });
        }

        // 2. Create Stripe Transfer in EUR
        let transfer;
        try {
            transfer = await stripeConnectService.createTransferToConnectedAccount(
                refreshedSeller.stripeAccountId,
                conversionData.amountEur,
                'eur',
                order.orderNumber || order._id
            );
        } catch (stripeErr) {
            console.error('[stripe-transfer-failed]', stripeErr);
            payout.transferError = stripeErr.message;
            await payout.save();
            return res.status(400).json({ success: false, error: `Stripe transfer failed: ${stripeErr.message}` });
        }

        // 3. Update Payout Status & audit fields in DB permanently
        payout.status = 'Released';
        payout.transferId = transfer.id;
        payout.stripeTransferId = transfer.id;
        if (conversionData) {
            payout.transferredAmountEur = conversionData.amountEur;
            payout.exchangeRateUsed = conversionData.pkrPerEur;
            payout.stripeTransferCurrency = 'eur';
        }
        payout.transferError = null;
        payout.releasedAt = new Date();
        payout.releasedBy = req.user.id;
        payout.notes = `Released by Admin via Stripe Transfer ${transfer.id} (€${conversionData.amountEur.toFixed(2)} EUR @ 1 EUR = ${conversionData.pkrPerEur.toFixed(2)} PKR)`;
        await payout.save();

        // Notify Seller
        try {
            await createNotification({
                user: seller._id,
                title: 'Payment Released',
                message: `Payment of PKR ${payout.netAmount.toLocaleString()} for Order #${order.orderNumber || String(order._id).slice(-6)} has been released.`,
                type: 'payout'
            });
        } catch (notifErr) {
            console.warn('[payout-notification-warning]', notifErr.message);
        }

        return res.json({
            success: true,
            message: `Successfully released payout of PKR ${payout.netAmount.toLocaleString()} to ${seller.name}`,
            data: payout
        });
    } catch (err) {
        console.error('[release-payout-error]', err);
        return res.status(500).json({ success: false, error: err.message || 'Failed to release payout' });
    }
};

// @desc    Admin: Hold Payout
// @route   POST /api/payouts/admin/:id/hold
// @access  Private (Admin)
exports.holdPayout = async (req, res) => {
    try {
        const { reason } = req.body;
        const payout = await Payout.findById(req.params.id);
        if (!payout) {
            return res.status(404).json({ success: false, error: 'Payout record not found' });
        }

        if (payout.status === 'Released') {
            return res.status(400).json({ success: false, error: 'Cannot hold a payout that has already been released' });
        }

        payout.status = 'Held';
        payout.notes = reason || 'Placed on manual hold by Admin';
        await payout.save();

        return res.json({ success: true, message: 'Payout placed on hold', data: payout });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message || 'Failed to hold payout' });
    }
};

// @desc    Admin: Unhold / Cancel Hold on Payout
// @route   POST /api/payouts/admin/:id/unhold
// @access  Private (Admin)
exports.unholdPayout = async (req, res) => {
    try {
        const payout = await Payout.findById(req.params.id).populate('order');
        if (!payout) {
            return res.status(404).json({ success: false, error: 'Payout record not found' });
        }

        if (payout.status === 'Released') {
            return res.status(400).json({ success: false, error: 'Payout is already released' });
        }

        const activeDispute = await Dispute.findOne({
            order: payout.order?._id,
            status: { $in: ['Open', 'Under Review', 'Escalated', 'open', 'under_review', 'investigating', 'awaiting_seller', 'seller_responded'] }
        });

        if (activeDispute) {
            return res.status(400).json({ success: false, error: 'Cannot cancel hold: An active dispute is currently open on this order.' });
        }

        payout.status = 'Pending';
        payout.disputeHold = false;
        payout.disputeHoldReason = '';
        payout.notes = `Hold cancelled by Admin on ${new Date().toLocaleDateString()}`;
        await payout.save();

        return res.json({ success: true, message: 'Hold cancelled successfully. Payout status is now Pending.', data: payout });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message || 'Failed to cancel hold' });
    }
};

// @desc    Admin: Cancel Payout
// @route   POST /api/payouts/admin/:id/cancel
// @access  Private (Admin)
exports.cancelPayout = async (req, res) => {
    try {
        const { cancellationReason, adminNotes } = req.body;

        if (!cancellationReason || !cancellationReason.trim()) {
            return res.status(400).json({ success: false, error: 'Cancellation reason is required.' });
        }

        const payout = await Payout.findById(req.params.id).populate('order seller');
        if (!payout) {
            return res.status(404).json({ success: false, error: 'Payout record not found' });
        }

        if (payout.status === 'Released') {
            return res.status(400).json({ success: false, error: 'Cannot cancel a payout that has already been released' });
        }

        payout.status = 'Cancelled';
        payout.notes = `Reason: ${cancellationReason.trim()}${adminNotes ? `. Notes: ${adminNotes.trim()}` : ''}`;
        await payout.save();

        if (payout.seller) {
            try {
                await createNotification({
                    user: payout.seller._id,
                    title: 'Payout Cancelled',
                    message: `Payout for Order #${payout.order?.orderNumber || String(payout.order?._id).slice(-6)} was cancelled by Admin. Reason: ${cancellationReason.trim()}`,
                    type: 'payout'
                });
            } catch (notifErr) {
                console.warn('[cancel-payout-notification-warning]', notifErr.message);
            }
        }

        return res.json({ success: true, message: 'Payout cancelled successfully.', data: payout });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message || 'Failed to cancel payout' });
    }
};

exports.createOrderPayouts = createOrderPayouts;
