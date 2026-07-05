const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.ObjectId,
        ref: 'Order',
        required: true
    },
    seller: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    buyer: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    deductedCommission: {
        type: Number,
        required: true
    },
    sellerAmount: {
        type: Number,
        required: true
    },
    commissionPercentage: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        default: 'Bank Transfer'
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed', 'Refunded', 'Failed', 'Paid'],
        default: 'Pending'
    },
    paidDate: Date,
    paidBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    type: {
        type: String,
        enum: ['payout', 'refund', 'chargeback'],
        default: 'payout'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);
