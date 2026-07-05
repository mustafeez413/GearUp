const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const Escrow = require('../models/Escrow');
const WalletLedger = require('../models/WalletLedger');
const User = require('../models/User');

/** Prototype dummy balance for every wallet (PKR). */
const PROTOTYPE_WALLET_BALANCE = 100000;

const buyerRoles = new Set(['wholesaler', 'manufacturer']);
const sellerRoles = new Set(['manufacturer']);

function isBuyerRole(role) {
    return buyerRoles.has(role);
}

function isSellerRole(role) {
    return role === 'manufacturer';
}

/**
 * Ensure wallet exists; seed dummy balance for buyers on first create.
 */
async function getOrCreateWallet(userId, role) {
    let wallet = await Wallet.findOne({ user: userId });
    if (wallet) return wallet;

    const user = await User.findById(userId).select('role');
    const effectiveRole = role || user?.role;
    const isAdmin = effectiveRole === 'admin';
    const seedBalance = isAdmin ? 0 : PROTOTYPE_WALLET_BALANCE;

    const initial = {
        user: userId,
        balance: seedBalance,
        escrowBalance: 0,
        availableBalance: 0
    };

    wallet = await Wallet.create(initial);

    if (!isAdmin && seedBalance > 0) {
        await WalletLedger.create({
            user: userId,
            amount: seedBalance,
            direction: 'credit',
            type: 'seed_balance',
            status: 'COMPLETED',
            description: 'Prototype dummy wallet starting balance (PKR 100,000)'
        });
    }

    return wallet;
}

async function getWalletSummary(userId) {
    const user = await User.findById(userId).select('role name');
    const wallet = await getOrCreateWallet(userId, user?.role);

    const escrows = await Escrow.find({ seller: userId })
        .populate('order', '_id createdAt status')
        .populate('buyer', 'name businessDetails')
        .sort('-createdAt')
        .limit(50);

    const totalEarnings = await Escrow.aggregate([
        { $match: { seller: new mongoose.Types.ObjectId(userId), status: { $in: ['IN_ESCROW', 'RELEASED', 'DELIVERED'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    return {
        wallet,
        role: user?.role,
        escrows,
        totalEarnings: totalEarnings[0]?.total || 0
    };
}

/**
 * Pay for order from buyer dummy wallet; split escrow per seller.
 */
async function processWalletPayment(order, buyerId) {
    const existing = await Escrow.findOne({ order: order._id });
    if (existing) {
        throw new Error('Payment already processed for this order.');
    }

    await getOrCreateWallet(buyerId);
    const total = Number(order.totalAmount) || 0;

    if (total <= 0) {
        throw new Error('Invalid order amount.');
    }

    const buyerWallet = await Wallet.findOneAndUpdate(
        { user: buyerId, balance: { $gte: total } },
        { $inc: { balance: -total } },
        { new: true }
    );

    if (!buyerWallet) {
        const current = await Wallet.findOne({ user: buyerId });
        const available = current?.balance ?? 0;
        throw new Error(
            `Insufficient wallet balance. Required PKR ${total.toLocaleString()}, available PKR ${available.toLocaleString()}.`
        );
    }

    await WalletLedger.create({
        user: buyerId,
        order: order._id,
        amount: total,
        direction: 'debit',
        type: 'payment_deduct',
        status: 'IN_ESCROW',
        description: `Payment for order #${order._id.toString().slice(-6)}`
    });

    for (const stat of order.sellerStats || []) {
        const sellerId = stat.seller?._id || stat.seller;
        const amount = Number(stat.sellerReceivable ?? stat.subtotal ?? 0);
        if (!sellerId || amount <= 0) continue;

        const sellerWallet = await getOrCreateWallet(sellerId);
        sellerWallet.escrowBalance += amount;
        await sellerWallet.save();

        const escrow = await Escrow.create({
            order: order._id,
            buyer: buyerId,
            seller: sellerId,
            amount,
            status: 'IN_ESCROW'
        });

        await WalletLedger.create({
            user: sellerId,
            counterparty: buyerId,
            order: order._id,
            escrow: escrow._id,
            amount,
            direction: 'credit',
            type: 'escrow_credit',
            status: 'IN_ESCROW',
            description: `Escrow hold for order #${order._id.toString().slice(-6)}`
        });
    }

    return { success: true, amountPaid: total };
}

async function releaseSingleEscrow(escrow, buyerId) {
    if (escrow.status === 'RELEASED') {
        return { skipped: true, amount: 0 };
    }
    if (escrow.status === 'REFUNDED') {
        return { skipped: true, amount: 0 };
    }

    const sellerWallet = await getOrCreateWallet(escrow.seller);
    const amount = Number(escrow.amount) || 0;

    if (amount <= 0) {
        escrow.status = 'RELEASED';
        escrow.releasedAt = new Date();
        await escrow.save();
        return { skipped: true, amount: 0 };
    }

    if (sellerWallet.escrowBalance < amount) {
        console.warn(`[wallet] Escrow balance low for seller ${escrow.seller}, adjusting release of ${amount}`);
        sellerWallet.escrowBalance = Math.max(0, sellerWallet.escrowBalance);
    }

    sellerWallet.escrowBalance = Math.max(0, sellerWallet.escrowBalance - amount);
    sellerWallet.balance += amount;
    await sellerWallet.save();

    escrow.status = 'RELEASED';
    escrow.releasedAt = new Date();
    await escrow.save();

    await WalletLedger.create({
        user: escrow.seller,
        counterparty: buyerId,
        order: escrow.order,
        escrow: escrow._id,
        amount,
        direction: 'credit',
        type: 'escrow_release',
        status: 'RELEASED',
        description: `Escrow released for order #${String(escrow.order).slice(-6)}`
    });

    try {
        const { markPayoutsApprovedForOrder } = require('../utils/payoutSync');
        await markPayoutsApprovedForOrder(escrow.order, escrow.seller);
    } catch (payoutErr) {
        console.error('[payout] auto-approve on escrow release:', payoutErr.message);
    }

    return { released: true, amount };
}

/**
 * Release all seller escrows for an order (buyer confirmed receipt).
 */
async function releaseEscrowForOrder(orderId, buyerId) {
    const query = {
        order: orderId,
        status: { $in: ['IN_ESCROW', 'DELIVERED', 'PAID'] }
    };
    if (buyerId) {
        query.buyer = buyerId;
    }

    const escrows = await Escrow.find(query);

    if (escrows.length === 0) {
        const released = await Escrow.findOne({ order: orderId, status: 'RELEASED' });
        if (released) return { alreadyReleased: true, totalReleased: 0 };
        return { alreadyReleased: false, totalReleased: 0, message: 'No escrow records' };
    }

    let totalReleased = 0;
    for (const escrow of escrows) {
        const result = await releaseSingleEscrow(escrow, escrow.buyer);
        totalReleased += result.amount || 0;
    }

    return { released: true, totalReleased };
}

/**
 * Auto-release one seller's escrow when they mark delivered (wallet orders).
 */
async function releaseEscrowForSeller(orderId, sellerId) {
    const escrows = await Escrow.find({
        order: orderId,
        seller: sellerId,
        status: { $in: ['IN_ESCROW', 'DELIVERED', 'PAID'] }
    });

    if (escrows.length === 0) {
        const done = await Escrow.findOne({ order: orderId, seller: sellerId, status: 'RELEASED' });
        if (done) return { alreadyReleased: true, totalReleased: 0 };
        return { released: false, totalReleased: 0, message: 'No escrow for seller' };
    }

    let totalReleased = 0;
    for (const escrow of escrows) {
        const result = await releaseSingleEscrow(escrow, escrow.buyer);
        totalReleased += result.amount || 0;
    }

    return { released: true, totalReleased };
}

/**
 * Refund buyer and debit seller for one seller's portion (full or partial).
 * @param {number|null|undefined} requestedAmount - Item/partial amount; defaults to full escrow.
 */
async function refundEscrowForSeller(orderId, sellerId, requestedAmount) {
    const escrow = await Escrow.findOne({ order: orderId, seller: sellerId });

    if (!escrow) {
        throw new Error('No escrow record found for this seller on this order.');
    }
    if (escrow.status === 'REFUNDED') {
        return { alreadyRefunded: true, amount: 0 };
    }

    const escrowAmount = Number(escrow.amount) || 0;
    let amount =
        requestedAmount != null && requestedAmount !== undefined
            ? Number(requestedAmount)
            : escrowAmount;

    if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('Invalid refund amount.');
    }
    amount = Math.min(amount, escrowAmount);

    const buyerId = escrow.buyer;
    const sellerWallet = await getOrCreateWallet(sellerId);
    const buyerWallet = await getOrCreateWallet(buyerId);

    if (escrow.status === 'RELEASED') {
        if (sellerWallet.balance < amount) {
            throw new Error('Seller wallet balance insufficient for refund clawback.');
        }
        sellerWallet.balance -= amount;
    } else {
        if (sellerWallet.escrowBalance < amount) {
            sellerWallet.escrowBalance = Math.max(0, sellerWallet.escrowBalance - amount);
        } else {
            sellerWallet.escrowBalance -= amount;
        }
    }
    await sellerWallet.save();

    buyerWallet.balance += amount;
    await buyerWallet.save();

    if (amount >= escrowAmount) {
        escrow.status = 'REFUNDED';
        escrow.refundedAt = new Date();
        escrow.amount = 0;
    } else {
        escrow.amount = escrowAmount - amount;
    }
    await escrow.save();

    await WalletLedger.create({
        user: sellerId,
        order: orderId,
        escrow: escrow._id,
        amount,
        direction: 'debit',
        type: 'refund_issued',
        status: 'REFUNDED',
        description: `Refund clawback order #${orderId.toString().slice(-6)}`
    });

    await WalletLedger.create({
        user: buyerId,
        order: orderId,
        escrow: escrow._id,
        amount,
        direction: 'credit',
        type: 'refund_received',
        status: 'REFUNDED',
        description: `Refund for order #${orderId.toString().slice(-6)}`
    });

    return { refunded: true, amount };
}

/**
 * Refund buyer and reverse seller escrow when order cancelled before release.
 */
async function refundOrderEscrow(orderId) {
    const escrows = await Escrow.find({
        order: orderId,
        status: { $in: ['IN_ESCROW', 'PENDING', 'PAID', 'DELIVERED'] }
    });

    if (escrows.length === 0) {
        return { refunded: false, reason: 'no_escrow' };
    }

    const buyerId = escrows[0].buyer;
    let refundTotal = 0;

    for (const escrow of escrows) {
        const sellerWallet = await getOrCreateWallet(escrow.seller);
        if (sellerWallet.escrowBalance >= escrow.amount) {
            sellerWallet.escrowBalance -= escrow.amount;
            await sellerWallet.save();
        }

        escrow.status = 'REFUNDED';
        escrow.refundedAt = new Date();
        await escrow.save();

        refundTotal += escrow.amount;

        await WalletLedger.create({
            user: escrow.seller,
            order: orderId,
            escrow: escrow._id,
            amount: escrow.amount,
            direction: 'debit',
            type: 'refund_issued',
            status: 'REFUNDED',
            description: `Escrow reversed for cancelled order #${orderId.toString().slice(-6)}`
        });
    }

    const buyerWallet = await getOrCreateWallet(buyerId);
    buyerWallet.balance += refundTotal;
    await buyerWallet.save();

    await WalletLedger.create({
        user: buyerId,
        order: orderId,
        amount: refundTotal,
        direction: 'credit',
        type: 'refund_received',
        status: 'REFUNDED',
        description: `Refund for cancelled order #${orderId.toString().slice(-6)}`
    });

    try {
        const { markPayoutsRefundedForOrder } = require('../utils/payoutSync');
        await markPayoutsRefundedForOrder(orderId);
    } catch (payoutErr) {
        console.error('[payout] refund sync on cancel:', payoutErr.message);
    }

    return { refunded: true, amount: refundTotal };
}

/**
 * Dummy withdrawal — deduct from unified wallet balance.
 */
async function withdrawFromWallet(userId, amount) {
    const withdrawAmount = Number(amount);
    if (!withdrawAmount || withdrawAmount <= 0) {
        throw new Error('Invalid withdrawal amount.');
    }

    const wallet = await Wallet.findOneAndUpdate(
        { user: userId, balance: { $gte: withdrawAmount } },
        { $inc: { balance: -withdrawAmount } },
        { new: true }
    );

    if (!wallet) {
        const current = await Wallet.findOne({ user: userId });
        const bal = current?.balance ?? 0;
        throw new Error(`Only PKR ${bal.toLocaleString()} is in your wallet. Escrow funds unlock after delivery.`);
    }

    await WalletLedger.create({
        user: userId,
        amount: withdrawAmount,
        direction: 'debit',
        type: 'withdrawal',
        status: 'COMPLETED',
        description: 'Prototype dummy withdrawal (no real transfer)'
    });

    return { success: true, withdrawn: withdrawAmount, balance: wallet.balance };
}

async function getAdminWalletStats() {
    const wallets = await Wallet.aggregate([
        {
            $group: {
                _id: null,
                totalBuyerBalance: { $sum: '$balance' },
                totalEscrow: { $sum: '$escrowBalance' },
                totalAvailable: { $sum: '$balance' }
            }
        }
    ]);

    const escrowStats = await Escrow.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                total: { $sum: '$amount' }
            }
        }
    ]);

    const ledgerCount = await WalletLedger.countDocuments();

    const released = escrowStats.find((e) => e._id === 'RELEASED')?.total || 0;
    const inEscrow = escrowStats.find((e) => e._id === 'IN_ESCROW')?.total || 0;
    const refunded = escrowStats.find((e) => e._id === 'REFUNDED')?.total || 0;

    return {
        totalBuyerBalance: wallets[0]?.totalBuyerBalance || 0,
        totalEscrowFunds: inEscrow,
        totalReleasedFunds: released,
        totalRefundedFunds: refunded,
        totalAvailableToSellers: wallets[0]?.totalAvailable || 0,
        totalTransactions: ledgerCount,
        escrowByStatus: escrowStats
    };
}

/**
 * Ensure every non-admin user has a wallet (seed PKR 100,000 only on first create).
 * Does NOT reset balances on restart — purchases stay deducted.
 */
/** Move legacy availableBalance into unified balance (one-time per wallet). */
async function mergeLegacyAvailableIntoBalance() {
    const wallets = await Wallet.find({ availableBalance: { $gt: 0 } });
    let merged = 0;
    for (const w of wallets) {
        const avail = Number(w.availableBalance) || 0;
        const isDuplicateSeed =
            avail >= PROTOTYPE_WALLET_BALANCE &&
            w.balance > 0 &&
            w.balance <= PROTOTYPE_WALLET_BALANCE;

        if (isDuplicateSeed) {
            w.availableBalance = 0;
        } else {
            w.balance += avail;
            w.availableBalance = 0;
        }
        await w.save();
        merged += 1;
    }
    return { merged };
}

async function ensurePrototypeWalletsExist() {
    const users = await User.find({ role: { $ne: 'admin' } }).select('_id role');
    let created = 0;

    for (const u of users) {
        const before = await Wallet.findOne({ user: u._id });
        if (!before) {
            await getOrCreateWallet(u._id, u.role);
            created += 1;
        }
    }

    const mergeResult = await mergeLegacyAvailableIntoBalance();

    return { created, totalUsers: users.length, mergedLegacy: mergeResult.merged };
}

/**
 * Admin/demo only: reset all non-admin spendable balances to prototype amount.
 * Escrow and available (earnings) are not reset.
 */
async function resetAllPrototypeSpendableBalances() {
    const users = await User.find({ role: { $ne: 'admin' } }).select('_id');
    const userIds = users.map((u) => u._id);

    const result = await Wallet.updateMany(
        { user: { $in: userIds } },
        { $set: { balance: PROTOTYPE_WALLET_BALANCE } }
    );

    return {
        balance: PROTOTYPE_WALLET_BALANCE,
        walletsModified: result.modifiedCount
    };
}

/**
 * Pay for advertisement campaign from manufacturer wallet (isolated from order flow).
 */
async function processAdCampaignPayment(userId, amount, advertisementId) {
    const total = Number(amount) || 0;
    if (total <= 0) {
        throw new Error('Invalid advertisement payment amount.');
    }

    await getOrCreateWallet(userId, 'manufacturer');

    const buyerWallet = await Wallet.findOneAndUpdate(
        { user: userId, balance: { $gte: total } },
        { $inc: { balance: -total } },
        { new: true }
    );

    if (!buyerWallet) {
        const current = await Wallet.findOne({ user: userId });
        const available = current?.balance ?? 0;
        throw new Error(
            `Insufficient wallet balance. Required PKR ${total.toLocaleString()}, available PKR ${available.toLocaleString()}.`
        );
    }

    await WalletLedger.create({
        user: userId,
        amount: total,
        direction: 'debit',
        type: 'ad_payment',
        status: 'COMPLETED',
        description: `Advertisement campaign payment #${String(advertisementId).slice(-6)}`,
        metadata: { advertisementId }
    });

    return { success: true, amountPaid: total, balance: buyerWallet.balance };
}

module.exports = {
    PROTOTYPE_WALLET_BALANCE,
    getOrCreateWallet,
    getWalletSummary,
    processWalletPayment,
    processAdCampaignPayment,
    releaseEscrowForOrder,
    releaseEscrowForSeller,
    refundOrderEscrow,
    refundEscrowForSeller,
    withdrawFromWallet,
    withdrawAvailable: withdrawFromWallet,
    getAdminWalletStats,
    ensurePrototypeWalletsExist,
    resetAllPrototypeSpendableBalances
};
