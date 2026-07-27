export const LOW_STOCK_THRESHOLD = 10;

export const isProductActive = (product) => {
    if (!product || product.isDeleted || product.isActive === false) return false;
    const status = (product.status || '').toLowerCase();
    return !['draft', 'hidden', 'archived', 'deleted', 'inactive'].includes(status);
};

export function getProductAvailableStock(product) {
    if (!product) return 0;
    if (product.availableStock !== undefined && product.availableStock !== null) {
        return Math.max(0, Number(product.availableStock) || 0);
    }
    if (product.totalStock !== undefined && product.totalStock !== null) {
        const reserved = Number(product.reservedStock) || 0;
        return Math.max(0, (Number(product.totalStock) || 0) - reserved);
    }
    return Math.max(0, Number(product.stock) || 0);
}

export function getProductTotalStock(product) {
    if (!product) return 0;
    if (product.totalStock !== undefined && product.totalStock !== null) {
        return Math.max(0, Number(product.totalStock) || 0);
    }
    if (product.availableStock !== undefined && product.availableStock !== null) {
        const reserved = Number(product.reservedStock) || 0;
        return Math.max(0, (Number(product.availableStock) || 0) + reserved);
    }
    return Math.max(0, Number(product.stock) || 0);
}

function getAvailable(product) {
    return getProductAvailableStock(product);
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
