const mongoose = require('mongoose');

const EscrowSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
        index: true
    },
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['PENDING', 'PAID', 'IN_ESCROW', 'DELIVERED', 'RELEASED', 'CANCELLED', 'REFUNDED'],
        default: 'PENDING',
        index: true
    },
    ledgerReference: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WalletLedger'
    },
    releasedAt: Date,
    refundedAt: Date
}, { timestamps: true });

EscrowSchema.index({ order: 1, seller: 1 }, { unique: true });

module.exports = mongoose.model('Escrow', EscrowSchema);
