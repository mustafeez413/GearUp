const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    /** Single wallet: checkout, earnings after delivery, and withdrawals. */
    balance: {
        type: Number,
        default: 0,
        min: 0
    },
    /** Seller funds held until order is delivered (not withdrawable). */
    escrowBalance: {
        type: Number,
        default: 0,
        min: 0
    },
    /** @deprecated Merged into balance — kept for legacy reads only. */
    availableBalance: {
        type: Number,
        default: 0,
        min: 0
    },
    currency: {
        type: String,
        default: 'PKR'
    }
}, { timestamps: true });

module.exports = mongoose.model('Wallet', WalletSchema);
