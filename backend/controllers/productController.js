const Product = require('../models/Product');
const mongoose = require('mongoose');
const { uploadToCloudinary, deleteFromUrl } = require('../utils/cloudinary');
const {
    ACCESS_DENIED_OWN_PRODUCT,
    applyManufacturerBuyingListFilter,
    assertManufacturerSingleProductRead
} = require('../utils/manufacturerProductAccess');
const { createNotification } = require('./notificationController');
const { isLowStockAlert, LOW_STOCK_THRESHOLD } = require('../utils/inventory');
const { applyBulkPackagingToPayload } = require('../utils/bulkPackagingValidation');
const { assertUniqueProductSku } = require('../utils/productSkuValidation');

const { isValidCategorySubcategory } = require('../constants/categories');

function ensureProductStockFields(doc) {
    if (!doc) return doc;
    const obj = typeof doc.toObject === 'function' ? doc.toObject({ virtuals: true }) : { ...doc };
    const reserved = Math.max(0, Number(obj.reservedStock) || 0);
    const total = obj.totalStock != null
        ? Math.max(0, Number(obj.totalStock) || 0)
        : Math.max(0, (Number(obj.stock) || 0) + reserved);
    const available = Math.max(0, total - reserved);

    obj.totalStock = total;
    obj.reservedStock = reserved;
    obj.availableStock = available;
    obj.stock = available;
    obj.subcategory = doc.subcategory || obj.subcategory || '';
    return obj;
}

// Get distinct product categories for marketplace filters
// GET /api/products/categories
exports.getProductCategories = async (req, res, next) => {
    try {
        const categories = await Product.distinct('category', { status: { $ne: 'draft' } });
        const data = categories
            .filter((cat) => typeof cat === 'string' && cat.trim())
            .map((cat) => cat.trim())
            .sort((a, b) => a.localeCompare(b));
        res.status(200).json({ success: true, count: data.length, data });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Get all products
// GET /api/products
// Public + optionalAuth: sellers never receive their own rows except scope=inventory + seller=self
exports.getProducts = async (req, res, next) => {
    try {
        const { keyword, category, subcategory } = req.query;
        const query = {};

        if (keyword) {
            query.name = { $regex: keyword, $options: 'i' };
        }
        if (category) {
            query.category = category;
        }
        if (subcategory) {
            query.subcategory = subcategory;
        }

        // Hide soft-deleted products from catalog
        query.isDeleted = { $ne: true };

        // Hide drafts and deactivated/inactive products from general public / marketplace view
        if (req.query.scope !== 'inventory') {
            query.status = { $ne: 'draft' };
            query.isActive = { $ne: false };
        }

        // Sellers (manufacturer or selling wholesaler) should not see their own products by default
        if (req.user && (req.user.role === 'manufacturer' || req.user.role === 'wholesaler')) {
             // Basic filter to exclude own products in general marketplace view
             if (req.query.scope !== 'inventory') {
                 query.manufacturer = { $ne: req.user.id };
             } else {
                 query.manufacturer = req.user.id;
             }
        } else if (req.query.seller || req.query.manufacturer) {
            query.manufacturer = req.query.seller || req.query.manufacturer;
        }

        const usePagination = req.query.page != null || req.query.limit != null;
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
        const skip = (page - 1) * limit;

        let products;
        let pagination = {};

        if (usePagination) {
            const [total, docs] = await Promise.all([
                Product.countDocuments(query),
                Product.find(query)
                    .populate('manufacturer', 'name businessDetails role')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
            ]);
            products = docs;
            pagination = {
                total,
                page,
                limit,
                pages: Math.max(1, Math.ceil(total / limit))
            };
        } else {
            products = await Product.find(query)
                .populate('manufacturer', 'name businessDetails role')
                .sort({ createdAt: -1 });
        }

        const sanitized = (products || []).map(ensureProductStockFields);

        res.status(200).json({
            success: true,
            count: sanitized.length,
            ...pagination,
            data: sanitized
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Get single product
// GET /api/products/:id
exports.getProduct = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, error: 'Invalid product id' });
        }

        const product = await Product.findById(req.params.id).populate('manufacturer', 'name businessDetails role');

        if (!product || product.isDeleted) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        const isOwnerOrAdmin = req.user && (
            (product.seller && String(product.seller) === String(req.user.id)) ||
            (product.manufacturer && String(product.manufacturer) === String(req.user.id)) ||
            req.user.role === 'admin'
        );

        if (product.isActive === false && !isOwnerOrAdmin && req.query.scope !== 'inventory') {
            return res.status(404).json({ success: false, error: 'Product is currently inactive or unlisted' });
        }

        res.status(200).json({ success: true, data: ensureProductStockFields(product) });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Create new product
// POST /api/products
// Private/Seller
exports.createProduct = async (req, res, next) => {
    try {
        const isSeller = req.user.role === 'manufacturer' || 
                        req.user.role === 'wholesaler' ||
                        req.user.role === 'admin';

        if (!isSeller) {
            return res.status(403).json({ success: false, error: 'Only verified sellers can add products' });
        }

        req.body.manufacturer = req.user.id;
        req.body.sellerType = req.user.role === 'manufacturer' ? 'manufacturer' : 'wholesaler';

        if (!req.body.category || !String(req.body.category).trim()) {
            return res.status(400).json({ success: false, error: 'Main category is required.' });
        }
        if (!req.body.subcategory || !String(req.body.subcategory).trim()) {
            return res.status(400).json({ success: false, error: 'Subcategory is required.' });
        }
        if (!isValidCategorySubcategory(req.body.category, req.body.subcategory)) {
            return res.status(400).json({ success: false, error: `Invalid subcategory "${req.body.subcategory}" for category "${req.body.category}".` });
        }

        const packagingCheck = applyBulkPackagingToPayload(req.body);
        if (!packagingCheck.valid) {
            return res.status(400).json({ success: false, error: packagingCheck.error });
        }

        if (req.body.sku) {
            req.body.sku = String(req.body.sku).trim().toUpperCase();
            const skuCheck = await assertUniqueProductSku(req.body.sku);
            if (!skuCheck.valid) {
                return res.status(400).json({ success: false, error: skuCheck.error });
            }
        }

        const product = await Product.create(req.body);
        res.status(201).json({ success: true, data: ensureProductStockFields(product) });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Update product
// PUT /api/products/:id
// Private/Seller
exports.updateProduct = async (req, res, next) => {
    try {
        let product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, error: 'Not authorized to update this product' });
        }

        // Clean up removed images from Cloudinary
        if (req.body.images && Array.isArray(req.body.images)) {
            const newImages = req.body.images;
            const oldImages = product.images || [];
            const removedImages = oldImages.filter(img => !newImages.includes(img));
            for (const imgUrl of removedImages) {
                await deleteFromUrl(imgUrl);
            }
        }

        const updatePayload = { ...req.body };
        const packagingPayload = {
            bulkUnit: updatePayload.bulkUnit !== undefined ? updatePayload.bulkUnit : product.bulkUnit,
            packSize: updatePayload.packSize !== undefined ? updatePayload.packSize : product.packSize,
        };
        const packagingCheck = applyBulkPackagingToPayload(packagingPayload);
        if (!packagingCheck.valid) {
            return res.status(400).json({ success: false, error: packagingCheck.error });
        }
        if (updatePayload.bulkUnit !== undefined || updatePayload.packSize !== undefined) {
            updatePayload.packSize = packagingPayload.packSize;
        }

        if (updatePayload.pricePerBulkUnit !== undefined) {
            updatePayload.price = updatePayload.pricePerBulkUnit;
            delete updatePayload.pricePerBulkUnit;
        }

        if (updatePayload.category !== undefined || updatePayload.subcategory !== undefined) {
            const targetCategory = updatePayload.category !== undefined ? updatePayload.category : product.category;
            const targetSubcategory = updatePayload.subcategory !== undefined ? updatePayload.subcategory : product.subcategory;

            if (!targetCategory || !String(targetCategory).trim()) {
                return res.status(400).json({ success: false, error: 'Main category is required.' });
            }
            if (!targetSubcategory || !String(targetSubcategory).trim()) {
                return res.status(400).json({ success: false, error: 'Subcategory is required.' });
            }
            if (!isValidCategorySubcategory(targetCategory, targetSubcategory)) {
                return res.status(400).json({ success: false, error: `Invalid subcategory "${targetSubcategory}" for category "${targetCategory}".` });
            }
        }

        if (updatePayload.sku !== undefined && updatePayload.sku !== null && String(updatePayload.sku).trim()) {
            updatePayload.sku = String(updatePayload.sku).trim().toUpperCase();
            const skuCheck = await assertUniqueProductSku(updatePayload.sku, req.params.id);
            if (!skuCheck.valid) {
                return res.status(400).json({ success: false, error: skuCheck.error });
            }
        }

        // Delete stock management fields from updatePayload to prevent findByIdAndUpdate from overwriting computed inventory fields
        delete updatePayload.totalStock;
        delete updatePayload.stock;
        delete updatePayload.availableStock;
        delete updatePayload.reservedStock;

        // Manual physical inventory updates MUST only occur when req.body.totalStock is explicitly provided
        const hasTotalStockUpdate = req.body.totalStock !== undefined && req.body.totalStock !== null && req.body.totalStock !== '';
        if (hasTotalStockUpdate) {
            const newTotal = Number(req.body.totalStock);
            if (Number.isFinite(newTotal) && newTotal >= 0) {
                const { adjustStock } = require('../utils/inventoryManager');
                await adjustStock(product._id, newTotal, req.user.id, 'Manual stock update');
            }
        }

        product = await Product.findByIdAndUpdate(req.params.id, updatePayload, {
            new: true,
            runValidators: true
        });

        if (product) {
            const total = product.totalStock != null ? Math.max(0, Number(product.totalStock) || 0) : Math.max(0, Number(product.stock) || 0);
            const reserved = Math.max(0, Number(product.reservedStock) || 0);
            const available = Math.max(0, total - reserved);
            if (product.availableStock !== available || product.stock !== available) {
                product.availableStock = available;
                product.stock = available;
                await product.save();
            }
        }

        res.status(200).json({ success: true, data: ensureProductStockFields(product) });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Delete product
// DELETE /api/products/:id
// Private/Seller
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    const result = await uploadToCloudinary(req.file.buffer, 'products');
    const filePath = result.secure_url;
    return res.status(201).json({ success: true, path: filePath });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        const isOwnerOrAdmin = (product.seller && product.seller.toString() === req.user.id) || 
                              (product.manufacturer && product.manufacturer.toString() === req.user.id) ||
                              req.user.role === 'admin';

        if (!isOwnerOrAdmin) {
            const message = ACCESS_DENIED_OWN_PRODUCT;
            return res.status(403).json({
                success: false,
                message,
                error: message
            });
        }

        // Check if product is associated with any active orders
        const productOwnerId = product.seller || product.manufacturer;
        const Order = require('../models/Order');

        const ordersWithProduct = await Order.find({
            'items.product': req.params.id
        }).lean();

        const nonActiveStatuses = ['completed', 'cancelled', 'canceled', 'refunded', 'returned'];

        const activeOrder = ordersWithProduct.find(order => {
            const mainStatus = String(order.status || '').trim().toLowerCase();
            const isMainStatusNonActive = nonActiveStatuses.includes(mainStatus);

            // Check if there is an open active dispute on this product's item
            const hasActiveDispute = (order.items || []).some(item => {
                const pId = String(item.product?._id || item.product || '');
                if (pId === String(req.params.id)) {
                    const disputeSt = String(item.disputeStatus || '').trim().toLowerCase();
                    return ['open', 'under_review', 'investigating', 'awaiting_seller', 'seller_responded'].includes(disputeSt);
                }
                return false;
            });

            if (hasActiveDispute) return true;

            // Check seller status in sellerStats if present
            if (order.sellerStats && Array.isArray(order.sellerStats) && order.sellerStats.length > 0 && productOwnerId) {
                const sellerStat = order.sellerStats.find(s => String(s.seller?._id || s.seller || '') === String(productOwnerId));
                if (sellerStat && sellerStat.status) {
                    const statStatus = String(sellerStat.status).trim().toLowerCase();
                    const isStatNonActive = nonActiveStatuses.includes(statStatus);
                    if (!isStatNonActive) return true;
                }
            }

            return !isMainStatusNonActive;
        });

        if (activeOrder) {
            const message = 'This product cannot be deleted because it has active orders. Archive or deactivate the product instead.';
            return res.status(409).json({
                success: false,
                message,
                error: message
            });
        }

        // Perform Soft Delete to preserve historical order references
        product.isDeleted = true;
        product.deletedAt = new Date();
        await product.save();

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Get inventory analytics (Manufacturer)
// GET /api/products/analytics/inventory
exports.getInventoryAnalytics = async (req, res, next) => {
    try {
        if (req.user.role !== 'manufacturer' && req.user.role !== 'wholesaler') {
            return res.status(403).json({ success: false, error: 'Not authorized to view inventory analytics' });
        }

        const products = await Product.find({ manufacturer: req.user.id });

        const totalProducts = products.length;
        const lowStockCount = products.filter(isLowStockAlert).length;
        const totalStockValue = products.reduce((acc, p) => {
            const totalStock = Math.max(0, Number(p.totalStock) || 0);
            return acc + (totalStock * Number(p.price || p.pricePerBulkUnit || 0));
        }, 0);

        res.status(200).json({
            success: true,
            data: {
                totalProducts,
                lowStockCount,
                totalStockValue
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
