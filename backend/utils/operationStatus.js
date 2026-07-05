/**
 * Centralized operations status resolution — single source of truth for
 * Payments, Payouts, Escrow, Disputes, and Orders admin views.
 */

const PAYMENT_STATUS = {
    PENDING_VERIFICATION: 'pending_verification',
    VERIFIED: 'verified',
    REJECTED: 'rejected',
    REFUNDED: 'refunded',
    AWAITING_PAYMENT: 'awaiting_payment',
};

const PAYOUT_STATUS = {
    HOLDING: 'Holding',
    APPROVED: 'Approved',
    REFUNDED: 'Refunded',
};

const PAYMENT_LABELS = {
    pending_verification: 'Pending Verification',
    verified: 'Verified',
    rejected: 'Rejected',
    refunded: 'Refunded To Buyer',
    awaiting_payment: 'Awaiting Payment',
};

const PAYOUT_LABELS = {
    Holding: 'Holding',
    Approved: 'Approved',
    Refunded: 'Refunded',
};

function normalizeRawPaymentStatus(raw) {
    const key = String(raw || '').toLowerCase().replace(/\s+/g, '_');
    const map = {
        pending_payment: PAYMENT_STATUS.AWAITING_PAYMENT,
        pending: PAYMENT_STATUS.AWAITING_PAYMENT,
        pending_approval: PAYMENT_STATUS.PENDING_VERIFICATION,
        verified: PAYMENT_STATUS.VERIFIED,
        payment_verified: PAYMENT_STATUS.VERIFIED,
        rejected: PAYMENT_STATUS.REJECTED,
        refunded: PAYMENT_STATUS.REFUNDED,
    };
    if (map[key]) return map[key];
    if (key.includes('pending') && key.includes('approval')) return PAYMENT_STATUS.PENDING_VERIFICATION;
    if (key.includes('payment') && key.includes('verified')) return PAYMENT_STATUS.VERIFIED;
    if (key.includes('refund')) return PAYMENT_STATUS.REFUNDED;
    if (key.includes('reject')) return PAYMENT_STATUS.REJECTED;
    return PAYMENT_STATUS.AWAITING_PAYMENT;
}

function buildOperationsContext({ disputes = [], refunds = [], escrows = [] } = {}) {
    const disputesByOrder = new Map();
    disputes.forEach((d) => {
        const oid = String(d.order?._id || d.order || '');
        if (!oid) return;
        if (!disputesByOrder.has(oid)) disputesByOrder.set(oid, []);
        disputesByOrder.get(oid).push(d);
    });

    const refundsByOrder = new Map();
    refunds.forEach((r) => {
        const oid = String(r.order?._id || r.order || '');
        if (!oid) return;
        if (!refundsByOrder.has(oid)) refundsByOrder.set(oid, []);
        refundsByOrder.get(oid).push(r);
    });

    const escrowsByOrderSeller = new Map();
    const escrowsByOrder = new Map();
    escrows.forEach((e) => {
        const oid = String(e.order?._id || e.order || '');
        const sid = String(e.seller?._id || e.seller || '');
        if (oid) {
            if (!escrowsByOrder.has(oid)) escrowsByOrder.set(oid, []);
            escrowsByOrder.get(oid).push(e);
        }
        if (oid && sid) escrowsByOrderSeller.set(`${oid}:${sid}`, e);
    });

    return { disputesByOrder, refundsByOrder, escrowsByOrderSeller, escrowsByOrder };
}

async function loadOperationsContext() {
    const Dispute = require('../models/Dispute');
    const Refund = require('../models/Refund');
    const Escrow = require('../models/Escrow');

    const [disputes, refunds, escrows] = await Promise.all([
        Dispute.find().select('order seller status refundAmount createdAt').lean(),
        Refund.find({ status: 'Approved' }).select('order seller buyer refundAmount status').lean(),
        Escrow.find().select('order seller status amount releasedAt refundedAt').lean(),
    ]);

    return buildOperationsContext({ disputes, refunds, escrows });
}

function hasRefundSignal(order, ctx) {
    const oid = String(order._id || order.id || '');
    if (normalizeRawPaymentStatus(order.paymentStatus) === PAYMENT_STATUS.REFUNDED) return true;

    const orderStatus = String(order.status || '').toLowerCase();
    if (orderStatus === 'refunded') return true;

    const orderDisputes = ctx.disputesByOrder.get(oid) || [];
    if (orderDisputes.some((d) => d.status === 'refunded')) return true;

    const orderRefunds = ctx.refundsByOrder.get(oid) || [];
    if (orderRefunds.length > 0) return true;

    if (Array.isArray(order.sellerStats) && order.sellerStats.length > 0) {
        const allRefunded = order.sellerStats.every((s) => String(s.status || '').toLowerCase() === 'refunded');
        if (allRefunded) return true;
    }

    return false;
}

function isOrderRefunded(order, ctx) {
    if (!order) return false;
    const oid = String(order._id || order.id || '');

    if (hasRefundSignal(order, ctx)) return true;

    const orderStatus = String(order.status || '').toLowerCase();
    if (orderStatus === 'cancelled' && normalizeRawPaymentStatus(order.paymentStatus) === PAYMENT_STATUS.REFUNDED) {
        return true;
    }

    const orderEscrows = ctx.escrowsByOrder.get(oid) || [];
    if (orderEscrows.length > 0 && orderEscrows.every((e) => e.status === 'REFUNDED')) return true;

    return false;
}

function buildRefundedOrderIds(orders, ctx) {
    const ids = new Set();
    (orders || []).forEach((order) => {
        if (isOrderRefunded(order, ctx)) {
            ids.add(String(order._id || order.id));
        }
    });
    return ids;
}

function resolvePaymentStatus(order, ctx) {
    if (!order) return PAYMENT_STATUS.AWAITING_PAYMENT;
    if (isOrderRefunded(order, ctx)) return PAYMENT_STATUS.REFUNDED;

    const normalized = normalizeRawPaymentStatus(order.paymentStatus);
    if (normalized === PAYMENT_STATUS.REJECTED) return PAYMENT_STATUS.REJECTED;
    if (normalized === PAYMENT_STATUS.PENDING_VERIFICATION) return PAYMENT_STATUS.PENDING_VERIFICATION;
    if (normalized === PAYMENT_STATUS.VERIFIED || order.isPaymentVerified) return PAYMENT_STATUS.VERIFIED;
    if (order.paymentProof) return PAYMENT_STATUS.PENDING_VERIFICATION;

    return normalized;
}

function resolvePayoutStatus(payout, ctx) {
    const order = payout.order || {};
    const orderId = String(order._id || payout.order || '');
    const sellerId = String(payout.seller?._id || payout.seller || '');

    if (isOrderRefunded(order, ctx)) return PAYOUT_STATUS.REFUNDED;

    const escrow = ctx.escrowsByOrderSeller.get(`${orderId}:${sellerId}`);
    if (escrow?.status === 'REFUNDED' || escrow?.status === 'CANCELLED') return PAYOUT_STATUS.REFUNDED;
    if (escrow?.status === 'RELEASED') return PAYOUT_STATUS.APPROVED;

    const sellerDisputes = (ctx.disputesByOrder.get(orderId) || []).filter(
        (d) => String(d.seller?._id || d.seller || '') === sellerId
    );
    if (sellerDisputes.some((d) => d.status === 'refunded')) return PAYOUT_STATUS.REFUNDED;

    const orderRefunds = ctx.refundsByOrder.get(orderId) || [];
    if (orderRefunds.some((r) => String(r.seller?._id || r.seller || '') === sellerId)) {
        return PAYOUT_STATUS.REFUNDED;
    }

    const stored = String(payout.status || '');
    if (['Approved', 'Paid'].includes(stored)) return PAYOUT_STATUS.APPROVED;
    if (['Refunded', 'Cancelled'].includes(stored)) return PAYOUT_STATUS.REFUNDED;

    const orderStatus = String(order.status || '').toLowerCase();
    const paymentOk =
        order.isPaymentVerified
        || normalizeRawPaymentStatus(order.paymentStatus) === PAYMENT_STATUS.VERIFIED;
    if (['completed', 'delivered'].includes(orderStatus) && paymentOk) {
        return PAYOUT_STATUS.APPROVED;
    }

    return PAYOUT_STATUS.HOLDING;
}

function getPaymentStatusLabel(status) {
    return PAYMENT_LABELS[status] || PAYMENT_LABELS.awaiting_payment;
}

function getPayoutStatusLabel(status) {
    return PAYOUT_LABELS[status] || PAYOUT_LABELS.Holding;
}

function getPaymentDisplayAmount(order, resolvedStatus) {
    const status = resolvedStatus || resolvePaymentStatus(order, buildOperationsContext());
    if (status === PAYMENT_STATUS.REFUNDED) return 0;
    return Number(order?.totalAmount) || 0;
}

function getPayoutDisplayAmounts(payout, resolvedStatus, ctx) {
    const status = resolvedStatus || resolvePayoutStatus(payout, ctx || buildOperationsContext());
    if (status === PAYOUT_STATUS.REFUNDED) {
        return { gross: 0, commission: 0, net: 0 };
    }
    return {
        gross: Number(payout.grossAmount) || 0,
        commission: Number(payout.commission) || 0,
        net: Number(payout.netAmount) || 0,
    };
}

function isPaymentReviewRecord(order, ctx) {
    const resolved = resolvePaymentStatus(order, ctx);
    if (resolved === PAYMENT_STATUS.AWAITING_PAYMENT && !order.paymentProof) return false;
    return [
        PAYMENT_STATUS.PENDING_VERIFICATION,
        PAYMENT_STATUS.VERIFIED,
        PAYMENT_STATUS.REJECTED,
        PAYMENT_STATUS.REFUNDED,
    ].includes(resolved);
}

function mapEscrowAdminStatus(status, orderRefunded = false) {
    if (orderRefunded) return 'Refunded';
    const key = String(status || '').toUpperCase();
    if (['IN_ESCROW', 'PAID', 'PENDING', 'DELIVERED'].includes(key)) return 'Active';
    if (key === 'RELEASED') return 'Released';
    if (key === 'REFUNDED' || key === 'CANCELLED') return 'Refunded';
    return 'Active';
}

function computeUnifiedOperationsStats(orders = [], payouts = [], escrows = [], disputes = [], ctx) {
    const refundedOrderIds = buildRefundedOrderIds(orders, ctx);
    const refundedOrders = refundedOrderIds.size;

    const refundedPayoutRecords = (payouts || []).filter((p) => {
        const orderId = String(p.order?._id || p.order || '');
        return refundedOrderIds.has(orderId) || resolvePayoutStatus(p, ctx) === PAYOUT_STATUS.REFUNDED;
    }).length;

    const refundedEscrowRecords = (escrows || []).filter((e) => {
        const orderId = String(e.order?._id || e.order || '');
        return refundedOrderIds.has(orderId) || mapEscrowAdminStatus(e.status) === 'Refunded';
    }).length;

    const openDisputes = (disputes || []).filter(
        (d) => !['refunded', 'rejected', 'resolved', 'closed'].includes(d.status)
    ).length;

    return {
        refundedOrders,
        refundedPayoutRecords,
        refundedEscrowRecords,
        refundedOrderIds: [...refundedOrderIds],
        openDisputes,
    };
}

function computeEscrowMetrics(escrows = [], disputes = [], walletStats = null, refundedOrderIds = null) {
    const refundedSet = refundedOrderIds instanceof Set
        ? refundedOrderIds
        : new Set(Array.isArray(refundedOrderIds) ? refundedOrderIds : []);

    const counts = { Active: 0, Released: 0, Refunded: 0 };
    let activeFunds = 0;
    let releasedFunds = 0;
    let refundedFunds = 0;

    escrows.forEach((e) => {
        const orderId = String(e.order?._id || e.order || '');
        const orderRefunded = refundedSet.has(orderId);
        const mapped = mapEscrowAdminStatus(e.status, orderRefunded);
        counts[mapped] = (counts[mapped] || 0) + 1;
        const amt = orderRefunded ? 0 : (Number(e.amount) || 0);
        if (mapped === 'Active') activeFunds += amt;
        if (mapped === 'Released') releasedFunds += amt;
        if (mapped === 'Refunded') refundedFunds += Number(e.amount) || 0;
    });

    const total = escrows.length;
    const settled = counts.Released + counts.Refunded;
    const successRate = settled > 0 ? Math.round((counts.Released / settled) * 100) : 0;
    const openDisputes = disputes.filter(
        (d) => !['refunded', 'rejected', 'resolved', 'closed'].includes(d.status)
    ).length;

    return {
        totalEscrowFunds: walletStats?.totalEscrowFunds ?? activeFunds,
        totalReleasedFunds: walletStats?.totalReleasedFunds ?? releasedFunds,
        totalRefundedFunds: walletStats?.totalRefundedFunds ?? refundedFunds,
        active: counts.Active,
        released: counts.Released,
        refunded: counts.Refunded,
        refundedOrders: refundedSet.size,
        total,
        successRate,
        openDisputes,
    };
}

async function reconcileEscrowsForRefundedOrders(orders, ctx) {
    const Escrow = require('../models/Escrow');
    const refundedOrderIds = buildRefundedOrderIds(orders, ctx);
    if (refundedOrderIds.size === 0) return { updated: 0 };

    const result = await Escrow.updateMany(
        {
            order: { $in: [...refundedOrderIds] },
            status: { $nin: ['REFUNDED', 'CANCELLED'] },
        },
        {
            $set: {
                status: 'REFUNDED',
                refundedAt: new Date(),
                amount: 0,
            },
        }
    );

    return { updated: result.modifiedCount || 0 };
}

async function reconcileAllOperations(orders, payouts, ctx) {
    const Payout = require('../models/Payout');
    const refundedOrderIds = buildRefundedOrderIds(orders, ctx);

    await reconcileEscrowsForRefundedOrders(orders, ctx);

    if (refundedOrderIds.size > 0) {
        await Payout.updateMany(
            { order: { $in: [...refundedOrderIds] } },
            { $set: { status: PAYOUT_STATUS.REFUNDED, grossAmount: 0, commission: 0, netAmount: 0 } }
        );
    }

    const refreshedPayouts = await Payout.find()
        .populate('order', 'status paymentStatus isPaymentVerified sellerStats')
        .lean();

    const reconciledPayouts = await Promise.all(
        refreshedPayouts.map((p) => reconcilePayoutRecord(p, ctx))
    );

    return { refundedOrderIds, reconciledPayouts };
}

async function reconcilePayoutRecord(payout, ctx) {
    const Payout = require('../models/Payout');
    const resolved = resolvePayoutStatus(payout, ctx);
    const amounts = getPayoutDisplayAmounts(payout, resolved, ctx);
    const updates = { status: resolved };

    if (resolved === PAYOUT_STATUS.REFUNDED) {
        updates.grossAmount = 0;
        updates.commission = 0;
        updates.netAmount = 0;
    }

    const stored = String(payout.status || '');
    const needsUpdate =
        stored !== resolved
        || (resolved === PAYOUT_STATUS.REFUNDED && payout.netAmount !== 0);

    if (needsUpdate) {
        await Payout.findByIdAndUpdate(payout._id, {
            $set: {
                ...updates,
                ...(resolved === PAYOUT_STATUS.APPROVED && !payout.paymentDate
                    ? { paymentDate: new Date() }
                    : {}),
            },
        });
        Object.assign(payout, updates);
    }

    return {
        ...payout,
        resolvedPayoutStatus: resolved,
        payoutStatusLabel: getPayoutStatusLabel(resolved),
        displayAmounts: amounts,
    };
}

async function reconcileOrderPaymentStatus(order, ctx) {
    const Order = require('../models/Order');
    const resolved = resolvePaymentStatus(order, ctx);
    const canonicalPaymentStatus = {
        pending_verification: 'pending_approval',
        verified: 'verified',
        rejected: 'rejected',
        refunded: 'refunded',
        awaiting_payment: 'pending',
    }[resolved];

    const current = normalizeRawPaymentStatus(order.paymentStatus);
    const shouldPersist =
        resolved === PAYMENT_STATUS.REFUNDED && current !== PAYMENT_STATUS.REFUNDED;

    if (shouldPersist && canonicalPaymentStatus) {
        await Order.findByIdAndUpdate(order._id, {
            $set: { paymentStatus: canonicalPaymentStatus },
        });
        order.paymentStatus = canonicalPaymentStatus;
    }

    return {
        ...order,
        resolvedPaymentStatus: resolved,
        paymentStatusLabel: getPaymentStatusLabel(resolved),
        displayAmount: getPaymentDisplayAmount(order, resolved),
    };
}

module.exports = {
    PAYMENT_STATUS,
    PAYOUT_STATUS,
    normalizeRawPaymentStatus,
    buildOperationsContext,
    loadOperationsContext,
    hasRefundSignal,
    isOrderRefunded,
    buildRefundedOrderIds,
    resolvePaymentStatus,
    resolvePayoutStatus,
    getPaymentStatusLabel,
    getPayoutStatusLabel,
    getPaymentDisplayAmount,
    getPayoutDisplayAmounts,
    isPaymentReviewRecord,
    mapEscrowAdminStatus,
    computeUnifiedOperationsStats,
    computeEscrowMetrics,
    reconcileEscrowsForRefundedOrders,
    reconcileAllOperations,
    reconcilePayoutRecord,
    reconcileOrderPaymentStatus,
};
