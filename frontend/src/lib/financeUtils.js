import {
    isChartEligiblePurchaseOrder,
    isChartEligibleSellerOrder,
    isBuyerOnOrder,
    isCompletedSaleOrder,
    isSellerOnOrder,
} from '@/lib/dashboardAnalytics';
import { isOrderInTimeRange } from '@/lib/dashboardUtils';

/**
 * Format currency to Pakistani conventions (Crore, Lakh, regular format)
 * Handles negative values and returns absolute string with 'Net Loss' capability if needed.
 */
export const formatPKR = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) return 'PKR 0';

    const isNegative = amount < 0;
    const absValue = Math.abs(amount);

    const formattedValue = absValue.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });

    if (isNegative) {
        return `-PKR ${formattedValue}`;
    }

    return `PKR ${formattedValue}`;
};

export const formatPKRShort = (amount) => formatPKR(amount);

export const calculateGrossProfit = (revenue, cogs) => revenue - cogs;

const PROCESSED_REFUND_STATUSES = new Set([
    'refunded',
    'approved',
    'processed',
    'success',
]);

function resolveId(value) {
    return (value?._id || value?.id || value)?.toString() || null;
}

function isProcessedRefundRecord(record) {
    const status = (record?.status || '').toLowerCase().trim();
    return PROCESSED_REFUND_STATUSES.has(status);
}

function getRefundTimestamp(record) {
    return record?.updatedAt || record?.processedAt || record?.createdAt;
}

function isRefundInTimeRange(record, timeRange, bounds) {
    const ts = getRefundTimestamp(record);
    if (!ts) return true;
    if (bounds?.start != null && bounds?.end != null) {
        const date = new Date(ts);
        return date >= bounds.start && date <= bounds.end;
    }
    if (!timeRange) return true;
    return isOrderInTimeRange(ts, timeRange);
}

/** Normalize dispute / admin refund payloads into a shared deduction shape. */
export function buildRefundRecordsFromDisputes(disputes = []) {
    return (disputes || [])
        .map((d) => ({
            seller: d.seller,
            buyer: d.buyer,
            refundAmount: Number(d.refundAmount) || 0,
            status: d.status,
            updatedAt: d.updatedAt,
            createdAt: d.createdAt,
            order: d.order,
        }));
}

export function sumSellerRefundDeductions(refundRecords, userId, timeRange, bounds = null) {
    const uid = resolveId(userId);
    if (!uid) return 0;

    return (refundRecords || []).reduce((sum, record) => {
        if (!isProcessedRefundRecord(record)) return sum;
        if (resolveId(record.seller) !== uid) return sum;
        if (!isRefundInTimeRange(record, timeRange, bounds)) return sum;
        return sum + (Number(record.refundAmount) || 0);
    }, 0);
}

export function countSellerRefunds(refundRecords, userId, timeRange, bounds = null) {
    const uid = resolveId(userId);
    if (!uid) return 0;

    return (refundRecords || []).reduce((count, record) => {
        if (resolveId(record.seller) !== uid) return count;
        if (!isRefundInTimeRange(record, timeRange, bounds)) return count;
        return count + 1;
    }, 0);
}

export function sumBuyerRefundDeductions(refundRecords, userId, timeRange, bounds = null) {
    const uid = resolveId(userId);
    if (!uid) return 0;

    return (refundRecords || []).reduce((sum, record) => {
        if (!isProcessedRefundRecord(record)) return sum;
        if (resolveId(record.buyer) !== uid) return sum;
        if (!isRefundInTimeRange(record, timeRange, bounds)) return sum;
        return sum + (Number(record.refundAmount) || 0);
    }, 0);
}

export function countBuyerRefunds(refundRecords, userId, timeRange, bounds = null) {
    const uid = resolveId(userId);
    if (!uid) return 0;

    return (refundRecords || []).reduce((count, record) => {
        if (resolveId(record.buyer) !== uid) return count;
        if (!isRefundInTimeRange(record, timeRange, bounds)) return count;
        return count + 1;
    }, 0);
}

export const getSalesMetrics = (orders, userId) => {
    let totalRevenue = 0;
    let totalSalesCount = 0;
    const uid = resolveId(userId);

    orders.forEach((order) => {
        if (!uid || !isChartEligibleSellerOrder(order, uid)) return;

        const myStats = order.sellerStats?.find((s) => resolveId(s.seller) === uid);
        const myItems = order.items?.filter((i) => resolveId(i.seller) === uid) || [];

        if (!myStats && myItems.length === 0) return;

        const revenue =
            myStats?.subtotal ||
            myItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        totalRevenue += revenue;
        totalSalesCount += 1;
    });

    return { totalRevenue, totalSalesCount };
};

export const getPurchaseMetrics = (orders, userId) => {
    let totalPurchasesAmount = 0;
    let totalPurchasesCount = 0;
    const uid = resolveId(userId);

    orders.forEach((order) => {
        if (!uid || !isChartEligiblePurchaseOrder(order, uid)) return;
        totalPurchasesAmount += order.totalAmount || 0;
        totalPurchasesCount += 1;
    });

    return { totalPurchasesAmount, totalPurchasesCount };
};

export const getNetSalesMetrics = (orders, userId, refundRecords = [], timeRange = null, refundBounds = null) => {
    const gross = getSalesMetrics(orders, userId);
    const refundDeductions = sumSellerRefundDeductions(refundRecords, userId, timeRange, refundBounds);

    return {
        totalRevenue: Math.max(0, gross.totalRevenue - refundDeductions),
        totalSalesCount: gross.totalSalesCount,
        grossRevenue: gross.totalRevenue,
        refundDeductions,
    };
};

export const getNetPurchaseMetrics = (orders, userId, refundRecords = [], timeRange = null, refundBounds = null) => {
    const gross = getPurchaseMetrics(orders, userId);
    const refundDeductions = sumBuyerRefundDeductions(refundRecords, userId, timeRange, refundBounds);

    return {
        totalPurchasesAmount: Math.max(0, gross.totalPurchasesAmount - refundDeductions),
        totalPurchasesCount: gross.totalPurchasesCount,
        grossPurchasesAmount: gross.totalPurchasesAmount,
        refundDeductions,
    };
};

/** Buyer/seller-agnostic financial snapshot for the signed-in user on their orders. */
export function getUserFinancialMetrics(orders, userId, refundRecords = [], timeRange = null) {
    const uid = resolveId(userId);
    if (!uid) {
        return { totalRevenue: 0, totalSpend: 0, salesOrdersCount: 0, purchaseOrdersCount: 0 };
    }

    const inRange = (order) => isOrderInTimeRange(order.createdAt, timeRange);
    const completedPurchases = orders.filter((o) => {
        if (!inRange(o) || !isBuyerOnOrder(o, uid)) return false;
        const status = (o.status || '').toLowerCase().trim();
        return status === 'delivered' || status === 'completed';
    });
    const completedSales = orders.filter((o) => inRange(o) && isCompletedSaleOrder(o, uid));

    const revenueMetrics = getNetSalesMetrics(completedSales, uid, refundRecords, timeRange);
    const spendMetrics = getNetPurchaseMetrics(completedPurchases, uid, refundRecords, timeRange);

    return {
        totalRevenue: revenueMetrics.totalRevenue,
        totalSpend: spendMetrics.totalPurchasesAmount,
        salesOrdersCount: revenueMetrics.totalSalesCount,
        purchaseOrdersCount: spendMetrics.totalPurchasesCount,
        grossRevenue: revenueMetrics.grossRevenue,
        grossSpend: spendMetrics.grossPurchasesAmount,
        sellerRefundDeductions: revenueMetrics.refundDeductions,
        buyerRefundDeductions: spendMetrics.refundDeductions,
    };
}

export const ITEM_DISPUTE_LOCKED_STATUSES = new Set([
    'open',
    'settled',
    'refunded',
    'rejected',
    'resolved',
    'awaiting_seller',
    'seller_responded',
    'under_review',
    'investigating',
]);

export function isItemDisputeLocked(status) {
    const normalized = (status || 'none').toLowerCase().trim();
    return normalized !== 'none' && ITEM_DISPUTE_LOCKED_STATUSES.has(normalized);
}

export { isChartEligibleSellerOrder, isChartEligiblePurchaseOrder, isBuyerOnOrder, isSellerOnOrder } from '@/lib/dashboardAnalytics';
