export const LOW_STOCK_THRESHOLD = 10;

export const isProductActive = (product) => {
    if (!product || product.isDeleted) return false;
    const status = (product.status || '').toLowerCase();
    return !['draft', 'hidden', 'archived', 'deleted', 'inactive'].includes(status);
};

function getAvailable(product) {
    if (!product) return 0;
    if (product.availableStock !== undefined && product.availableStock !== null) return product.availableStock;
    return product.stock || 0;
}

function getThreshold(product) {
    if (product && product.lowStockThreshold !== undefined && product.lowStockThreshold !== null) {
        return product.lowStockThreshold;
    }
    return LOW_STOCK_THRESHOLD;
}

export const isLowStock = (product) => {
    if (!isProductActive(product)) return false;
    const avail = getAvailable(product);
    const threshold = getThreshold(product);
    return avail > 0 && avail <= threshold;
};

export const isOutOfStock = (product) => {
    if (!isProductActive(product)) return false;
    const avail = getAvailable(product);
    return avail <= 0;
};

export const isLowStockAlert = (product) => {
    if (!isProductActive(product)) return false;
    const avail = getAvailable(product);
    const threshold = getThreshold(product);
    return avail <= threshold;
};

export const isHealthyStock = (product) => {
    if (!isProductActive(product)) return false;
    const avail = getAvailable(product);
    const threshold = getThreshold(product);
    return avail > threshold;
};

export const getInventoryStatus = (product) => {
    if (!isProductActive(product)) return 'Draft';
    if (isOutOfStock(product)) return 'Out of Stock';
    if (isLowStock(product)) return 'Low Stock';
    return 'Active';
};
