const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: true
        },
        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: 8000
        },
        isRead: {
            type: Boolean,
            default: false
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    { _id: true }
);

/**
 * Manufacturer-to-manufacturer thread tied to a specific product (seller = product owner).
 * buyerId = manufacturer who opened the chat about another's product.
 */
const ProductChatSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.ObjectId,
            ref: 'Product',
            required: true,
            index: true
        },
        sellerId: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: true
        },
        buyerId: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: true
        },
        messages: [MessageSchema]
    },
    { timestamps: true }
);

ProductChatSchema.index({ product: 1, buyerId: 1 }, { unique: true });

module.exports = mongoose.model('ProductChat', ProductChatSchema);
