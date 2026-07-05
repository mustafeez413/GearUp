const mongoose = require('mongoose');

const WalletLedgerSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    counterparty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        index: true
    },
    escrow: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Escrow'
    },
    amount: {
        type: Number,
        required: true
    },
    direction: {
        type: String,
        enum: ['credit', 'debit'],
        required: true
    },
    type: {
        type: String,
        enum: [
            'payment_deduct',
            'escrow_credit',
            'escrow_release',
            'refund_received',
            'refund_issued',
            'withdrawal',
            'seed_balance',
            'adjustment',
            'ad_payment'
        ],
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'PAID', 'IN_ESCROW', 'DELIVERED', 'RELEASED', 'CANCELLED', 'REFUNDED', 'COMPLETED', 'FAILED'],
        default: 'COMPLETED'
    },
    description: String,
    metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

WalletLedgerSchema.index({ order: 1, type: 1, user: 1 });

module.exports = mongoose.model('WalletLedger', WalletLedgerSchema);
