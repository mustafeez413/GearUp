const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        trim: true
    },
    performedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    targetEntity: {
        type: String,
        required: true,
        trim: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['success', 'failure'],
        required: true
    }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
