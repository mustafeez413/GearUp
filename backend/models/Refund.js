const mongoose = require('mongoose');

const RefundSchema = new mongoose.Schema({
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
    refundAmount: {
        type: Number,
        required: true
    },
    commissionRefunded: {
        type: Number,
        required: true
    },
    sellerDeductedAmount: {
        type: Number,
        required: true
    },
    reason: String,
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Refund', RefundSchema);
