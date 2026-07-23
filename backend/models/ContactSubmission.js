const mongoose = require('mongoose');

const SupportReplySchema = new mongoose.Schema(
    {
        message: { type: String, required: true, trim: true },
        // adminName stores the sender's display name for both admin and user replies
        adminName: { type: String, trim: true, default: '' },
        admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        // sender field distinguishes who sent this reply.
        // Defaults to 'admin' for full backward compatibility with existing reply documents.
        sender: { type: String, enum: ['admin', 'user'], default: 'admin' },
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
        // Extended with waiting_for_user and resolved.
        // Existing documents with open/in_progress/replied/closed remain fully valid.
        enum: ['open', 'in_progress', 'waiting_for_user', 'replied', 'resolved', 'closed'],
        default: 'open',
    },
    replies: { type: [SupportReplySchema], default: [] },
    isReplied: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ContactSubmission', ContactSubmissionSchema);
