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
    totalStock: {
        type: Number,
        default: 0,
        min: 0
    },
    reservedStock: {
        type: Number,
        default: 0,
        min: 0
    },
    availableStock: {
        type: Number,
        default: 0,
        min: 0
    },
    damagedStock: {
        type: Number,
        default: 0,
        min: 0
    },
    returnedStock: {
        type: Number,
        default: 0,
        min: 0
    },
    lowStockThreshold: {
        type: Number,
        default: 10,
        min: 0
    },
    lowStockAlertTriggered: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
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

ProductSchema.pre('save', function syncInventoryStock(next) {
    if (this.isNew) {
        if (this.totalStock === undefined || this.totalStock === null) {
            this.totalStock = Math.max(0, this.stock || 0);
        }
    } else if (this.isModified('stock') && !this.isModified('totalStock')) {
        this.totalStock = Math.max(0, this.stock || 0);
    }

    this.totalStock = Math.max(0, this.totalStock || 0);
    this.reservedStock = Math.max(0, this.reservedStock || 0);
    this.availableStock = Math.max(0, this.totalStock - this.reservedStock);
    this.set('stock', this.availableStock, { merge: true });

    // Reset low stock alert trigger if stock is replenished above threshold
    if (this.availableStock > (this.lowStockThreshold || 10)) {
        this.lowStockAlertTriggered = false;
    }
    if (typeof next === 'function') {
        next();
    }
});

module.exports = mongoose.model('Product', ProductSchema);
