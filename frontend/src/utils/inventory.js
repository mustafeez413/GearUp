export const LOW_STOCK_THRESHOLD = 15;

export const isProductActive = (product) => {
    if (!product) return false;
    const status = (product.status || '').toLowerCase();
    return !['draft', 'hidden', 'archived', 'deleted', 'inactive'].includes(status);
};

export const isLowStock = (product) => {
    if (!isProductActive(product)) return false;
    if (product.stock === undefined || product.stock === null) return false;
    return product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD;
};

export const isOutOfStock = (product) => {
    if (!isProductActive(product)) return false;
    if (product.stock === undefined || product.stock === null) return false;
    return product.stock === 0;
};

export const isLowStockAlert = (product) => {
    if (!isProductActive(product)) return false;
    if (product.stock === undefined || product.stock === null) return false;
    return product.stock <= LOW_STOCK_THRESHOLD;
};

export const isHealthyStock = (product) => {
    if (!isProductActive(product)) return false;
    if (product.stock === undefined || product.stock === null) return false;
    return product.stock > LOW_STOCK_THRESHOLD;
};

export const getInventoryStatus = (product) => {
    if (!isProductActive(product)) return 'Draft';
    if (isOutOfStock(product)) return 'Out of Stock';
    if (isLowStock(product)) return 'Low Stock';
    return 'Active';
};
