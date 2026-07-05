const mongoose = require('mongoose');

const PayoutSchema = new mongoose.Schema({
    seller: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    order: {
        type: mongoose.Schema.ObjectId,
        ref: 'Order',
        required: true
    },
    grossAmount: {
        type: Number,
        required: true
    },
    commission: {
        type: Number,
        required: true
    },
    netAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Paid', 'Cancelled', 'Holding', 'Approved', 'Refunded'],
        default: 'Holding'
    },
    sellerTransactionId: {
        type: String,
        default: null
    },
    buyerTransactionId: {
        type: String,
        default: null
    },
    paymentDate: {
        type: Date
    },
    notes: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Payout', PayoutSchema);
