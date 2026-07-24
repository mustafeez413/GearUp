const LOW_STOCK_THRESHOLD = 10;

const isProductActive = (product) => {
    if (!product || product.isDeleted) return false;
    const status = (product.status || '').toLowerCase();
    return !['draft', 'hidden', 'archived', 'deleted', 'inactive'].includes(status);
};

const isLowStockAlert = (product) => {
    if (!isProductActive(product)) return false;
    const available = product.availableStock != null ? product.availableStock : product.stock;
    if (available === undefined || available === null) return false;
    const threshold = product.lowStockThreshold != null ? product.lowStockThreshold : LOW_STOCK_THRESHOLD;
    return available <= threshold;
};

module.exports = {
    LOW_STOCK_THRESHOLD,
    isProductActive,
    isLowStockAlert
};
