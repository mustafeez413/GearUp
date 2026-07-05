const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    buyer: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    buyerType: {
        type: String,
        enum: ['wholesaler', 'manufacturer', 'Wholesaler', 'Manufacturer'],
        default: 'wholesaler'
    },
    manufacturer: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    supplierType: {
        type: String,
        enum: ['manufacturer', 'Manufacturer'],
        default: 'manufacturer'
    },
    items: [
        {
            product: {
                type: mongoose.Schema.ObjectId,
                ref: 'Product',
                required: true
            },
            seller: {
                type: mongoose.Schema.ObjectId,
                ref: 'User',
                required: true
            },
            name: String,
            sku: String,
            quantity: {
                type: Number, // In bulk units
                required: true
            },
            price: {
                type: Number, // Price per bulk unit
                required: true
            },
            bulkUnit: String,
            disputeStatus: {
                type: String,
                enum: ['none', 'open', 'settled', 'refunded', 'rejected', 'resolved'],
                default: 'none'
            }
        }
    ],
    sellerStats: [
        {
            seller: { type: mongoose.Schema.ObjectId, ref: 'User' },
            subtotal: Number,
            platformCommission: Number,
            sellerReceivable: Number,
            status: {
                type: String,
                enum: ['Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled', 'Refunded', 'pending', 'pending_approval', 'verified', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
                default: 'pending'
            }
        }
    ],
    totalAmount: {
        type: Number,
        required: true
    },
    platformCommissionTotal: Number,
    commissionRate: Number,
    commissionChargedTo: {
        type: String,
        enum: ['manufacturer', 'wholesaler', 'none'],
        default: 'manufacturer'
    },
    paymentProof: String,
    paymentStatus: {
        type: String,
        enum: ['Pending Payment', 'Pending Approval', 'Payment Verified', 'Rejected', 'Refunded', 'pending payment', 'pending approval', 'payment verified', 'rejected', 'refunded', 'pending', 'pending_approval', 'verified'],
        default: 'pending'
    },
    isPaymentVerified: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['Pending Payment', 'Pending Approval', 'Payment Verified', 'Order Confirmed', 'Processing', 'Shipped', 'Completed', 'Cancelled', 'pending payment', 'pending approval', 'payment verified', 'order confirmed', 'pending', 'pending_approval', 'verified', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    transactionReference: String,
    paymentMethod: {
        type: String,
        enum: ['bank_transfer', 'invoice_submission', 'card_payment', 'escrow_transfer', 'platform_wallet'],
        default: 'bank_transfer'
    },
    cardDetails: {
        cardholderName: String,
        cardNumberHidden: String
    },
    shippingAddress: {
        address: String,
        city: String,
        phone: String
    },
    checkoutGroupId: {
        type: String
    },
    notes: String,
    trackingLog: [
        {
            status: { type: String },
            message: { type: String },
            updatedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
            role: { type: String },
            createdAt: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
