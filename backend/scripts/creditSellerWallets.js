/**
 * Credit PKR 1 crore to every wholesaler and manufacturer wallet.
 *
 * Usage (from backend folder):
 *   node scripts/creditSellerWallets.js
 *
 * Optional env:
 *   CREDIT_AMOUNT=10000000   (default: 1 crore PKR)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const WalletLedger = require('../models/WalletLedger');
const { getOrCreateWallet } = require('../services/walletService');

const CREDIT_AMOUNT = Number(process.env.CREDIT_AMOUNT) || 10_000_000;

async function run() {
    await connectDB();

    const users = await User.find({ role: { $in: ['wholesaler', 'manufacturer'] } })
        .select('_id name email role')
        .sort({ role: 1, email: 1 });

    if (users.length === 0) {
        console.log('No wholesaler or manufacturer accounts found.');
        await mongoose.disconnect().catch(() => {});
        process.exit(0);
    }

    console.log(`Crediting PKR ${CREDIT_AMOUNT.toLocaleString()} to ${users.length} account(s)...\n`);

    const results = [];

    for (const user of users) {
        const wallet = await getOrCreateWallet(user._id, user.role);
        const before = wallet.balance;

        wallet.balance = before + CREDIT_AMOUNT;
        await wallet.save();

        await WalletLedger.create({
            user: user._id,
            amount: CREDIT_AMOUNT,
            direction: 'credit',
            type: 'adjustment',
            status: 'COMPLETED',
            description: `Admin credit: PKR ${CREDIT_AMOUNT.toLocaleString()} (1 crore)`
        });

        results.push({
            name: user.name,
            email: user.email,
            role: user.role,
            before,
            after: wallet.balance
        });

        console.log(
            `[${user.role}] ${user.email} — PKR ${before.toLocaleString()} → PKR ${wallet.balance.toLocaleString()}`
        );
    }

    console.log(`\nDone. Credited ${users.length} wallet(s), total PKR ${(CREDIT_AMOUNT * users.length).toLocaleString()}.`);

    await mongoose.disconnect().catch(() => {});
    process.exit(0);
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
