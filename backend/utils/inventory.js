const LOW_STOCK_THRESHOLD = 15;

const isProductActive = (product) => {
    if (!product) return false;
    const status = (product.status || '').toLowerCase();
    return !['draft', 'hidden', 'archived', 'deleted', 'inactive'].includes(status);
};

const isLowStockAlert = (product) => {
    if (!isProductActive(product)) return false;
    if (product.stock === undefined || product.stock === null) return false;
    return product.stock <= LOW_STOCK_THRESHOLD;
};

module.exports = {
    LOW_STOCK_THRESHOLD,
    isProductActive,
    isLowStockAlert
};
