const Payout = require('../models/Payout');

const APPROVED_STATUSES = ['Paid', 'Approved'];
const REFUNDED_STATUSES = ['Cancelled', 'Refunded'];
const HOLDING_STATUSES = ['Pending', 'Holding'];

function buildPayoutQuery(orderId, sellerId) {
    const query = { order: orderId };
    if (sellerId) query.seller = sellerId;
    return query;
}

async function markPayoutsApprovedForOrder(orderId, sellerId = null) {
    const query = buildPayoutQuery(orderId, sellerId);
    return Payout.updateMany(
        { ...query, status: { $nin: [...APPROVED_STATUSES, ...REFUNDED_STATUSES] } },
        { $set: { status: 'Approved', paymentDate: new Date() } }
    );
}

async function markPayoutsRefundedForOrder(orderId, sellerId = null) {
    const query = buildPayoutQuery(orderId, sellerId);
    return Payout.updateMany(query, {
        $set: {
            status: 'Refunded',
            grossAmount: 0,
            commission: 0,
            netAmount: 0,
        },
    });
}

async function markPayoutsHoldingForOrder(orderId, sellerId = null) {
    const query = buildPayoutQuery(orderId, sellerId);
    return Payout.updateMany(
        { ...query, status: { $nin: [...APPROVED_STATUSES, ...REFUNDED_STATUSES] } },
        { $set: { status: 'Holding' } }
    );
}

module.exports = {
    markPayoutsApprovedForOrder,
    markPayoutsRefundedForOrder,
    markPayoutsHoldingForOrder,
    APPROVED_STATUSES,
    REFUNDED_STATUSES,
    HOLDING_STATUSES,
};
