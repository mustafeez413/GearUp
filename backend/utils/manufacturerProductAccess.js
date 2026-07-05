/**
 * Central rules: manufacturers must never read or select their own SKUs in buying/discovery contexts.
 * Inventory / CRUD uses ?scope=inventory (and list + manufacturer=self + scope=inventory).
 */

const mongoose = require('mongoose');

const ACCESS_DENIED_OWN_PRODUCT = 'Access denied: Cannot interact with your own product';
/** Exact copy for purchase/order rejection (manufacturer buying own SKU). */
const PURCHASE_OWN_PRODUCT_DENIED = 'You cannot purchase your own product';

function userIdString(user) {
    if (!user || !user._id) return null;
    return user._id.toString();
}

/** Owner id from a Product doc (populated or not). */
function productOwnerIdString(product) {
    if (!product || !product.manufacturer) return null;
    const m = product.manufacturer;
    return m._id ? m._id.toString() : m.toString();
}

/**
 * Mutates `query` for GET /api/products when caller is a manufacturer.
 * - Global browse: manufacturer !== self
 * - ?manufacturer=other: that supplier only
 * - ?manufacturer=self&scope=inventory: own SKUs only (dashboard, SKU management)
 * - ?manufacturer=self without scope=inventory: empty (e.g. own public profile in marketplace shell)
 */
function applyManufacturerBuyingListFilter(query, req) {
    const user = req.user;
    if (!user || user.role !== 'manufacturer') {
        return;
    }

    const uid = user._id;
    const manufacturerFilter = req.query.manufacturer;
    const inventoryScope = req.query.scope === 'inventory';

    if (manufacturerFilter) {
        if (manufacturerFilter.toString() === uid.toString()) {
            if (inventoryScope) {
                query.manufacturer = uid;
            } else {
                query._id = { $in: [] };
            }
        } else {
            query.manufacturer = manufacturerFilter;
        }
        return;
    }

    // Exclude own SKUs even if `manufacturer` was stored as ObjectId or as a string (mixed legacy data).
    const uidStr = uid.toString();
    const notOwn = [uidStr];
    if (mongoose.Types.ObjectId.isValid(uidStr)) {
        notOwn.push(new mongoose.Types.ObjectId(uidStr));
    }
    query.manufacturer = { $nin: notOwn };
}

/**
 * GET single product: block manufacturer from reading own product unless scope=inventory (edit form).
 * Returns error message or null.
 */
function assertManufacturerSingleProductRead(req, product) {
    if (!req.user || req.user.role !== 'manufacturer') {
        return null;
    }
    const uid = userIdString(req.user);
    const ownerId = productOwnerIdString(product);
    if (!ownerId || uid !== ownerId) {
        return null;
    }
    if (req.query.scope === 'inventory') {
        return null;
    }
    return ACCESS_DENIED_OWN_PRODUCT;
}

/**
 * Purchase / cart-style actions: buyer must not own the line item.
 * Returns error message or null.
 */
function assertBuyerDoesNotOwnProduct(buyer, product) {
    if (!buyer || !product) return null;
    const ownerId = productOwnerIdString(product);
    if (!ownerId) return null;
    const buyerId = userIdString(buyer);
    if (!buyerId) return null;
    if (buyer.role === 'manufacturer' && buyerId === ownerId) {
        return PURCHASE_OWN_PRODUCT_DENIED;
    }
    return null;
}

module.exports = {
    ACCESS_DENIED_OWN_PRODUCT,
    PURCHASE_OWN_PRODUCT_DENIED,
    applyManufacturerBuyingListFilter,
    assertManufacturerSingleProductRead,
    assertBuyerDoesNotOwnProduct,
    productOwnerIdString,
    userIdString
};
