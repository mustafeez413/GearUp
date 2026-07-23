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

const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const Refund = require('../models/Refund');
const mongoose = require('mongoose');

async function refundOrderTransactionally(orderId, reason = 'Customer requested refund') {
    let session = null;
    try {
        session = await mongoose.startSession();
        session.startTransaction();
    } catch (sessionErr) {
        console.warn('[refund-transaction] MongoDB sessions not supported, running without transaction:', sessionErr.message);
        session = null;
    }

    try {
        const queryOptions = session ? { session } : {};

        const order = await Order.findById(orderId).session(session || null);
        if (!order) {
            if (session) await session.commitTransaction();
            return;
        }

        if (order.paymentStatus === 'Refunded' || order.paymentStatus === 'refunded') {
            if (session) await session.commitTransaction();
            return;
        }

        // 1. Get transactions
        const txs = await Transaction.find({ order: orderId, status: { $in: ['Completed', 'Pending', 'Hold', 'Paid', 'Held', 'Released'] } }).session(session || null);
        
        // 2. Fetch refund policy settings
        const Settings = require('../models/Settings');
        const settings = await Settings.findOne().session(session || null) || { refundDeductionPolicy: 'full' };
        const isFullRefund = settings.refundDeductionPolicy === 'full';

        const refunds = [];
        for (const tx of txs) {
            let commissionRefunded = 0;
            let sellerDeducted = tx.sellerAmount;

            if (isFullRefund) {
                commissionRefunded = tx.deductedCommission;
            }

            const refund = await Refund.create([{
                order: orderId,
                seller: tx.seller,
                buyer: tx.buyer,
                refundAmount: isFullRefund ? tx.totalAmount : tx.sellerAmount,
                commissionRefunded,
                sellerDeductedAmount: sellerDeducted,
                reason,
                status: 'Approved'
            }], queryOptions);

            // Update original transaction status to Refunded
            tx.status = 'Refunded';
            await tx.save(queryOptions);

            // Insert new refund entry in transaction log
            await Transaction.create([{
                order: orderId,
                seller: tx.seller,
                buyer: tx.buyer,
                totalAmount: -(isFullRefund ? tx.totalAmount : tx.sellerAmount),
                deductedCommission: -commissionRefunded,
                sellerAmount: -sellerDeducted,
                commissionPercentage: tx.commissionPercentage,
                status: 'Completed',
                type: 'refund'
            }], queryOptions);

            refunds.push(refund[0]);
        }

        // 3. Update order status
        order.status = 'cancelled';
        order.paymentStatus = 'refunded';
        await order.save(queryOptions);

        // 4. Mark Payouts Refunded
        await Payout.updateMany(
            { order: orderId },
            {
                $set: {
                    status: 'Refunded',
                    grossAmount: 0,
                    commission: 0,
                    netAmount: 0,
                },
            },
            queryOptions
        );

        // 5. Reverse order payment transactions
        const totalCommissionRefunded = refunds.reduce((sum, r) => sum + (r.commissionRefunded || 0), 0);
        const totalRefundAmount = refunds.reduce((sum, r) => sum + (r.refundAmount || 0), 0);
        
        const { reverseOrderPaymentTransactions } = require('./orderTransactionSync');
        await reverseOrderPaymentTransactions(order, totalCommissionRefunded, totalRefundAmount, queryOptions);

        if (session) {
            await session.commitTransaction();
        }
        return refunds;
    } catch (err) {
        if (session) {
            await session.abortTransaction();
        }
        console.error('[refund-transaction] Refund transaction aborted:', err);
        throw err;
    } finally {
        if (session) {
            session.endSession();
        }
    }
}

async function releaseOrderPaymentTransactionally(orderId) {
    let session = null;
    try {
        session = await mongoose.startSession();
        session.startTransaction();
    } catch (sessionErr) {
        console.warn('[payout-release] MongoDB sessions not supported, running without transaction:', sessionErr.message);
        session = null;
    }

    try {
        const queryOptions = session ? { session } : {};

        // 1. Update Order paymentStatus to 'Released'
        const order = await Order.findById(orderId).session(session || null);
        if (order) {
            order.paymentStatus = 'Released';
            await order.save(queryOptions);
        }

        // 2. Update Payouts to Approved
        await Payout.updateMany(
            { order: orderId, status: { $nin: ['Approved', 'Paid', 'Cancelled', 'Refunded'] } },
            { $set: { status: 'Approved', paymentDate: new Date() } },
            queryOptions
        );

        // 3. Update Transactions to Released
        await Transaction.updateMany(
            { order: orderId, status: { $in: ['Held', 'Pending', 'Paid'] } },
            { $set: { status: 'Released' } },
            queryOptions
        );

        if (session) {
            await session.commitTransaction();
        }
    } catch (err) {
        if (session) {
            await session.abortTransaction();
        }
        console.error('[payout-release] Transaction aborted:', err);
        throw err;
    } finally {
        if (session) {
            session.endSession();
        }
    }
}

module.exports = {
    refundOrderTransactionally,
    releaseOrderPaymentTransactionally,
    markPayoutsApprovedForOrder,
    markPayoutsRefundedForOrder,
    markPayoutsHoldingForOrder,
    APPROVED_STATUSES,
    REFUNDED_STATUSES,
    HOLDING_STATUSES,
};
