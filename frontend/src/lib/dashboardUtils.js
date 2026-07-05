/** Shared date-range filter for dashboard metrics */
export function normalizeTimeRange(range) {
    const aliases = {
        '7days': 'week',
        '30days': 'month',
        '3months': '6months',
        '12months': 'year',
    };
    return aliases[range] || range;
}

export function isOrderInTimeRange(orderDateStr, range) {
    if (!orderDateStr) return false;
    const normalizedRange = normalizeTimeRange(range);
    const orderDate = new Date(orderDateStr);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (normalizedRange) {
        case 'today':
            return orderDate >= startOfToday;
        case 'week':
            return orderDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case 'month':
            return orderDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        case '6months':
            return orderDate >= new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        case 'year':
            return orderDate >= new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        case 'custom':
            return true;
        default:
            return normalizedRange === range ? true : false;
    }
}

export const OPEN_DISPUTE_STATUSES = [
    'open',
    'awaiting_seller',
    'seller_responded',
    'under_review',
    'investigating'
];
