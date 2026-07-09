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
        const { keyword, category } = req.query;
        const query = {};

        if (keyword) {
            query.name = { $regex: keyword, $options: 'i' };
        }
        if (category) {
            query.category = category;
        }

        // Hide drafts from general public / marketplace view
        if (req.query.scope !== 'inventory') {
            query.status = { $ne: 'draft' };
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

        res.status(200).json({
            success: true,
            count: products.length,
            ...pagination,
            data: products
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

        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        res.status(200).json({ success: true, data: product });
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
        res.status(201).json({ success: true, data: product });
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

        if (updatePayload.sku !== undefined && updatePayload.sku !== null && String(updatePayload.sku).trim()) {
            updatePayload.sku = String(updatePayload.sku).trim().toUpperCase();
            const skuCheck = await assertUniqueProductSku(updatePayload.sku, req.params.id);
            if (!skuCheck.valid) {
                return res.status(400).json({ success: false, error: skuCheck.error });
            }
        }

        const originalStock = product.stock;

        product = await Product.findByIdAndUpdate(req.params.id, updatePayload, {
            new: true,
            runValidators: true
        });

        // Notification for low stock
        if (req.body.stock !== undefined && isLowStockAlert(product) && !isLowStockAlert({ stock: originalStock, status: product.status })) {
            await createNotification(
                product.manufacturer.toString(),
                `Low stock alert: ${product.name} has only ${product.stock} ${product.bulkUnit}s left in stock.`,
                'alert'
            );
        }

        res.status(200).json({ success: true, data: product });
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

        const productOwnerId = product.manufacturer || product.seller;
        if (!productOwnerId || (productOwnerId.toString() !== req.user.id.toString() && req.user.role !== 'admin')) {
            return res.status(401).json({ success: false, error: 'Not authorized to delete this product' });
        }

        // Delete from Cloudinary first
        if (product.images && product.images.length > 0) {
            for (const imgUrl of product.images) {
                await deleteFromUrl(imgUrl);
            }
        }

        await product.deleteOne();

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
        const totalStockValue = products.reduce((acc, p) => acc + (Number(p.stock || 0) * Number(p.price || p.pricePerBulkUnit || 0)), 0);

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
