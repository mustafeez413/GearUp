const mongoose = require('mongoose');

const WithdrawRequestSchema = new mongoose.Schema({
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    method: {
        type: String,
        enum: ['bank_transfer', 'jazzcash', 'easypaisa'],
        required: true
    },
    accountDetails: {
        accountName: String,
        accountNumber: String,
        bankName: String, // Optional, for bank transfers
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'paid'],
        default: 'pending'
    },
    adminNotes: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

WithdrawRequestSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('WithdrawRequest', WithdrawRequestSchema);
