import { isOrderInTimeRange } from '@/lib/dashboardUtils';

export const COMPLETED_SALE_STATUSES = new Set(['delivered', 'completed']);

/** Orders that should appear in revenue / sales charts (exclude pending/unconfirmed). */
export const CHART_ELIGIBLE_STATUSES = new Set([
    'processing',
    'confirmed',
    'order confirmed',
    'shipped',
    'delivered',
    'completed',
    'verified',
    'payment verified',
    'accepted'
]);

export const EXCLUDED_CHART_STATUSES = new Set([
    'pending',
    'pending_approval',
    'cancelled',
    'refunded',
    'draft',
    'rejected',
]);

export function normalizeStatus(status) {
    return (status || '').toLowerCase().trim();
}

export function isCompletedSaleStatus(status) {
    return COMPLETED_SALE_STATUSES.has(normalizeStatus(status));
}

export function resolveUserId(user) {
    return (user?.id || user?._id)?.toString() || null;
}

/** True when the user placed the order (spent money) — independent of account role. */
export function isBuyerOnOrder(order, userId) {
    if (!userId || !order) return false;
    const buyerId = (order.buyer?._id || order.buyer?.id || order.buyer)?.toString();
    return buyerId === userId;
}

export function isSellerOnOrder(order, userId) {
    if (!userId || !order) return false;

    if (isBuyerOnOrder(order, userId)) return false;

    const orderManId = (order.manufacturer?._id || order.manufacturer?.id || order.manufacturer)?.toString();
    if (orderManId === userId) return true;

    if (order.sellerStats?.some((s) => (s.seller?._id || s.seller?.id || s.seller)?.toString() === userId)) {
        return true;
    }

    return order.items?.some((i) => (i.seller?._id || i.seller?.id || i.seller)?.toString() === userId);
}

export function getSellerStatus(order, userId) {
    const myStats = order.sellerStats?.find(
        (s) => (s.seller?._id || s.seller?.id || s.seller)?.toString() === userId
    );
    return normalizeStatus(myStats?.status || order.status);
}

export function isChartEligibleSellerOrder(order, userId) {
    if (!isSellerOnOrder(order, userId)) return false;
    const status = getSellerStatus(order, userId);
    if (EXCLUDED_CHART_STATUSES.has(status)) return false;
    return CHART_ELIGIBLE_STATUSES.has(status);
}

export function isChartEligiblePurchaseOrder(order, userId) {
    const buyerId = (order.buyer?._id || order.buyer?.id || order.buyer)?.toString();
    if (!userId || buyerId !== userId) return false;
    const status = normalizeStatus(order.status);
    if (EXCLUDED_CHART_STATUSES.has(status)) return false;
    if (CHART_ELIGIBLE_STATUSES.has(status)) return true;
    return Boolean(order.isPaymentVerified) && status === 'processing';
}

export function getSellerSubtotal(order, userId) {
    const myStats = order.sellerStats?.find(
        (s) => (s.seller?._id || s.seller?.id || s.seller)?.toString() === userId
    );
    if (myStats?.subtotal != null) return myStats.subtotal;
    return getSellerOrderItems(order, userId).reduce(
        (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
        0
    );
}

export function isCompletedSaleOrder(order, userId) {
    if (!isSellerOnOrder(order, userId)) return false;
    return isCompletedSaleStatus(getSellerStatus(order, userId));
}

export function getPublishedProductIds(products = []) {
    return new Set(
        products
            .filter((p) => normalizeStatus(p.status) === 'published')
            .map((p) => p._id?.toString())
            .filter(Boolean)
    );
}

export function getItemProductId(item) {
    if (!item?.product) return null;
    return (item.product._id || item.product.id || item.product)?.toString() || null;
}

export function getSellerOrderItems(order, userId) {
    const myItems = order.items?.filter(
        (i) => (i.seller?._id || i.seller?.id || i.seller)?.toString() === userId
    );
    return myItems?.length ? myItems : isSellerOnOrder(order, userId) ? order.items || [] : [];
}

export function countTopSellingProducts(orders, products, userId, timeRange = null) {
    if (!userId) return 0;

    const publishedIds = getPublishedProductIds(products);
    const soldProductIds = new Set();

    orders
        .filter((o) => {
            if (timeRange && !isOrderInTimeRange(o.createdAt, timeRange)) return false;
            return isCompletedSaleOrder(o, userId);
        })
        .forEach((order) => {
            getSellerOrderItems(order, userId).forEach((item) => {
                const productId = getItemProductId(item);
                if (productId && publishedIds.has(productId)) {
                    soldProductIds.add(productId);
                }
            });
        });

    return soldProductIds.size;
}

export function getCurrentPeriodBounds(timeRange) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (timeRange) {
        case 'today':
            return { start: startOfToday, end: now };
        case 'week':
            return {
                start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
                end: now,
            };
        case 'month':
            return {
                start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
                end: now,
            };
        case '6months':
            return {
                start: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
                end: now,
            };
        case 'year':
            return {
                start: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
                end: now,
            };
        default:
            return { start: null, end: now };
    }
}

export function getPreviousPeriodBounds(timeRange) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (timeRange) {
        case 'today':
            return {
                start: new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000),
                end: startOfToday,
            };
        case 'week':
            return {
                start: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
                end: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            };
        case 'month':
            return {
                start: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
                end: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            };
        case '6months':
            return {
                start: new Date(now.getTime() - 360 * 24 * 60 * 60 * 1000),
                end: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
            };
        case 'year':
            return {
                start: new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000),
                end: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
            };
        default:
            return { start: null, end: null };
    }
}

export function isOrderInBounds(orderDateStr, start, end) {
    if (!orderDateStr || !start || !end) return false;
    const date = new Date(orderDateStr);
    return date >= start && date < end;
}

export function formatGrowthChange(current, previous, timeLabel) {
    if (previous <= 0) return null;
    const pct = ((current - previous) / previous) * 100;
    const sign = pct > 0 ? '+' : '';
    return {
        change: `${sign}${pct.toFixed(1)}% ${timeLabel}`,
        trend: pct >= 0 ? 'up' : 'down',
    };
}

export function countPublishedProducts(products = []) {
    return products.filter((p) => normalizeStatus(p.status) === 'published').length;
}

export function countProductsCreatedInRange(products, start, end) {
    if (!start || !end) return 0;
    return products.filter((p) => isOrderInBounds(p.createdAt, start, end)).length;
}
