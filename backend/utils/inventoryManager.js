const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');
const { createNotification } = require('../controllers/notificationController');

/**
 * Atomic Inventory Management Utility Functions
 * Enforces single-deduction, concurrency protection, and detailed audit logging.
 */

function logInventoryAudit(details) {
    const {
        actionType,
        productId,
        productName,
        orderId,
        qty,
        prevTotal,
        newTotal,
        prevReserved,
        newReserved,
        prevAvailable,
        newAvailable,
        userId
    } = details;

    console.log(
        `[INVENTORY AUDIT LOG] ${new Date().toISOString()} | ` +
        `Action: ${actionType} | ` +
        `Product: "${productName}" (${productId}) | ` +
        `Order: ${orderId ? '#' + String(orderId).slice(-6) : 'N/A'} | ` +
        `Qty Changed: ${qty} | ` +
        `Total: ${prevTotal} -> ${newTotal} | ` +
        `Reserved: ${prevReserved} -> ${newReserved} | ` +
        `Available: ${prevAvailable} -> ${newAvailable} | ` +
        `User: ${userId || 'System'}`
    );
}

async function reserveStock(productId, quantity, orderId, userId) {
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) return null;

    const product = await Product.findById(productId);
    if (!product) throw new Error('Product not found for stock reservation.');
    if (product.isDeleted) throw new Error(`Product ${product.name} is no longer available.`);

    const currentTotal = product.totalStock != null ? product.totalStock : (product.stock || 0);
    const currentReserved = product.reservedStock || 0;
    const currentAvailable = Math.max(0, currentTotal - currentReserved);

    if (currentAvailable < qty) {
        throw new Error(`Insufficient available stock for ${product.name}. Requested: ${qty}, Available: ${currentAvailable}`);
    }

    const prevTotal = currentTotal;
    const prevReserved = currentReserved;
    const prevAvailable = currentAvailable;

    product.totalStock = currentTotal;
    product.reservedStock = currentReserved + qty;
    product.availableStock = Math.max(0, product.totalStock - product.reservedStock);
    product.set('stock', product.availableStock, { merge: true });

    // Check low stock alert trigger
    const threshold = product.lowStockThreshold || 10;
    if (product.availableStock <= threshold && !product.lowStockAlertTriggered) {
        product.lowStockAlertTriggered = true;
        try {
            const sellerId = (product.manufacturer || product.seller)?.toString();
            if (sellerId) {
                await createNotification(
                    sellerId,
                    `Low stock alert: ${product.name} has only ${product.availableStock} ${product.bulkUnit || 'unit'}s available.`,
                    'alert',
                    '/manufacturer/products'
                );
            }
        } catch (notifErr) {
            console.error('[INVENTORY] Low stock alert notification error:', notifErr.message);
        }
    }

    await product.save();

    logInventoryAudit({
        actionType: 'Order Placed',
        productId: product._id,
        productName: product.name,
        orderId,
        qty,
        prevTotal,
        newTotal: product.totalStock,
        prevReserved,
        newReserved: product.reservedStock,
        prevAvailable,
        newAvailable: product.availableStock,
        userId
    });

    await InventoryLog.create({
        product: product._id,
        order: orderId || null,
        previousTotalStock: prevTotal,
        newTotalStock: product.totalStock,
        previousReservedStock: prevReserved,
        newReservedStock: product.reservedStock,
        previousAvailableStock: prevAvailable,
        newAvailableStock: product.availableStock,
        quantityChanged: qty,
        actionType: 'Order Placed',
        user: userId || null,
        remarks: `Reserved ${qty} units for order ${orderId ? '#' + String(orderId).slice(-6) : ''}`
    });

    return product;
}

async function shipStock(productId, quantity, orderId, userId) {
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) return null;

    const product = await Product.findById(productId);
    if (!product) return null;

    const prevTotal = product.totalStock != null ? product.totalStock : (product.stock || 0);
    const prevReserved = product.reservedStock || 0;
    const prevAvailable = product.availableStock != null ? product.availableStock : Math.max(0, prevTotal - prevReserved);

    product.reservedStock = Math.max(0, prevReserved - qty);
    product.totalStock = Math.max(0, prevTotal - qty);
    product.availableStock = Math.max(0, product.totalStock - product.reservedStock);
    product.set('stock', product.availableStock, { merge: true });

    await product.save();

    logInventoryAudit({
        actionType: 'Order Shipped',
        productId: product._id,
        productName: product.name,
        orderId,
        qty,
        prevTotal,
        newTotal: product.totalStock,
        prevReserved,
        newReserved: product.reservedStock,
        prevAvailable,
        newAvailable: product.availableStock,
        userId
    });

    await InventoryLog.create({
        product: product._id,
        order: orderId || null,
        previousTotalStock: prevTotal,
        newTotalStock: product.totalStock,
        previousReservedStock: prevReserved,
        newReservedStock: product.reservedStock,
        previousAvailableStock: prevAvailable,
        newAvailableStock: product.availableStock,
        quantityChanged: qty,
        actionType: 'Order Shipped',
        user: userId || null,
        remarks: `Shipped ${qty} units for order ${orderId ? '#' + String(orderId).slice(-6) : ''}`
    });

    return product;
}

async function releaseReservedStock(productId, quantity, orderId, userId, actionType = 'Order Cancelled') {
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) return null;

    const product = await Product.findById(productId);
    if (!product) return null;

    const prevTotal = product.totalStock != null ? product.totalStock : (product.stock || 0);
    const prevReserved = product.reservedStock || 0;
    const prevAvailable = product.availableStock != null ? product.availableStock : Math.max(0, prevTotal - prevReserved);

    product.totalStock = prevTotal;
    product.reservedStock = Math.max(0, prevReserved - qty);
    product.availableStock = Math.max(0, product.totalStock - product.reservedStock);
    product.set('stock', product.availableStock, { merge: true });

    const threshold = product.lowStockThreshold || 10;
    if (product.availableStock > threshold) {
        product.lowStockAlertTriggered = false;
    }

    await product.save();

    logInventoryAudit({
        actionType,
        productId: product._id,
        productName: product.name,
        orderId,
        qty,
        prevTotal,
        newTotal: product.totalStock,
        prevReserved,
        newReserved: product.reservedStock,
        prevAvailable,
        newAvailable: product.availableStock,
        userId
    });

    await InventoryLog.create({
        product: product._id,
        order: orderId || null,
        previousTotalStock: prevTotal,
        newTotalStock: product.totalStock,
        previousReservedStock: prevReserved,
        newReservedStock: product.reservedStock,
        previousAvailableStock: prevAvailable,
        newAvailableStock: product.availableStock,
        quantityChanged: qty,
        actionType: actionType,
        user: userId || null,
        remarks: `Released ${qty} reserved units due to ${actionType}`
    });

    return product;
}

async function handleReturnedStock(productId, quantity, orderId, userId, passedInspection = true) {
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) return null;

    const product = await Product.findById(productId);
    if (!product) return null;

    const prevTotal = product.totalStock != null ? product.totalStock : (product.stock || 0);
    const prevReserved = product.reservedStock || 0;
    const prevAvailable = product.availableStock != null ? product.availableStock : Math.max(0, prevTotal - prevReserved);

    if (passedInspection) {
        product.totalStock = prevTotal + qty;
        product.returnedStock = (product.returnedStock || 0) + qty;
        product.availableStock = Math.max(0, product.totalStock - product.reservedStock);
        product.set('stock', product.availableStock, { merge: true });

        const threshold = product.lowStockThreshold || 10;
        if (product.availableStock > threshold) {
            product.lowStockAlertTriggered = false;
        }
    } else {
        product.damagedStock = (product.damagedStock || 0) + qty;
    }

    await product.save();

    logInventoryAudit({
        actionType: 'Return Received',
        productId: product._id,
        productName: product.name,
        orderId,
        qty,
        prevTotal,
        newTotal: product.totalStock,
        prevReserved,
        newReserved: product.reservedStock,
        prevAvailable,
        newAvailable: product.availableStock,
        userId
    });

    await InventoryLog.create({
        product: product._id,
        order: orderId || null,
        previousTotalStock: prevTotal,
        newTotalStock: product.totalStock,
        previousReservedStock: prevReserved,
        newReservedStock: product.reservedStock,
        previousAvailableStock: prevAvailable,
        newAvailableStock: product.availableStock,
        quantityChanged: qty,
        actionType: 'Return Received',
        user: userId || null,
        remarks: `Returned ${qty} units (${passedInspection ? 'Passed inspection - Restored to stock' : 'Failed inspection - Moved to damaged stock'})`
    });

    return product;
}

async function adjustStock(productId, newTotalStock, userId, remarks = 'Restock') {
    const total = parseInt(newTotalStock, 10);
    if (isNaN(total) || total < 0) return null;

    const product = await Product.findById(productId);
    if (!product) return null;

    const prevTotal = product.totalStock != null ? product.totalStock : (product.stock || 0);
    const prevReserved = product.reservedStock || 0;
    const prevAvailable = product.availableStock != null ? product.availableStock : Math.max(0, prevTotal - prevReserved);

    const delta = total - prevTotal;

    product.totalStock = total;
    product.availableStock = Math.max(0, product.totalStock - product.reservedStock);
    product.set('stock', product.availableStock, { merge: true });

    const threshold = product.lowStockThreshold || 10;
    if (product.availableStock > threshold) {
        product.lowStockAlertTriggered = false;
    }

    await product.save();

    const actionType = delta >= 0 ? 'Restock' : 'Manual Adjustment';

    logInventoryAudit({
        actionType,
        productId: product._id,
        productName: product.name,
        orderId: null,
        qty: Math.abs(delta),
        prevTotal,
        newTotal: product.totalStock,
        prevReserved,
        newReserved: product.reservedStock,
        prevAvailable,
        newAvailable: product.availableStock,
        userId
    });

    await InventoryLog.create({
        product: product._id,
        previousTotalStock: prevTotal,
        newTotalStock: product.totalStock,
        previousReservedStock: prevReserved,
        newReservedStock: product.reservedStock,
        previousAvailableStock: prevAvailable,
        newAvailableStock: product.availableStock,
        quantityChanged: Math.abs(delta),
        actionType: actionType,
        user: userId || null,
        remarks: remarks || `Stock adjusted from ${prevTotal} to ${total}`
    });

    return product;
}

module.exports = {
    reserveStock,
    shipStock,
    releaseReservedStock,
    handleReturnedStock,
    adjustStock
};
