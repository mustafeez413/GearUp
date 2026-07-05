const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const WalletLedger = require('../models/WalletLedger');
const { getOrCreateWallet } = require('../services/walletService');

/**
 * Create commission Transaction records and credit admin wallet when payment is verified.
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
            status: 'Completed',
            paidDate: new Date(),
            type: 'payout'
        });
    }

    const totalCommission = Number(order.platformCommissionTotal) || 0;
    if (totalCommission <= 0) return;

    const admin = await User.findOne({ role: 'admin' }).select('_id');
    if (!admin) return;

    const existingCommission = await WalletLedger.findOne({
        order: order._id,
        user: admin._id,
        type: 'adjustment',
        description: { $regex: /Platform commission/i }
    });
    if (existingCommission) return;

    const adminWallet = await getOrCreateWallet(admin._id, 'admin');
    adminWallet.balance = (adminWallet.balance || 0) + totalCommission;
    await adminWallet.save();

    await WalletLedger.create({
        user: admin._id,
        order: order._id,
        amount: totalCommission,
        direction: 'credit',
        type: 'adjustment',
        status: 'COMPLETED',
        description: `Platform commission for order #${order._id.toString().slice(-6)}`
    });
}

/**
 * Mark transactions refunded and reverse admin commission on refund.
 */
async function reverseOrderPaymentTransactions(order, commissionRefunded = 0, refundAmount = 0) {
    if (!order?._id) return;

    await Transaction.updateMany(
        { order: order._id, status: { $in: ['Completed', 'Pending', 'Paid'] } },
        { status: 'Refunded' }
    );

    const commissionToReverse = Number(commissionRefunded) || Number(order.platformCommissionTotal) || 0;
    if (commissionToReverse <= 0) return;

    const admin = await User.findOne({ role: 'admin' }).select('_id');
    if (!admin) return;

    const adminWallet = await Wallet.findOne({ user: admin._id });
    if (!adminWallet) return;

    adminWallet.balance = Math.max(0, (adminWallet.balance || 0) - commissionToReverse);
    await adminWallet.save();

    await WalletLedger.create({
        user: admin._id,
        order: order._id,
        amount: commissionToReverse,
        direction: 'debit',
        type: 'adjustment',
        status: 'COMPLETED',
        description: `Commission reversed for refund on order #${order._id.toString().slice(-6)}`
    });

    if (refundAmount > 0) {
        await Transaction.create({
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
        });
    }
}

module.exports = { recordOrderPaymentTransactions, reverseOrderPaymentTransactions };
