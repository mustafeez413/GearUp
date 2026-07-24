const mongoose = require('mongoose');

const InventoryLogSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: true
    },
    order: {
        type: mongoose.Schema.ObjectId,
        ref: 'Order',
        required: false
    },
    previousTotalStock: {
        type: Number,
        default: 0
    },
    newTotalStock: {
        type: Number,
        default: 0
    },
    previousReservedStock: {
        type: Number,
        default: 0
    },
    newReservedStock: {
        type: Number,
        default: 0
    },
    previousAvailableStock: {
        type: Number,
        default: 0
    },
    newAvailableStock: {
        type: Number,
        default: 0
    },
    quantityChanged: {
        type: Number,
        required: true
    },
    actionType: {
        type: String,
        enum: [
            'Order Placed',
            'Order Cancelled',
            'Seller Rejected',
            'Order Shipped',
            'Refund',
            'Return Received',
            'Restock',
            'Manual Adjustment'
        ],
        required: true
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: false
    },
    remarks: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('InventoryLog', InventoryLogSchema);
