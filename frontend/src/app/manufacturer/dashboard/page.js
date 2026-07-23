"use client";

import { getApiBaseUrl } from '@/lib/api';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import useReadOnlyMode from '@/hooks/useReadOnlyMode';
import { isLowStockAlert } from '@/utils/inventory';
import { formatPKR, buildRefundRecordsFromDisputes, getNetSalesMetrics, getNetPurchaseMetrics, getUserFinancialMetrics } from '@/lib/financeUtils';
import { subscribeFinancialSync } from '@/lib/financialSync';
import { isOrderInTimeRange, OPEN_DISPUTE_STATUSES } from '@/lib/dashboardUtils';
import {
    countTopSellingProducts,
    countPublishedProducts,
    countProductsCreatedInRange,
    formatGrowthChange,
    getPreviousPeriodBounds,
    getCurrentPeriodBounds,
    getSellerOrderItems,
    isCompletedSaleOrder,
    isOrderInBounds,
    getSellerSubtotal,
    isChartEligibleSellerOrder,
    isChartEligiblePurchaseOrder,
    isSellerOnOrder,
    isBuyerOnOrder,
    resolveUserId,
} from '@/lib/dashboardAnalytics';
import {
    ShoppingCart,
    Banknote,
    Clock,
    Factory,
    AlertCircle,
    AlertTriangle,
    ArrowRight,
    Package,
    Truck,
    Users,
    Sparkles,
    CheckCircle2,
    Calendar,
    Star,
    TrendingUp,
    Activity
} from 'lucide-react';

// Reusable UI components
import dynamic from 'next/dynamic';
import WelcomeBanner from '@/components/dashboard/WelcomeBanner';
import QuickActionsCard from '@/components/dashboard/QuickActionsCard';
import StatCard from '@/components/dashboard/StatCard';
import DashboardSectionHeader from '@/components/dashboard/DashboardSectionHeader';
import Skeleton from '@/components/common/Skeleton';
import DashboardMetricsGrid from '@/components/dashboard/DashboardMetricsGrid';
import VerificationStatusBanner from '@/components/shared/VerificationStatusBanner';
import { getVerificationDisplayState } from '@/lib/verificationStats';

// Dynamically import heavy chart and table components to enable code splitting and faster initial load
const PremiumAnalyticsSection = dynamic(() => import('@/components/dashboard/PremiumAnalyticsSection'), { ssr: false, loading: () => <Skeleton variant="chart" /> });
const CategoryShareChart = dynamic(() => import('@/components/dashboard/CategoryShareChart'), { ssr: false, loading: () => <Skeleton variant="chart" /> });
const FinancialInsights = dynamic(() => import('@/components/dashboard/FinancialInsights'), { ssr: false, loading: () => <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6"><Skeleton variant="stat" /><Skeleton variant="stat" /><Skeleton variant="stat" /></div> });
const OrdersTable = dynamic(() => import('@/components/dashboard/OrdersTable'), { ssr: false, loading: () => <Skeleton variant="table" rows={5} /> });


const ManufacturerDashboard = () => {
    const [timeRange, setTimeRange] = useState('6months');
    const [filtering, setFiltering] = useState(false);
    const { user, updateUser } = useAuth();
    const { isReadOnlyMode } = useReadOnlyMode();
    const router = useRouter();

    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [marketProducts, setMarketProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openIssueCount, setOpenIssueCount] = useState(0);
    const [refundRecords, setRefundRecords] = useState([]);

    const fetchDashboardData = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const uid = user?.id || user?._id;
            const isManufacturer = user?.role === 'manufacturer';
            const inventoryProductsUrl =
                uid && isManufacturer
                    ? `${getApiBaseUrl()}/api/products?manufacturer=${uid}&scope=inventory`
                    : null;
            const publicCatalogUrl = !isManufacturer ? `${getApiBaseUrl()}/api/products` : null;

            const globalRes = await fetch(`${getApiBaseUrl()}/api/products`);
            const globalData = await globalRes.json();
            if (globalData.success) setMarketProducts(globalData.data);

            const ordersRes = await fetch(`${getApiBaseUrl()}/api/orders`, { headers });
            const ordersData = await ordersRes.json();
            if (ordersData.success) setOrders(ordersData.data);

            if (inventoryProductsUrl) {
                const productsRes = await fetch(inventoryProductsUrl, { headers });
                const productsData = await productsRes.json();
                if (productsData.success) setProducts(productsData.data);
            } else if (publicCatalogUrl) {
                const productsRes = await fetch(publicCatalogUrl, { headers });
                const productsData = await productsRes.json();
                if (productsData.success) setProducts(productsData.data);
            } else {
                setProducts([]);
            }

            const countOpen = (list) => (list || []).filter((d) => OPEN_DISPUTE_STATUSES.includes(d.status)).length;
            const [sellerDisputesRes, myDisputesRes] = await Promise.all([
                fetch(`${getApiBaseUrl()}/api/disputes/seller`, { headers }),
                fetch(`${getApiBaseUrl()}/api/disputes/mine`, { headers })
            ]);
            const sellerDisputesData = await sellerDisputesRes.json();
            const myDisputesData = await myDisputesRes.json();

            const allDisputes = [
                ...(sellerDisputesData.success ? sellerDisputesData.data || [] : []),
                ...(myDisputesData.success ? myDisputesData.data || [] : []),
            ];
            const uniqueDisputes = Array.from(
                new Map(allDisputes.map((d) => [String(d._id || d.id), d])).values()
            );
            setRefundRecords(buildRefundRecordsFromDisputes(uniqueDisputes));
            setOpenIssueCount(countOpen(uniqueDisputes));
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
        } finally {
            if (!silent) setLoading(false);
        }
    }, [user?.id, user?._id, user?.role]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    useEffect(() => {
        return subscribeFinancialSync(() => {
            fetchDashboardData(true);
        });
    }, [fetchDashboardData]);

    useEffect(() => {
        const checkVerificationStatus = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success && data.data?.verificationStatus !== user?.verificationStatus) {
                    updateUser(data.data);
                }
            } catch (err) {
                // Silently ignore
            }
        };

        checkVerificationStatus();
        const interval = setInterval(checkVerificationStatus, 30000);
        return () => clearInterval(interval);
    }, [user?.verificationStatus, updateUser]);

    // Handle premium filtering loading transition trigger
    const handleTimeRangeChange = (range) => {
        setFiltering(true);
        setTimeRange(range);
        setTimeout(() => {
            setFiltering(false);
        }, 550);
    };

    // Calculate fully dynamic, reactive dashboard metrics
    const stats = useMemo(() => {
        const userId = resolveUserId(user);
        const sellerOrders = orders.filter((o) => isSellerOnOrder(o, userId));
        const filtered = sellerOrders.filter((o) => isOrderInTimeRange(o.createdAt, timeRange));
        const completedFiltered = filtered.filter((o) => isCompletedSaleOrder(o, userId));

        const activeOrders = filtered.filter((o) => !['delivered', 'completed', 'cancelled'].includes((o.status || '').toLowerCase())).length;
        const purchaseOrders = orders.filter((o) => isOrderInTimeRange(o.createdAt, timeRange) && isBuyerOnOrder(o, userId));
        const purchaseOrdersCount = purchaseOrders.length;
        const receivedProducts = purchaseOrders.filter((o) => ['delivered', 'completed'].includes((o.status || '').toLowerCase())).length;
        const financials = getUserFinancialMetrics(orders, userId, refundRecords, timeRange);
        const revenue = financials.totalRevenue;
        const totalSpend = financials.totalSpend;
        const filteredCount = filtered.length;
        const pendingDeliveries = filtered.filter((o) => {
            const status = (o.status || '').toLowerCase();
            return status === 'processing' || status === 'pending';
        }).length;
        const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0) || 1;
        const totalOrdered = completedFiltered.reduce(
            (sum, o) => sum + (o.items || []).reduce((s, i) => s + (i.quantity || 0), 0),
            0
        );
        const avgCapacity = totalOrdered > 0 ? Math.min(Math.round((totalOrdered / totalStock) * 100), 100) : 0;

        const uniqueSuppliers = marketProducts.reduce((acc, p) => {
            const sellerId = p.seller?._id || p.seller || p.manufacturer;
            if (sellerId) acc.add(String(sellerId));
            return acc;
        }, new Set()).size;

        const pendingOrders = filtered.filter((o) => {
            const status = (o.status || '').toLowerCase();
            return status === 'pending' || status === 'processing';
        }).length;
        const deliveredOrders = filtered.filter((o) => isCompletedSaleOrder(o, userId)).length;

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todaysOrders = sellerOrders.filter((o) => o.createdAt && new Date(o.createdAt) >= startOfToday).length;

        const lowStockAlerts = products.filter(isLowStockAlert).length;
        const topSellingCount = countTopSellingProducts(orders, products, userId, timeRange);
        const publishedProductCount = countPublishedProducts(products);

        return {
            activeOrders,
            revenue,
            capacity: avgCapacity,
            pendingDeliveries,
            uniqueSuppliers,
            filteredCount,
            pendingOrders,
            deliveredOrders,
            receivedProducts,
            todaysOrders,
            lowStockAlerts,
            topSellingCount,
            publishedProductCount,
            purchaseOrdersCount,
            totalSpend,
        };
    }, [orders, products, marketProducts, timeRange, user, refundRecords]);

    // Dynamic Time-comparison KPI Growth Configurator
    const timeLabel = useMemo(() => {
        switch (timeRange) {
            case 'today': return 'vs yesterday';
            case 'week': return 'vs last week';
            case 'month': return 'vs last month';
            case '6months': return 'vs last 6 months';
            case 'year': return 'vs last year';
            default: return 'vs last month';
        }
    }, [timeRange]);

    // Growth rates from real prior-period data (null when no historical baseline)
    const growthMetrics = useMemo(() => {
        const userId = resolveUserId(user);
        const { start: currentStart, end: currentEnd } = getCurrentPeriodBounds(timeRange);
        const { start, end } = getPreviousPeriodBounds(timeRange);
        const currentRangeOrders = orders.filter((o) => isOrderInTimeRange(o.createdAt, timeRange));
        const previousRangeOrders = orders.filter((o) => isOrderInBounds(o.createdAt, start, end));

        const currentCompleted = currentRangeOrders.filter((o) => isCompletedSaleOrder(o, userId));
        const previousCompleted = previousRangeOrders.filter((o) => isCompletedSaleOrder(o, userId));

        const currentRevenue = getNetSalesMetrics(currentCompleted, userId, refundRecords, timeRange).totalRevenue;
        const previousRevenue = getNetSalesMetrics(
            previousCompleted,
            userId,
            refundRecords,
            null,
            { start, end }
        ).totalRevenue;
        const currentSalesCount = getNetSalesMetrics(currentCompleted, userId, refundRecords, timeRange).totalSalesCount;
        const previousSalesCount = getNetSalesMetrics(
            previousCompleted,
            userId,
            refundRecords,
            null,
            { start, end }
        ).totalSalesCount;

        const currentTopSelling = countTopSellingProducts(orders, products, userId, timeRange);
        const previousTopSelling = countTopSellingProducts(previousRangeOrders, products, userId, null);

        const currentPending = currentRangeOrders.filter((o) => isSellerOnOrder(o, userId)).filter((o) => {
            const status = (o.status || '').toLowerCase();
            return status === 'pending' || status === 'processing';
        }).length;
        const previousPending = previousRangeOrders.filter((o) => isSellerOnOrder(o, userId)).filter((o) => {
            const status = (o.status || '').toLowerCase();
            return status === 'pending' || status === 'processing';
        }).length;

        const currentDelivered = currentCompleted.length;
        const previousDelivered = previousCompleted.length;

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
        const todaysCount = orders.filter((o) => isSellerOnOrder(o, userId) && o.createdAt && new Date(o.createdAt) >= startOfToday).length;
        const yesterdaysCount = orders.filter((o) => isSellerOnOrder(o, userId) && o.createdAt && new Date(o.createdAt) >= startOfYesterday && new Date(o.createdAt) < startOfToday).length;

        const currentProducts = countProductsCreatedInRange(products, currentStart, currentEnd);
        const previousProducts = countProductsCreatedInRange(products, start, end);

        const todayLabel = 'vs yesterday';

        return {
            revenue: formatGrowthChange(currentRevenue, previousRevenue, timeLabel),
            orders: formatGrowthChange(currentSalesCount, previousSalesCount, timeLabel),
            products: formatGrowthChange(currentProducts, previousProducts, timeLabel),
            pending: formatGrowthChange(currentPending, previousPending, timeLabel),
            delivered: formatGrowthChange(currentDelivered, previousDelivered, timeLabel),
            today: formatGrowthChange(todaysCount, yesterdaysCount, todayLabel),
            topSelling: formatGrowthChange(currentTopSelling, previousTopSelling, timeLabel),
        };
    }, [orders, products, timeRange, timeLabel, user, refundRecords]);

    const overviewStats = useMemo(() => [
        // ROW 1
        {
            label: 'Total Revenue',
            value: formatPKR(stats.revenue),
            change: growthMetrics.revenue?.change || null,
            trend: growthMetrics.revenue?.trend || 'neutral',
            icon: Banknote,
            color: 'text-emerald-600 bg-emerald-50 border-emerald-100/60',
            href: '/manufacturer/analytics'
        },
        {
            label: 'Total Sales',
            value: stats.filteredCount,
            change: growthMetrics.orders?.change || null,
            trend: growthMetrics.orders?.trend || 'neutral',
            icon: ShoppingCart,
            color: 'text-blue-600 bg-blue-50 border-blue-100/60',
            href: '/manufacturer/orders'
        },
        {
            label: 'Total Products',
            value: stats.publishedProductCount,
            change: growthMetrics.products?.change || null,
            trend: growthMetrics.products?.trend || 'neutral',
            icon: Package,
            color: 'text-purple-600 bg-purple-50 border-purple-100/60',
            href: '/manufacturer/products'
        },
        {
            label: 'Pending Orders',
            value: stats.pendingOrders,
            change: growthMetrics.pending?.change || null,
            trend: growthMetrics.pending?.trend || 'neutral',
            icon: Clock,
            color: 'text-amber-600 bg-amber-50 border-amber-100/60',
            href: '/manufacturer/orders?status=pending'
        },
        // ROW 2
        {
            label: 'Orders Delivered',
            value: stats.deliveredOrders,
            change: growthMetrics.delivered?.change || null,
            trend: growthMetrics.delivered?.trend || 'neutral',
            icon: CheckCircle2,
            color: 'text-teal-600 bg-teal-50 border-teal-100/60',
            href: '/manufacturer/orders?status=delivered'
        },
        {
            label: 'Today\'s Orders',
            value: stats.todaysOrders,
            change: growthMetrics.today?.change || null,
            trend: growthMetrics.today?.trend || 'neutral',
            icon: Calendar,
            color: 'text-indigo-600 bg-indigo-50 border-indigo-100/60',
            href: '/manufacturer/orders?filter=today'
        },
        {
            label: 'Low Stock Alerts',
            value: stats.lowStockAlerts,
            change: null,
            trend: 'neutral',
            icon: AlertCircle,
            color: 'text-rose-600 bg-rose-50 border-rose-100/60',
            href: '/manufacturer/inventory?filter=low-stock'
        },
        {
            label: 'Top Selling Products',
            value: stats.topSellingCount,
            change: stats.topSellingCount === 0
                ? 'No sales data available yet'
                : growthMetrics.topSelling?.change || null,
            trend: stats.topSellingCount === 0 ? 'neutral' : (growthMetrics.topSelling?.trend || 'neutral'),
            icon: TrendingUp,
            color: 'text-fuchsia-600 bg-fuchsia-50 border-fuchsia-100/60',
            href: '/manufacturer/analytics/top-products'
        }
    ], [stats, growthMetrics]);

    const bannerStats = useMemo(() => [
        { label: 'Active Orders', value: stats.activeOrders, icon: ShoppingCart },
        { label: 'Total Revenue', value: formatPKR(stats.revenue), icon: Banknote, iconColor: 'bg-emerald-50 text-[#00A878] border border-emerald-100/30', textColor: 'text-[#00A878]' },
        { label: 'Pending Shipments', value: stats.pendingDeliveries, icon: Truck, iconColor: 'bg-amber-50 text-amber-600 border border-amber-100/30', textColor: 'text-amber-600' },
        { label: 'Capacity Utilized', value: `${stats.capacity}%`, icon: Factory, iconColor: 'bg-blue-50 text-blue-600 border border-blue-100/30', textColor: 'text-blue-600' }
    ], [stats]);

    // Dynamic, reactive Revenue data generation and bucketing based on timescale selection
    const revenueData = useMemo(() => {
        const userId = resolveUserId(user);
        const filtered = orders.filter(
            (o) => isOrderInTimeRange(o.createdAt, timeRange) && isChartEligibleSellerOrder(o, userId)
        );

        const addRevenue = (entry, order) => {
            entry.revenue += getSellerSubtotal(order, userId);
        };

        switch (timeRange) {
            case 'today': {
                const hours = ['09:00', '12:00', '15:00', '18:00', '21:00'];
                const data = hours.map(h => ({ period: h, revenue: 0 }));

                filtered.forEach(o => {
                    if (!o.createdAt) return;
                    const hour = new Date(o.createdAt).getHours();
                    if (hour < 11) addRevenue(data[0], o);
                    else if (hour < 14) addRevenue(data[1], o);
                    else if (hour < 17) addRevenue(data[2], o);
                    else if (hour < 20) addRevenue(data[3], o);
                    else addRevenue(data[4], o);
                });

                return data;
            }
            case 'week': {
                const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                const data = days.map(d => ({ period: d, revenue: 0 }));

                filtered.forEach(o => {
                    if (!o.createdAt) return;
                    let dayIdx = new Date(o.createdAt).getDay() - 1;
                    if (dayIdx < 0) dayIdx = 6;
                    addRevenue(data[dayIdx], o);
                });

                return data;
            }
            case 'month': {
                const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
                const data = weeks.map(w => ({ period: w, revenue: 0 }));

                filtered.forEach(o => {
                    if (!o.createdAt) return;
                    const date = new Date(o.createdAt).getDate();
                    if (date <= 7) addRevenue(data[0], o);
                    else if (date <= 14) addRevenue(data[1], o);
                    else if (date <= 21) addRevenue(data[2], o);
                    else addRevenue(data[3], o);
                });

                return data;
            }
            case 'year': {
                const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
                const data = quarters.map(q => ({ period: q, revenue: 0 }));

                filtered.forEach(o => {
                    if (!o.createdAt) return;
                    const m = new Date(o.createdAt).getMonth();
                    if (m < 3) addRevenue(data[0], o);
                    else if (m < 6) addRevenue(data[1], o);
                    else if (m < 9) addRevenue(data[2], o);
                    else addRevenue(data[3], o);
                });

                return data;
            }
            case '6months':
            default: {
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const currentMonth = new Date().getMonth();
                const last6 = [];
                for (let i = 5; i >= 0; i--) {
                    const m = (currentMonth - i + 12) % 12;
                    last6.push({
                        period: months[m],
                        revenue: 0
                    });
                }

                filtered.forEach(o => {
                    if (!o.createdAt) return;
                    const mName = months[new Date(o.createdAt).getMonth()];
                    const entry = last6.find(m => m.period === mName);
                    if (entry) addRevenue(entry, o);
                });

                return last6;
            }
        }
    }, [orders, timeRange, user]);

    const capacityData = useMemo(() => {
        const filtered = orders.filter(o => isOrderInTimeRange(o.createdAt, timeRange));
        const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0) || 1;

        if (filtered.length === 0) {
            return [
                { week: 'Q1', utilized: 0, available: 100 },
                { week: 'Q2', utilized: 0, available: 100 },
                { week: 'Q3', utilized: 0, available: 100 },
                { week: 'Latest', utilized: 0, available: 100 },
            ];
        }

        const sorted = [...filtered]
            .filter(o => o.createdAt)
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        const chunkSize = Math.max(1, Math.ceil(sorted.length / 4));
        const labels = ['Q1', 'Q2', 'Q3', 'Latest'];

        return labels.map((label, i) => {
            const chunk = sorted.slice(i * chunkSize, (i + 1) * chunkSize);
            const totalQty = chunk.reduce((sum, o) =>
                sum + (o.items || []).reduce((s, item) => s + (item.quantity || 0), 0), 0
            );
            const pct = Math.max(Math.min(Math.round((totalQty / totalStock) * 100), 100), 5);
            return {
                week: label,
                utilized: pct,
                available: 100 - pct
            };
        });
    }, [orders, products, timeRange]);

    const productPerformanceData = useMemo(() => {
        const userId = resolveUserId(user);
        const categoryMap = {};
        const completedSales = orders.filter(
            (o) => isOrderInTimeRange(o.createdAt, timeRange) && isCompletedSaleOrder(o, userId)
        );

        completedSales.forEach((order) => {
            getSellerOrderItems(order, userId).forEach((item) => {
                const cat = item.product?.category || 'Other';
                if (!categoryMap[cat]) categoryMap[cat] = 0;
                categoryMap[cat] += item.quantity || 1;
            });
        });

        const colors = ['#00A878', '#021018', '#6366F1', '#F59E0B', '#EC4899'];
        const total = Object.values(categoryMap).reduce((sum, count) => sum + count, 0);

        if (total === 0) {
            return [];
        }

        return Object.entries(categoryMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([cat, count], idx) => ({
                name: cat.charAt(0).toUpperCase() + cat.slice(1),
                revenue: Math.round((count / total) * 100),
                orders: count,
                color: colors[idx % colors.length],
            }));
    }, [orders, timeRange, user]);

    const recentOrders = useMemo(() => {
        // Filter to orders where this manufacturer is a seller (same logic as orders page)
        const loggedInUserId = (user?.id || user?._id)?.toString();
        const salesOrders = orders.filter(o => {
            const buyerId = (o.buyer?._id || o.buyer?.id || o.buyer)?.toString();
            if (buyerId && loggedInUserId && buyerId === loggedInUserId) return false;
            const orderManId = (o.manufacturer?._id || o.manufacturer?.id || o.manufacturer)?.toString();
            if (orderManId && loggedInUserId && orderManId === loggedInUserId) return true;
            return o.sellerStats?.some(stat => {
                const sellerId = (stat.seller?._id || stat.seller?.id || stat.seller)?.toString();
                return sellerId && loggedInUserId && sellerId === loggedInUserId;
            });
        });

        if (salesOrders.length === 0) {
            // No real data yet — show empty so OrdersTable renders the EmptyState
            return [];
        }

        // Sort newest first, take top 5 — same real _id as the orders page
        return [...salesOrders]
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            .slice(0, 5)
            .map(o => {
                const myStats = o.sellerStats?.find(s =>
                    (s.seller?._id || s.seller?.id || s.seller)?.toString() === loggedInUserId
                );
                const myItems = o.items?.filter(i =>
                    (i.seller?._id || i.seller?.id || i.seller)?.toString() === loggedInUserId
                ) || [];
                const subtotal = myStats?.subtotal ||
                    myItems.reduce((sum, i) => sum + (i.price * i.quantity), 0) ||
                    o.totalAmount || 0;
                const myStatus = myStats?.status || o.status || 'pending';

                // Build descriptive product string
                const displayItems = myItems.length > 0 ? myItems : (o.items || []);
                let productDisplay;
                if (displayItems.length === 0) {
                    productDisplay = '0 Units';
                } else if (displayItems.length === 1) {
                    const item = displayItems[0];
                    const name = item.name || item.product?.name || 'Product';
                    const unit = item.bulkUnit || item.product?.bulkUnit || 'Units';
                    productDisplay = `${name} (${item.quantity || 1} ${unit})`;
                } else if (displayItems.length === 2) {
                    const parts = displayItems.map((item) => {
                        const name = item.name || item.product?.name || 'Product';
                        const unit = item.bulkUnit || item.product?.bulkUnit || 'Units';
                        return `${name} (${item.quantity || 1} ${unit})`;
                    });
                    productDisplay = parts.join(', ');
                } else {
                    const first = displayItems[0];
                    const name = first.name || first.product?.name || 'Product';
                    const unit = first.bulkUnit || first.product?.bulkUnit || 'Units';
                    productDisplay = `${name} (${first.quantity || 1} ${unit}) +${displayItems.length - 1} more`;
                }

                return {
                    // Use same ID format as the orders page: last 8 chars of _id uppercase
                    id: o._id.slice(-8).toUpperCase(),
                    fullId: o._id,
                    buyer: o.buyer?.name || o.buyer?.businessDetails?.businessName || 'B2B Buyer',
                    items: productDisplay,
                    amount: subtotal,
                    status: myStatus,
                    date: o.createdAt || new Date()
                };
            });
    }, [orders, user?.id, user?._id]);

    const recentPurchases = useMemo(() => {
        const loggedInUserId = resolveUserId(user);
        const purchaseOrders = orders.filter((o) => {
            const buyerId = (o.buyer?._id || o.buyer?.id || o.buyer)?.toString();
            return buyerId && loggedInUserId && buyerId === loggedInUserId;
        });

        return [...purchaseOrders]
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            .slice(0, 5)
            .map((o) => {
                // Resolve supplier name from populated seller objects
                const firstSeller = o.items?.[0]?.seller;
                const supplierName =
                    (typeof firstSeller === 'object' && firstSeller !== null)
                        ? (firstSeller.businessDetails?.businessName || firstSeller.name)
                        : null;
                const mfgName =
                    (typeof o.manufacturer === 'object' && o.manufacturer !== null)
                        ? (o.manufacturer.businessDetails?.businessName || o.manufacturer.name)
                        : null;
                const sellerStatName = o.sellerStats?.[0]?.seller;
                const statName =
                    (typeof sellerStatName === 'object' && sellerStatName !== null)
                        ? (sellerStatName.businessDetails?.businessName || sellerStatName.name)
                        : null;
                const resolvedSupplierName = supplierName || mfgName || statName || 'Unknown Supplier';

                // Build descriptive product string from item names
                const items = o.items || [];
                let productDisplay;
                if (items.length === 0) {
                    productDisplay = '0 Units';
                } else if (items.length === 1) {
                    const item = items[0];
                    const name = item.name || item.product?.name || 'Product';
                    const unit = item.bulkUnit || item.product?.bulkUnit || 'Units';
                    productDisplay = `${name} (${item.quantity || 1} ${unit})`;
                } else if (items.length === 2) {
                    const parts = items.map((item) => {
                        const name = item.name || item.product?.name || 'Product';
                        const unit = item.bulkUnit || item.product?.bulkUnit || 'Units';
                        return `${name} (${item.quantity || 1} ${unit})`;
                    });
                    productDisplay = parts.join(', ');
                } else {
                    const first = items[0];
                    const name = first.name || first.product?.name || 'Product';
                    const unit = first.bulkUnit || first.product?.bulkUnit || 'Units';
                    productDisplay = `${name} (${first.quantity || 1} ${unit}) +${items.length - 1} more`;
                }

                return {
                    id: o._id.slice(-8).toUpperCase(),
                    fullId: o._id,
                    supplier: resolvedSupplierName,
                    buyer: resolvedSupplierName,
                    items: productDisplay,
                    amount: o.totalAmount || 0,
                    status: o.status || 'pending',
                    date: o.createdAt || new Date()
                };
            });
    }, [orders, user]);

    if (loading && orders.length === 0 && products.length === 0) {
        return (
            <div className="space-y-6 w-full animate-in fade-in duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    <div className="lg:col-span-8">
                        <WelcomeBanner
                            userName={user?.name || 'Hamza'}
                            timeRange={timeRange}
                            setTimeRange={handleTimeRangeChange}
                        />
                    </div>
                    <div className="lg:col-span-4">
                        <QuickActionsCard />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <Skeleton key={i} variant="stat" />
                    ))}
                </div>

                <div className="w-full">
                    <Skeleton variant="chart" />
                </div>

                <div className="w-full">
                    <Skeleton variant="table" rows={5} />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 w-full animate-in fade-in duration-300 pb-6 min-w-0">
            {/* SECTION 1 — HERO EXECUTIVE OVERVIEW */}
            <section className="w-full">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                    <div className="lg:col-span-8 min-w-0">
                        <WelcomeBanner
                            userName={user?.name || 'Hamza'}
                            timeRange={timeRange}
                            setTimeRange={handleTimeRangeChange}
                        />
                    </div>
                    <div className="lg:col-span-4 min-w-0">
                        <QuickActionsCard />
                    </div>
                </div>
            </section>

            {openIssueCount > 0 && (
                <Link
                    href="/manufacturer/disputes"
                    className="flex items-center justify-between gap-4 px-5 py-4 bg-rose-50 border border-rose-100 rounded-2xl hover:bg-rose-100/80 transition-colors"
                >
                    <span className="flex items-center gap-2 text-sm font-bold text-rose-800">
                        <AlertTriangle size={18} />
                        {openIssueCount} open order issue{openIssueCount !== 1 ? 's' : ''} need attention
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider text-rose-600 flex items-center gap-1">
                        View issues <ArrowRight size={14} />
                    </span>
                </Link>
            )}

            {getVerificationDisplayState(user) && (
                <VerificationStatusBanner
                    user={user}
                    notSubmittedDescription="Complete your business verification to unlock global wholesaling capabilities, dynamic pricing structures, and raw product catalogs."
                />
            )}

            {/* SECTION 2 — KPI ANALYTICS CARDS */}
            <DashboardMetricsGrid
                role="manufacturer"
                data={{
                    totalSpend: stats.totalSpend,
                    totalRevenue: stats.revenue,
                    salesOrdersCount: stats.filteredCount,
                    purchaseOrdersCount: stats.purchaseOrdersCount,
                    activeOrders: stats.activeOrders,
                    walletBalance: null,
                    deliveredOrders: stats.deliveredOrders,
                    receivedProducts: stats.receivedProducts,
                    todaysOrders: stats.todaysOrders,
                    pendingPayment: stats.pendingDeliveries
                }}
                loading={loading || filtering}
                timeLabel={timeLabel}
                growthRates={{
                    spend: '+0%',
                    revenue: growthMetrics.revenue?.change,
                    orders: growthMetrics.orders?.change
                }}
            />

            {/* SECTION 3 — SALES & PURCHASE PERFORMANCE */}
            <section className="flex flex-col space-y-8 pt-10 dashboard-divider">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#E8FFF5] text-[#00A878] shadow-sm">
                            <Activity size={28} className="stroke-[2.5]" />
                        </div>
                        <div>
                            <h2 className="text-[32px] font-bold text-[#0F172A] tracking-tight leading-tight">
                                Sales & Purchase Performance
                            </h2>
                            <p className="text-[15px] text-[#64748B] font-medium mt-1">
                                Track your sales and purchase trends over time
                            </p>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full items-stretch">
                    <div className="xl:col-span-2 flex flex-col h-full">
                        <PremiumAnalyticsSection 
                            orders={orders} 
                            user={user} 
                            loading={loading || filtering} 
                            timeRange={timeRange} 
                            onTimeRangeChange={handleTimeRangeChange} 
                        />
                    </div>
                    <div className="xl:col-span-1 flex flex-col h-full">
                        <CategoryShareChart 
                            products={products} 
                            loading={loading || filtering} 
                        />
                    </div>
                </div>
                <div className="w-full mt-2">
                    <FinancialInsights 
                        orders={orders} 
                        user={user} 
                        timeRange={timeRange} 
                        loading={loading || filtering}
                        refundRecords={refundRecords}
                    />
                </div>
            </section>

            {/* SECTION 4 — ORDERS & OPERATIONS */}
            <section className="flex flex-col space-y-8 pt-10 dashboard-divider">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#E8FFF5] text-[#00A878] shadow-sm">
                            <Package size={28} className="stroke-[2.5]" />
                        </div>
                        <div>
                            <h2 className="text-[32px] font-bold text-[#0F172A] tracking-tight leading-tight">
                                Orders & Operations
                            </h2>
                            <p className="text-[15px] text-[#64748B] font-medium mt-1">
                                Manage your active transactions and recent operational events
                            </p>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-6 w-full">
                    <OrdersTable
                        orders={recentOrders}
                        loading={loading || filtering}
                        onAddCatalogClick={
                            isReadOnlyMode ? undefined : () => router.push('/manufacturer/products/new')
                        }
                    />
                    <OrdersTable
                        orders={recentPurchases}
                        variant="purchases"
                        viewAllHref="/manufacturer/purchases"
                        loading={loading || filtering}
                        onAddCatalogClick={() => router.push('/wholesaler/marketplace')}
                    />
                </div>
            </section>


        </div>
    );
};

export default ManufacturerDashboard;
