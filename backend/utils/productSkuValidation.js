const Product = require('../models/Product');

async function assertUniqueProductSku(sku, excludeProductId = null) {
    const normalized = String(sku || '').trim();
    if (!normalized) {
        return { valid: true };
    }

    const query = { sku: normalized };
    if (excludeProductId) {
        query._id = { $ne: excludeProductId };
    }

    const existing = await Product.findOne(query).select('_id sku').lean();
    if (existing) {
        return {
            valid: false,
            error: 'This SKU is already in use. Please choose a unique SKU.',
        };
    }

    return { valid: true };
}

module.exports = {
    assertUniqueProductSku,
};
