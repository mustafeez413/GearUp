const mongoose = require('mongoose');

const DisputeSchema = new mongoose.Schema({
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
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        index: true
    },
    orderItemName: {
        type: String
    },
    refundAmount: {
        type: Number,
        default: 0
    },
    reason: {
        type: String,
        required: true
    },
    evidence: {
        type: String
    },
    evidenceImages: [{
        type: String
    }],
    notes: {
        type: String
    },
    status: {
        type: String,
        enum: [
            'open',
            'awaiting_seller',
            'seller_responded',
            'under_review',
            'investigating',
            'refunded',
            'rejected',
            'resolved'
        ],
        default: 'open',
        index: true
    },
    resolution: {
        type: String
    },
    sellerResponse: {
        message: String,
        evidence: String,
        evidenceImages: [String],
        respondedAt: Date
    },
    sellerRespondDeadline: Date,
    timeline: [
        {
            action: { type: String, required: true },
            message: { type: String, default: '' },
            by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            role: { type: String },
            visibleTo: {
                type: String,
                enum: ['all', 'buyer', 'seller', 'admin'],
                default: 'all'
            },
            createdAt: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('Dispute', DisputeSchema);
