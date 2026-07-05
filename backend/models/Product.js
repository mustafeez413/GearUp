const mongoose = require('mongoose');
const { validateBulkPackaging } = require('../utils/bulkPackagingValidation');

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a product name'],
        trim: true
    },
    description: {
        type: String,
        required: [function() {
            return this.status !== 'draft';
        }, 'Please add a description']
    },
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'published'
    },
    price: {
        type: Number,
        alias: 'pricePerBulkUnit',
        default: 0
    },
    category: {
        type: String,
        default: 'General'
    },
    stock: {
        type: Number,
        default: 0
    },
    minimumOrderQuantity: {
        type: Number,
        default: 1,
        min: 1
    },
    packSize: {
        type: Number,
        required: [true, 'Units Per Bulk Pack is required.'],
        min: [1, 'Units Per Bulk Pack must be greater than zero.'],
        max: [999, 'Units Per Bulk Pack cannot exceed 999.'],
        default: 1,
        validate: {
            validator: function validatePackSize(value) {
                const result = validateBulkPackaging(this.bulkUnit, value);
                return result.valid;
            },
            message: function(props) {
                const result = validateBulkPackaging(this.bulkUnit, props.value);
                return result.error || 'Invalid Units Per Bulk Pack.';
            }
        }
    },
    bulkUnit: {
        type: String,
        enum: ['Dozen', 'Pack', 'Box', 'Carton', 'Unit Set', 'Unit'],
        default: 'Pack'
    },
    sku: {
        type: String,
        required: false,
        trim: true
    },
    manufacturer: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        alias: 'seller'
    },
    sellerType: {
        type: String,
        enum: ['manufacturer', 'wholesaler'],
        default: 'manufacturer'
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true
});

module.exports = mongoose.model('Product', ProductSchema);
