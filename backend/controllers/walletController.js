const WalletLedger = require('../models/WalletLedger');
const Escrow = require('../models/Escrow');
const {
    getOrCreateWallet,
    getWalletSummary,
    withdrawFromWallet,
    getAdminWalletStats
} = require('../services/walletService');

exports.getMyWallet = async (req, res) => {
    try {
        const summary = await getWalletSummary(req.user.id);
        res.status(200).json({
            success: true,
            data: {
                balance: summary.wallet.balance,
                escrowBalance: summary.wallet.escrowBalance,
                currency: summary.wallet.currency,
                totalEarnings: summary.totalEarnings,
                role: summary.role
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.getMyEscrows = async (req, res) => {
    try {
        const summary = await getWalletSummary(req.user.id);
        const escrows = summary.escrows.map((e) => ({
            _id: e._id,
            orderId: e.order?._id || e.order,
            orderShortId: e.order?._id ? e.order._id.toString().slice(-6).toUpperCase() : '',
            buyerName: e.buyer?.name || e.buyer?.businessDetails?.businessName || 'Buyer',
            amount: e.amount,
            status: e.status,
            createdAt: e.createdAt,
            releasedAt: e.releasedAt
        }));
        res.status(200).json({ success: true, data: escrows });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.getMyLedger = async (req, res) => {
    try {
        await getOrCreateWallet(req.user.id, req.user.role);
        const entries = await WalletLedger.find({ user: req.user.id })
            .sort('-createdAt')
            .limit(100)
            .populate('order', '_id totalAmount status')
            .populate('counterparty', 'name');
        res.status(200).json({ success: true, data: entries });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.withdraw = async (req, res) => {
    try {
        const { amount } = req.body;
        const result = await withdrawFromWallet(req.user.id, amount);
        res.status(200).json({
            success: true,
            data: {
                ...result,
                balance: result.balance
            },
            message: 'Prototype withdrawal recorded. No real funds were transferred.'
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.getAdminStats = async (req, res) => {
    try {
        const stats = await getAdminWalletStats();
        const recent = await WalletLedger.find()
            .sort('-createdAt')
            .limit(50)
            .populate('user', 'name email role')
            .populate('order', '_id')
            .populate('counterparty', 'name');
        res.status(200).json({ success: true, data: { stats, recent } });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.getAdminEscrows = async (req, res) => {
    try {
        const Order = require('../models/Order');
        const Dispute = require('../models/Dispute');
        const {
            loadOperationsContext,
            reconcileAllOperations,
            computeUnifiedOperationsStats,
            computeEscrowMetrics,
            mapEscrowAdminStatus,
            buildRefundedOrderIds,
        } = require('../utils/operationStatus');

        const ctx = await loadOperationsContext();
        const orders = await Order.find().lean();
        await reconcileAllOperations(orders, [], ctx);

        const escrows = await Escrow.find()
            .sort('-createdAt')
            .populate('buyer', 'name email')
            .populate('seller', 'name email businessDetails')
            .populate('order', '_id totalAmount status paymentStatus paymentMethod');

        const disputes = await Dispute.find().select('status order').lean();
        const walletStats = await getAdminWalletStats();
        const operationsSummary = computeUnifiedOperationsStats(orders, [], escrows, disputes, ctx);
        const refundedOrderIds = buildRefundedOrderIds(orders, ctx);

        const metrics = computeEscrowMetrics(
            escrows.map((e) => e.toObject()),
            disputes,
            walletStats,
            refundedOrderIds
        );
        metrics.refunded = operationsSummary.refundedOrders;

        const enriched = escrows.map((e) => {
            const obj = e.toObject();
            const orderId = String(obj.order?._id || obj.order || '');
            obj.resolvedEscrowStatus = mapEscrowAdminStatus(obj.status, refundedOrderIds.has(orderId));
            return obj;
        });

        res.status(200).json({ success: true, metrics, operationsSummary, data: enriched });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
