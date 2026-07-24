/**
 * Utility functions for independent seller order lifecycles and master order status aggregation.
 */

function normalizeStatus(status) {
    if (!status) return '';
    return String(status).trim().toLowerCase();
}

/**
 * Derives the aggregate Master Order status from an array of sellerStats objects.
 * 
 * Rules:
 * - All 'completed' -> 'completed'
 * - All 'cancelled' -> 'cancelled'
 * - All 'refunded' -> 'cancelled'
 * - All 'pending' -> 'pending'
 * - All 'processing' -> 'processing'
 * - All 'shipped' -> 'shipped'
 * - All 'delivered' -> 'delivered'
 * - Mixed statuses (e.g. one completed, one pending) -> 'partially_completed'
 */
function deriveMasterOrderStatus(sellerStats = []) {
    if (!Array.isArray(sellerStats) || sellerStats.length === 0) {
        return 'pending';
    }

    const statuses = sellerStats
        .map((s) => normalizeStatus(s?.status))
        .filter(Boolean);

    if (statuses.length === 0) return 'pending';

    const uniqueStatuses = new Set(statuses);

    if (uniqueStatuses.size === 1) {
        const single = Array.from(uniqueStatuses)[0];
        if (single === 'refunded') return 'cancelled';
        return single;
    }

    // Check if all are cancelled/refunded
    const allCancelledOrRefunded = statuses.every((st) => ['cancelled', 'refunded'].includes(st));
    if (allCancelledOrRefunded) return 'cancelled';

    // Check if all are completed
    const allCompleted = statuses.every((st) => st === 'completed');
    if (allCompleted) return 'completed';

    // Mixed status -> Partially Completed
    return 'partially_completed';
}

function getSellerStat(order, sellerId) {
    if (!order || !order.sellerStats || !sellerId) return null;
    const targetId = String(sellerId._id || sellerId);
    return order.sellerStats.find(
        (s) => String(s.seller?._id || s.seller) === targetId
    );
}

function getSellerOrderStatus(order, sellerId) {
    const stat = getSellerStat(order, sellerId);
    if (stat && stat.status) {
        return normalizeStatus(stat.status);
    }
    return normalizeStatus(order?.status) || 'pending';
}

function isSellerStatusDisputable(sellerStatus) {
    const norm = normalizeStatus(sellerStatus);
    return ['delivered', 'completed'].includes(norm);
}

module.exports = {
    normalizeStatus,
    deriveMasterOrderStatus,
    getSellerStat,
    getSellerOrderStatus,
    isSellerStatusDisputable
};
