"use client";

import { getApiBaseUrl } from '@/lib/api';
import { isOrderInTimeRange, OPEN_DISPUTE_STATUSES } from '@/lib/dashboardUtils';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { formatPKR, buildRefundRecordsFromDisputes, getUserFinancialMetrics } from '@/lib/financeUtils';
import { subscribeFinancialSync } from '@/lib/financialSync';
import { isSellerOnOrder, isBuyerOnOrder, isCompletedSaleOrder, resolveUserId } from '@/lib/dashboardAnalytics';
import {
    ShoppingCart,
    Banknote,
    Clock,
    AlertCircle,
    AlertTriangle,
    ArrowRight,
    Users,
    CheckCircle2,
    Calendar,
    Store,
    Package,
    Activity
} from 'lucide-react';
import dynamic from 'next/dynamic';
import WelcomeBanner from '@/components/dashboard/WelcomeBanner';
import QuickActionsCard from '@/components/dashboard/QuickActionsCard';
import StatCard from '@/components/dashboard/StatCard';
import DashboardSectionHeader from '@/components/dashboard/DashboardSectionHeader';
import Skeleton from '@/components/common/Skeleton';
import DashboardMetricsGrid from '@/components/dashboard/DashboardMetricsGrid';
import VerificationStatusBanner from '@/components/shared/VerificationStatusBanner';
import { getVerificationDisplayState } from '@/lib/verificationStats';
import { AD_SYSTEM_ENABLED } from '@/lib/advertisingConfig';



const PremiumAnalyticsSection = dynamic(() => import('@/components/dashboard/PremiumAnalyticsSection'), { ssr: false, loading: () => <Skeleton variant="chart" /> });
const CategoryShareChart = dynamic(() => import('@/components/dashboard/CategoryShareChart'), { ssr: false, loading: () => <Skeleton variant="chart" /> });
const FinancialInsights = dynamic(() => import('@/components/dashboard/FinancialInsights'), { ssr: false, loading: () => <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6"><Skeleton variant="stat" /><Skeleton variant="stat" /><Skeleton variant="stat" /></div> });
const OrdersTable = dynamic(() => import('@/components/dashboard/OrdersTable'), { ssr: false, loading: () => <Skeleton variant="table" rows={5} /> });

const wholesalerActions = [
    { label: 'Browse Marketplace', route: '/wholesaler/marketplace', color: 'text-purple-600 bg-purple-50/50 border-purple-100 hover:bg-purple-50' },
    { label: 'View Cart', route: '/wholesaler/cart', color: 'text-emerald-600 bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50' },
    { label: 'My Purchases', route: '/wholesaler/orders', color: 'text-blue-600 bg-blue-50/50 border-blue-100 hover:bg-blue-50' },
    { label: 'Order Issues', route: '/manufacturer/disputes', color: 'text-rose-600 bg-rose-50/50 border-rose-100 hover:bg-rose-50' }
];

export default function WholesalerDashboard() {
    const [timeRange, setTimeRange] = useState('6months');
    const [filtering, setFiltering] = useState(false);
    const { user, updateUser } = useAuth();
    const router = useRouter();

    const [orders, setOrders] = useState([]);
    const [marketProducts, setMarketProducts] = useState([]);
    const [walletBalance, setWalletBalance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [openIssueCount, setOpenIssueCount] = useState(0);
    const [refundRecords, setRefundRecords] = useState([]);

    const fetchDashboardData = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            const base = getApiBaseUrl();

            const [ordersRes, productsRes, walletRes, mineDisputesRes, sellerDisputesRes] = await Promise.all([
                fetch(`${base}/api/orders`, { headers }),
                fetch(`${base}/api/products`, { headers }),
                fetch(`${base}/api/wallet/me`, { headers }),
                fetch(`${base}/api/disputes/mine`, { headers }),
                fetch(`${base}/api/disputes/seller`, { headers }),
            ]);

            const ordersData = await ordersRes.json();
            const productsData = await productsRes.json();
            const walletData = await walletRes.json();
            const disputesData = await mineDisputesRes.json();
            const sellerDisputesData = await sellerDisputesRes.json();

            if (ordersData.success) setOrders(ordersData.data || []);
            if (productsData.success) setMarketProducts(productsData.data || []);
            if (walletData.success) setWalletBalance(walletData.data.balance ?? 0);

            const allDisputes = [
                ...(disputesData.success ? disputesData.data || [] : []),
                ...(sellerDisputesData.success ? sellerDisputesData.data || [] : []),
            ];
            const uniqueDisputes = Array.from(
                new Map(allDisputes.map((d) => [String(d._id || d.id), d])).values()
            );
            setRefundRecords(buildRefundRecordsFromDisputes(uniqueDisputes));
            setOpenIssueCount(
                uniqueDisputes.filter((d) => OPEN_DISPUTE_STATUSES.includes(d.status)).length
            );
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

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
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success && data.data?.verificationStatus !== user?.verificationStatus) {
                    updateUser(data.data);
                }
            } catch {
                /* ignore */
            }
        };
        checkVerificationStatus();
        const interval = setInterval(checkVerificationStatus, 30000);
        return () => clearInterval(interval);
    }, [user?.verificationStatus, updateUser]);

    const handleTimeRangeChange = (range) => {
        setFiltering(true);
        setTimeRange(range);
        setTimeout(() => setFiltering(false), 550);
    };

    const uid = resolveUserId(user);

    const purchaseOrders = useMemo(() => {
        return orders.filter((o) => isBuyerOnOrder(o, uid));
    }, [orders, uid]);

    const salesOrders = useMemo(() => {
        return orders.filter((o) => isSellerOnOrder(o, uid));
    }, [orders, uid]);

    const stats = useMemo(() => {
        const filtered = purchaseOrders.filter((o) => isOrderInTimeRange(o.createdAt, timeRange));
        const activeOrders = filtered.filter((o) => !['delivered', 'cancelled', 'completed'].includes((o.status || '').toLowerCase())).length;
        const financials = getUserFinancialMetrics(orders, uid, refundRecords, timeRange);
        const totalSpend = financials.totalSpend;
        const totalRevenue = financials.totalRevenue;
        const supplierIds = new Set();
        filtered.forEach((o) => {
            (o.items || []).forEach((item) => {
                const sid = (item.seller?._id || item.seller)?.toString();
                if (sid) supplierIds.add(sid);
            });
        });
        const deliveredOrders = salesOrders.filter((o) => isCompletedSaleOrder(o, uid)).length;
        const receivedProducts = purchaseOrders.filter((o) => {
            const globalStatus = (o.status || '').toLowerCase();
            return ['delivered', 'completed'].includes(globalStatus);
        }).length;
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todaysOrders = purchaseOrders.filter((o) => o.createdAt && new Date(o.createdAt) >= startOfToday).length;
        const pendingPayment = filtered.filter((o) => {
            const ps = (o.paymentStatus || '').toLowerCase();
            return ps.includes('pending') && !ps.includes('verified');
        }).length;

        return {
            activeOrders,
            totalSpend,
            totalRevenue,
            activeSuppliers: supplierIds.size,
            orderCount: filtered.length,
            deliveredOrders,
            receivedProducts,
            todaysOrders,
            pendingPayment
        };
    }, [purchaseOrders, salesOrders, orders, timeRange, uid, refundRecords]);

    const timeLabel = useMemo(() => {
        const map = { today: 'vs yesterday', week: 'vs last week', month: 'vs last month', '6months': 'vs last 6 months', year: 'vs last year' };
        return map[timeRange] || 'vs last month';
    }, [timeRange]);

    const growthRates = useMemo(() => {
        const map = {
            today: { spend: '2.1%', orders: '1.5%' },
            week: { spend: '6.2%', orders: '5.8%' },
            month: { spend: '14.2%', orders: '8.4%' },
            year: { spend: '28.4%', orders: '22.1%' },
            '6months': { spend: '16.4%', orders: '10.2%' }
        };
        return map[timeRange] || map['6months'];
    }, [timeRange]);

    const overviewStats = useMemo(() => [
        {
            label: 'Total Spend',
            value: formatPKR(stats.totalSpend),
            change: `${growthRates.spend} ${timeLabel}`,
            trend: 'up',
            icon: Banknote,
            color: 'text-emerald-600 bg-emerald-50 border-emerald-100/60',
            href: '/wholesaler/orders'
        },
        {
            label: 'Purchase Orders',
            value: stats.orderCount,
            change: `${growthRates.orders} ${timeLabel}`,
            trend: 'up',
            icon: ShoppingCart,
            color: 'text-blue-600 bg-blue-50 border-blue-100/60',
            href: '/wholesaler/orders'
        },
        {
            label: 'Active Orders',
            value: stats.activeOrders,
            change: `Live pipeline`,
            trend: 'up',
            icon: Clock,
            color: 'text-amber-600 bg-amber-50 border-amber-100/60',
            href: '/wholesaler/orders'
        },
        {
            label: 'Active Suppliers',
            value: stats.activeSuppliers,
            change: `${timeLabel}`,
            trend: 'up',
            icon: Users,
            color: 'text-purple-600 bg-purple-50 border-purple-100/60',
            href: '/wholesaler/manufacturers'
        },
        {
            label: 'Wallet Balance',
            value: walletBalance != null ? formatPKR(walletBalance) : '…',
            change: 'Platform wallet',
            trend: 'up',
            icon: Banknote,
            color: 'text-teal-600 bg-teal-50 border-teal-100/60',
            href: '/manufacturer/transactions'
        },
        {
            label: 'Delivered',
            value: stats.deliveredOrders,
            change: `${timeLabel}`,
            trend: 'up',
            icon: CheckCircle2,
            color: 'text-emerald-600 bg-emerald-50 border-emerald-100/60',
            href: '/wholesaler/orders'
        },
        {
            label: "Today's Orders",
            value: stats.todaysOrders,
            change: 'vs yesterday',
            trend: 'up',
            icon: Calendar,
            color: 'text-indigo-600 bg-indigo-50 border-indigo-100/60',
            href: '/wholesaler/orders'
        },
        {
            label: 'Pending Payment',
            value: stats.pendingPayment,
            change: 'Awaiting verification',
            trend: 'down',
            icon: AlertCircle,
            color: 'text-rose-600 bg-rose-50 border-rose-100/60',
            href: '/wholesaler/orders'
        }
    ], [stats, walletBalance, timeLabel, growthRates]);

    const chartProducts = useMemo(() => {
        const fromOrders = [];
        purchaseOrders.forEach((o) => {
            (o.items || []).forEach((item) => {
                for (let i = 0; i < (item.quantity || 1); i++) {
                    fromOrders.push({ category: item.product?.category || item.category || 'Other' });
                }
            });
        });
        return fromOrders.length > 0 ? fromOrders : marketProducts;
    }, [purchaseOrders, marketProducts]);

    const recentPurchases = useMemo(() => {
        if (purchaseOrders.length === 0) return [];
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
                const resolvedSupplier = supplierName || mfgName || statName || 'Unknown Supplier';

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
                    buyer: resolvedSupplier,
                    supplier: resolvedSupplier,
                    items: productDisplay,
                    amount: o.totalAmount || 0,
                    status: o.status || 'pending',
                    date: o.createdAt || new Date()
                };
            });
    }, [purchaseOrders]);

    // Recent Bulk Orders — same purchase orders but formatted for the "Bulk Orders" view
    // Shows the buyer's name (this wholesaler) and the supplier in a sales-style table
    const recentBulkOrders = useMemo(() => {
        if (purchaseOrders.length === 0) return [];
        return [...purchaseOrders]
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            .slice(0, 5)
            .map((o) => {
                // For bulk orders view, show the supplier/seller as the "buyer" column
                const firstSeller = o.items?.[0]?.seller;
                const supplierName =
                    (typeof firstSeller === 'object' && firstSeller !== null)
                        ? (firstSeller.businessDetails?.businessName || firstSeller.name)
                        : null;
                const mfgName =
                    (typeof o.manufacturer === 'object' && o.manufacturer !== null)
                        ? (o.manufacturer.businessDetails?.businessName || o.manufacturer.name)
                        : null;
                const sellerStatObj = o.sellerStats?.[0]?.seller;
                const statName =
                    (typeof sellerStatObj === 'object' && sellerStatObj !== null)
                        ? (sellerStatObj.businessDetails?.businessName || sellerStatObj.name)
                        : null;
                const resolvedSupplier = supplierName || mfgName || statName || 'Unknown Supplier';

                // Build descriptive product string
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
                    buyer: resolvedSupplier,
                    items: productDisplay,
                    amount: o.totalAmount || 0,
                    status: o.status || 'pending',
                    date: o.createdAt || new Date()
                };
            });
    }, [purchaseOrders]);

    if (loading && orders.length === 0) {
        return (
            <div className="space-y-6 w-full animate-in fade-in duration-300 min-w-0">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
                    <div className="xl:col-span-9">
                        <WelcomeBanner userName={user?.name || 'Partner'} timeRange={timeRange} setTimeRange={handleTimeRangeChange} />
                    </div>
                    <div className="xl:col-span-3">
                        <QuickActionsCard actions={wholesalerActions} />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <Skeleton key={i} variant="stat" />
                    ))}
                </div>
                <Skeleton variant="chart" />
                <Skeleton variant="table" rows={5} />
            </div>
        );
    }

    return (
        <div className="space-y-8 w-full animate-in fade-in duration-300 pb-6 min-w-0">
            <section className="w-full">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                    <div className="lg:col-span-8 min-w-0">
                        <WelcomeBanner
                            userName={user?.name || 'Partner'}
                            timeRange={timeRange}
                            setTimeRange={handleTimeRangeChange}
                        />
                    </div>
                    <div className="lg:col-span-4 min-w-0">
                        <QuickActionsCard actions={wholesalerActions} />
                    </div>
                </div>
            </section>

            {openIssueCount > 0 && (
                <Link
                    href="/manufacturer/disputes"
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-4 bg-rose-50 border border-rose-100 rounded-2xl hover:bg-rose-100/80 transition-colors"
                >
                    <span className="flex items-center gap-2 text-sm font-bold text-rose-800">
                        <AlertTriangle size={18} className="shrink-0" />
                        {openIssueCount} open order issue{openIssueCount !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider text-rose-600 flex items-center gap-1">
                        View issues <ArrowRight size={14} />
                    </span>
                </Link>
            )}

            {getVerificationDisplayState(user) && (
                <VerificationStatusBanner
                    user={user}
                    notSubmittedDescription="Complete verification to unlock marketplace purchasing and wallet checkout."
                />
            )}

            <DashboardMetricsGrid
                role="wholesaler"
                data={{
                    totalSpend: stats.totalSpend,
                    totalRevenue: stats.totalRevenue,
                    purchaseOrdersCount: stats.orderCount,
                    salesOrdersCount: salesOrders.length,
                    activeOrders: stats.activeOrders,
                    walletBalance: walletBalance,
                    deliveredOrders: stats.deliveredOrders,
                    receivedProducts: stats.receivedProducts,
                    todaysOrders: stats.todaysOrders,
                    pendingPayment: stats.pendingPayment
                }}
                loading={loading || filtering}
                timeLabel={timeLabel}
                growthRates={{
                    spend: growthRates.spend,
                    revenue: '+0%', // Not typical for wholesalers right now
                    orders: growthRates.orders
                }}
            />



            <section className="flex flex-col space-y-8 pt-8 dashboard-divider">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#E8FFF5] text-[#00A878] shadow-sm">
                            <Activity size={28} className="stroke-[2.5]" />
                        </div>
                        <div>
                            <h2 className="text-[32px] font-bold text-[#0F172A] tracking-tight leading-tight">
                                Spend & Supplier Analytics
                            </h2>
                            <p className="text-[15px] text-[#64748B] font-medium mt-1">
                                Track purchase volume and category mix over time
                            </p>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 w-full items-stretch min-w-0">
                    <div className="xl:col-span-2 min-w-0">
                        <PremiumAnalyticsSection
                            orders={orders}
                            products={marketProducts}
                            user={user}
                            loading={loading || filtering}
                            timeRange={timeRange}
                            onTimeRangeChange={handleTimeRangeChange}
                        />
                    </div>
                    <div className="xl:col-span-1 min-w-0">
                        <CategoryShareChart
                            products={chartProducts}
                            loading={loading || filtering}
                        />
                    </div>
                </div>
                <div className="w-full min-w-0">
                    <FinancialInsights
                        orders={orders}
                        user={user}
                        timeRange={timeRange}
                        loading={loading || filtering}
                        refundRecords={refundRecords}
                    />
                </div>
            </section>

            <section className="flex flex-col space-y-8 pt-8 dashboard-divider">
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
                        orders={recentBulkOrders}
                        loading={loading || filtering}
                        viewAllHref="/wholesaler/orders"
                        onAddCatalogClick={() => router.push('/wholesaler/marketplace')}
                        emptyTitle="No Active Bulk Orders"
                        emptyDescription="Browse the marketplace to place your first bulk order."
                        emptyActionLabel="Browse Marketplace"
                        partyLabel="Supplier Name"
                        partySubLabel="Manufacturer"
                    />
                    <OrdersTable
                        orders={recentPurchases}
                        variant="purchases"
                        viewAllHref="/wholesaler/orders"
                        loading={loading || filtering}
                        onAddCatalogClick={() => router.push('/wholesaler/marketplace')}
                        emptyTitle="No purchases yet"
                        emptyDescription="Browse the marketplace to place your first bulk order."
                        emptyActionLabel="Browse Marketplace"
                    />
                </div>
            </section>


        </div>
    );
}
