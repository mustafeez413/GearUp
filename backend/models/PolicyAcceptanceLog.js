const mongoose = require('mongoose');

const PolicyAcceptanceLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    ipAddress: String,
    userAgent: String,
    acceptedAt: {
        type: Date,
        default: Date.now
    },
    policyVersion: {
        type: String,
        default: '1.0'
    }
});

module.exports = mongoose.model('PolicyAcceptanceLog', PolicyAcceptanceLogSchema);
