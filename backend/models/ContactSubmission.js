const mongoose = require('mongoose');

const SupportReplySchema = new mongoose.Schema(
    {
        message: { type: String, required: true, trim: true },
        adminName: { type: String, trim: true, default: '' },
        admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        createdAt: { type: Date, default: Date.now },
    },
    { _id: true }
);

const ContactSubmissionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    company: { type: String, trim: true, default: '' },
    subject: { type: String, trim: true, default: '' },
    message: { type: String, required: true, trim: true },
    type: {
        type: String,
        enum: ['general', 'verification', 'sales', 'support', 'advertising', 'other', 'demo'],
        default: 'general',
    },
    category: { type: String, trim: true, default: '' },
    status: {
        type: String,
        enum: ['open', 'in_progress', 'replied', 'closed'],
        default: 'open',
    },
    replies: { type: [SupportReplySchema], default: [] },
    isReplied: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ContactSubmission', ContactSubmissionSchema);
