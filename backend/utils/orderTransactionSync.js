const Transaction = require('../models/Transaction');
const User = require('../models/User');

/**
 * Create commission Transaction records.
 */
async function recordOrderPaymentTransactions(order) {
    if (!order?._id) return;

    const buyerId = order.buyer?._id || order.buyer;
    const commissionRate = Number(order.commissionRate) || 0;
    const paymentMethod = order.paymentMethod || 'Bank Transfer';

    for (const stat of order.sellerStats || []) {
        const sellerId = stat.seller?._id || stat.seller;
        if (!sellerId) continue;

        const existingTx = await Transaction.findOne({ order: order._id, seller: sellerId, type: 'payout' });
        if (existingTx) continue;

        await Transaction.create({
            order: order._id,
            seller: sellerId,
            buyer: buyerId,
            totalAmount: stat.subtotal || 0,
            deductedCommission: stat.platformCommission || 0,
            sellerAmount: stat.sellerReceivable || 0,
            commissionPercentage: commissionRate,
            paymentMethod,
            status: paymentMethod === 'card_payment' ? 'Held' : 'Completed',
            paidDate: new Date(),
            type: 'payout'
        });
    }
}

/**
 * Mark transactions refunded and reverse admin commission on refund.
 */
async function reverseOrderPaymentTransactions(order, commissionRefunded = 0, refundAmount = 0, options = {}) {
    if (!order?._id) return;

    await Transaction.updateMany(
        { order: order._id, status: { $in: ['Completed', 'Pending', 'Paid', 'Held', 'Released', 'held', 'released'] } },
        { status: 'Refunded' },
        options
    );

    const commissionToReverse = Number(commissionRefunded) || Number(order.platformCommissionTotal) || 0;
    if (commissionToReverse <= 0) return;

    const admin = await User.findOne({ role: 'admin' }).select('_id').session(options.session || null);
    if (!admin) return;



    if (refundAmount > 0) {
        await Transaction.create([{
            order: order._id,
            seller: order.sellerStats?.[0]?.seller || admin._id,
            buyer: order.buyer,
            totalAmount: -Math.abs(refundAmount),
            deductedCommission: -Math.abs(commissionToReverse),
            sellerAmount: -Math.abs(refundAmount - commissionToReverse),
            commissionPercentage: order.commissionRate || 0,
            paymentMethod: order.paymentMethod || 'Refund',
            status: 'Refunded',
            type: 'refund'
        }], options);
    }
}

module.exports = { recordOrderPaymentTransactions, reverseOrderPaymentTransactions };
