"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { getApiBaseUrl } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Skeleton from '@/components/common/Skeleton';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
    Banknote, ShoppingCart, Activity, ArrowUpRight, ArrowDownRight,
    Download, RefreshCw, Calendar as CalendarIcon 
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, ComposedChart, Line, XAxis, YAxis, 
    CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { formatPKR, formatPKRShort, sumSellerRefundDeductions, sumBuyerRefundDeductions } from '@/lib/financeUtils';
import { useRefundRecords } from '@/hooks/useRefundRecords';
import { isChartEligibleSellerOrder, isChartEligiblePurchaseOrder, getSellerSubtotal } from '@/lib/dashboardAnalytics';

function AnalyticsContent() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeTab = searchParams.get('tab') || 'sales';

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [timeRange, setTimeRange] = useState('6months');
    const { refundRecords } = useRefundRecords();

    const setActiveTab = (tab) => {
        router.push(`/manufacturer/analytics?tab=${tab}`);
    };

    const fetchOrders = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await fetch(`${getApiBaseUrl()}/api/orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                // Filter all orders involving this user
                const currentUserId = (user?._id || user?.id)?.toString();
                const myOrders = data.data.filter(o => {
                    const isBuyer = (o.buyer?._id || o.buyer?.id || o.buyer)?.toString() === currentUserId;
                    const isSellerDirect = (o.seller?._id || o.seller?.id || o.seller)?.toString() === currentUserId;
                    const isItemSeller = o.items?.some(i => (i.seller?._id || i.seller?.id || i.seller)?.toString() === currentUserId);
                    const isStatsSeller = o.sellerStats?.some(s => (s.seller?._id || s.seller?.id || s.seller)?.toString() === currentUserId);
                    
                    return isBuyer || isSellerDirect || isItemSeller || isStatsSeller;
                });
                setOrders(myOrders);
            }
        } catch (err) {
            console.error('Error fetching analytics data:', err);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        if (user) {
            fetchOrders();
        }
    }, [fetchOrders, user]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchOrders();
        setTimeout(() => setRefreshing(false), 500);
    };

    // Calculate KPI Stats with proper filtering
    const { stats, salesOrders, purchaseOrders } = useMemo(() => {
        const now = new Date();
        let cutoffDate;
        let prevCutoffDate;
        
        switch (timeRange) {
            case '7days': cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); prevCutoffDate = new Date(cutoffDate.getTime() - 7 * 24 * 60 * 60 * 1000); break;
            case '30days': cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); prevCutoffDate = new Date(cutoffDate.getTime() - 30 * 24 * 60 * 60 * 1000); break;
            case '3months': cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); prevCutoffDate = new Date(cutoffDate.getTime() - 90 * 24 * 60 * 60 * 1000); break;
            case '6months': cutoffDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000); prevCutoffDate = new Date(cutoffDate.getTime() - 180 * 24 * 60 * 60 * 1000); break;
            case '12months': cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); prevCutoffDate = new Date(cutoffDate.getTime() - 365 * 24 * 60 * 60 * 1000); break;
            default: cutoffDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000); prevCutoffDate = new Date(cutoffDate.getTime() - 180 * 24 * 60 * 60 * 1000);
        }

        const isDaily = timeRange === '7days' || timeRange === '30days';
        const numPeriods = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : timeRange === '3months' ? 3 : timeRange === '6months' ? 6 : 12;
        
        const periodDataMap = {};
        for (let i = numPeriods - 1; i >= 0; i--) {
            const d = new Date();
            if (isDaily) {
                d.setDate(d.getDate() - i);
                const label = d.toLocaleDateString('default', { month: 'short', day: 'numeric' });
                periodDataMap[label] = { Revenue: 0, Expenses: 0, Profit: 0 };
            } else {
                d.setMonth(d.getMonth() - i);
                const label = d.toLocaleString('default', { month: 'short' });
                periodDataMap[label] = { Revenue: 0, Expenses: 0, Profit: 0 };
            }
        }

        let totalSalesVal = 0; let prevSalesVal = 0;
        let totalPurchasesVal = 0; let prevPurchasesVal = 0;
        let pendingPurchases = 0;
        const uniqueSuppliers = new Set();
        const currentSalesOrders = [];
        const currentPurchaseOrders = [];

        orders.forEach(o => {
            const date = new Date(o.createdAt);
            const buyerId = (o.buyer?._id || o.buyer?.id || o.buyer)?.toString();
            const currentUserId = (user?._id || user?.id)?.toString();
            const isPurchase = buyerId === currentUserId;
            
            let amount = 0;
            if (isPurchase) {
                if (!isChartEligiblePurchaseOrder(o, currentUserId)) return;
                amount = o.totalAmount || 0;
            } else {
                if (!isChartEligibleSellerOrder(o, currentUserId)) return;
                amount = getSellerSubtotal(o, currentUserId);
            }

            if (date >= cutoffDate) {
                if (isPurchase) {
                    totalPurchasesVal += amount;
                    currentPurchaseOrders.push(o);
                    if (o.status === 'processing' || o.status === 'pending') pendingPurchases++;
                    const sid = o.seller?._id || o.seller;
                    if (sid) uniqueSuppliers.add(sid);
                } else {
                    totalSalesVal += amount;
                    currentSalesOrders.push(o);
                }

                // Add to chart
                const label = isDaily ? date.toLocaleDateString('default', { month: 'short', day: 'numeric' }) : date.toLocaleString('default', { month: 'short' });
                if (periodDataMap[label] !== undefined) {
                    if (isPurchase) periodDataMap[label].Expenses += amount;
                    else periodDataMap[label].Revenue += amount;
                }
            } else if (date >= prevCutoffDate) {
                if (isPurchase) prevPurchasesVal += amount;
                else prevSalesVal += amount;
            }
        });

        const chartData = Object.keys(periodDataMap).map(key => {
            const p = periodDataMap[key];
            return { name: key, Revenue: p.Revenue, Expenses: p.Expenses, Profit: p.Revenue - p.Expenses };
        });

        const calcChange = (curr, prev) => {
            if (prev === 0) return curr > 0 ? '+100%' : '0%';
            const change = ((curr - prev) / prev) * 100;
            return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
        };

        const currentUserId = (user?._id || user?.id)?.toString();
        
        const salesRefunds = sumSellerRefundDeductions(refundRecords, currentUserId, null, { start: cutoffDate, end: now });
        const prevSalesRefunds = sumSellerRefundDeductions(refundRecords, currentUserId, null, { start: prevCutoffDate, end: cutoffDate });
        
        const purchaseRefunds = sumBuyerRefundDeductions(refundRecords, currentUserId, null, { start: cutoffDate, end: now });
        const prevPurchaseRefunds = sumBuyerRefundDeductions(refundRecords, currentUserId, null, { start: prevCutoffDate, end: cutoffDate });

        totalSalesVal = Math.max(0, totalSalesVal - salesRefunds);
        prevSalesVal = Math.max(0, prevSalesVal - prevSalesRefunds);
        
        totalPurchasesVal = Math.max(0, totalPurchasesVal - purchaseRefunds);
        prevPurchasesVal = Math.max(0, prevPurchasesVal - prevPurchaseRefunds);

        const grossProfitVal = totalSalesVal - totalPurchasesVal;
        const prevProfitVal = prevSalesVal - prevPurchasesVal;

        return {
            stats: {
                totalSalesVal,
                salesChange: calcChange(totalSalesVal, prevSalesVal),
                totalPurchasesVal,
                purchasesChange: calcChange(totalPurchasesVal, prevPurchasesVal),
                grossProfitVal,
                profitChange: calcChange(grossProfitVal, prevProfitVal),
                pendingPurchases,
                uniqueSuppliers: uniqueSuppliers.size,
                chartData
            },
            salesOrders: currentSalesOrders.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)),
            purchaseOrders: currentPurchaseOrders.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
        };
    }, [orders, user, timeRange]);

    const handleExport = () => {
        const rows = [];
        if (activeTab === 'sales') {
            rows.push(['Order ID', 'Date', 'Buyer', 'Status', 'Revenue (PKR)']);
            salesOrders.forEach(o => {
                rows.push([o._id, new Date(o.createdAt).toLocaleDateString(), o.buyer?.businessName || o.buyer?.name || 'Unknown', o.status, o.totalAmount]);
            });
        } else if (activeTab === 'purchases') {
            rows.push(['PO Number', 'Date', 'Supplier', 'Status', 'Cost (PKR)']);
            purchaseOrders.forEach(o => {
                rows.push([o._id, new Date(o.createdAt).toLocaleDateString(), o.seller?.businessName || o.seller?.name || 'Unknown', o.status, o.totalAmount]);
            });
        } else if (activeTab === 'profit') {
            rows.push(['Period', 'Revenue (PKR)', 'Expenses (PKR)', 'Net Profit (PKR)']);
            stats.chartData.forEach(d => {
                rows.push([d.name, d.Revenue, d.Expenses, d.Profit]);
            });
        }

        const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `gearup_analytics_${activeTab}_${timeRange}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return <div className="p-8"><Skeleton variant="chart" /></div>;
    }

    return (
        <div className="space-y-8 w-full animate-in fade-in duration-500 pb-10">
            
            {/* Header Section */}
            <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[16px] p-[32px] shadow-[0_8px_24px_rgba(15,23,42,0.05)] flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-6">
                <div>
                    <h1 className="text-[40px] font-[700] text-[#0F172A] leading-tight tracking-tight">Business Analytics</h1>
                    <p className="text-[16px] text-[#64748B] mt-2">
                        Track revenue, procurement, and financial performance in real time.
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <select 
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="bg-white border border-[#E5E7EB] text-[#0F172A] text-sm font-semibold rounded-xl px-4 py-3 outline-none cursor-pointer focus:border-[#00A878] focus:ring-2 focus:ring-[#00A878]/20 transition-all shadow-sm"
                    >
                        <option value="7days">Last 7 Days</option>
                        <option value="30days">Last 30 Days</option>
                        <option value="3months">Last 3 Months</option>
                        <option value="6months">Last 6 Months</option>
                        <option value="12months">Last 12 Months</option>
                    </select>

                    <button 
                        onClick={handleRefresh}
                        className="flex items-center gap-2 px-[20px] py-[12px] bg-white border border-[#E5E7EB] text-[#0F172A] rounded-xl font-semibold hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Refresh
                    </button>

                    <button 
                        onClick={handleExport}
                        className="flex items-center gap-2 px-[20px] py-[12px] bg-[#00A878] text-white rounded-xl font-semibold hover:bg-[#009166] transition-all shadow-[0_8px_20px_rgba(0,168,120,0.25)]"
                    >
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </div>

            {/* KPI Cards / Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                {[
                    { id: 'sales', label: 'Total Sales', value: stats.totalSalesVal, icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', trend: stats.salesChange?.startsWith('-') ? 'down' : 'up', change: stats.salesChange },
                    { id: 'purchases', label: 'Total Purchases', value: stats.totalPurchasesVal, icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', trend: stats.purchasesChange?.startsWith('-') ? 'down' : 'up', change: stats.purchasesChange },
                    { id: 'profit', label: 'Gross Profit', value: stats.grossProfitVal, icon: Activity, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100', trend: stats.profitChange?.startsWith('-') ? 'down' : 'up', change: stats.profitChange }
                ].map((kpi) => {
                    const Icon = kpi.icon;
                    const isActive = activeTab === kpi.id;
                    
                    return (
                        <div 
                            key={kpi.id}
                            onClick={() => setActiveTab(kpi.id)}
                            className={`block bg-white rounded-[1.5rem] p-6 border ${isActive ? 'border-slate-400 shadow-[0_8px_30px_rgb(0,0,0,0.08)] scale-[1.01]' : 'border-[#E2E8F0] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] hover:shadow-lg hover:-translate-y-1'} transition-all duration-300 group relative overflow-hidden flex flex-col justify-between cursor-pointer`}
                        >
                            <div className="flex justify-between items-start mb-6 z-10">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${kpi.bg} ${kpi.color} group-hover:scale-110 transition-transform duration-500`}>
                                    <Icon size={24} strokeWidth={2.5} />
                                </div>
                            </div>
                            <div className="z-10">
                                <h3 className="text-[#64748B] font-bold text-[11px] uppercase tracking-wider mb-1.5">{kpi.label}</h3>
                                <p className="font-heading text-3xl font-black text-slate-900 tracking-tighter mb-2">{formatPKR(kpi.value)}</p>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? kpi.color.replace('text-', 'bg-') : 'bg-slate-300'}`} />
                                    vs last period
                                </span>
                            </div>
                            <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-0 ${isActive ? 'opacity-20' : 'group-hover:opacity-10'} transition-opacity duration-500 pointer-events-none ${kpi.bg}`} />
                        </div>
                    );
                })}
            </div>

            {/* DYNAMIC TAB CONTENT */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* ----------------- SALES TAB ----------------- */}
                {activeTab === 'sales' && (
                    <div className="space-y-6">
                        {/* Revenue Chart */}
                        <div className="bg-white p-6 rounded-[1.5rem] border border-[#E2E8F0] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)]">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="font-heading text-lg font-bold text-slate-800 tracking-tight">Revenue Trend</h3>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Monthly Sales Velocity</p>
                                </div>
                                <div className="px-3 py-1.5 bg-emerald-50/50 rounded-lg border border-emerald-100">
                                    <span className="font-bold text-emerald-700 text-[13px] tracking-wide">{formatPKR(stats.totalSalesVal)}</span>
                                </div>
                            </div>
                            <div className="h-[320px] w-full -ml-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barGap={6}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 600}} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} width={100} tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 600}} tickFormatter={(val) => formatPKRShort(val)} dx={-10} />
                                        <RechartsTooltip 
                                            contentStyle={{borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px', fontWeight: 'bold'}}
                                            formatter={(value) => [formatPKR(value), 'Revenue']}
                                        />
                                        <Bar dataKey="Revenue" fill="#00A878" radius={[4, 4, 0, 0]} maxBarSize={48} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Sales History Table & Insights */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 bg-white rounded-[1.5rem] border border-[#E2E8F0] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
                                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="font-heading text-lg font-bold text-slate-800 tracking-tight">Recent Sales Orders</h3>
                                </div>
                                <div className="overflow-x-auto flex-1 p-2">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="text-slate-400 text-[10px] uppercase tracking-widest font-bold border-b border-slate-50">
                                                <th className="px-4 py-4">Order ID</th>
                                                <th className="px-4 py-4">Buyer</th>
                                                <th className="px-4 py-4">Status</th>
                                                <th className="px-4 py-4">Date</th>
                                                <th className="px-4 py-4 text-right">Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {salesOrders.slice(0, 5).map((order) => (
                                                <tr key={order._id} className="hover:bg-slate-50/50 transition-colors text-sm font-semibold text-slate-700 group cursor-pointer">
                                                    <td className="px-4 py-4 group-hover:text-slate-900 transition-colors">#{order._id.substring(order._id.length - 6).toUpperCase()}</td>
                                                    <td className="px-4 py-4 truncate max-w-[150px] group-hover:text-slate-900 transition-colors">{order.buyer?.businessName || order.buyer?.name || 'Unknown Buyer'}</td>
                                                    <td className="px-4 py-4">
                                                        <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-widest ${
                                                            order.status === 'delivered' || order.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                                            order.status === 'processing' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                                            order.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                                                            'bg-amber-50 text-amber-700 border border-amber-100'
                                                        }`}>
                                                            {order.status === 'completed' ? 'Completed' : order.status === 'delivered' ? 'Completed' : order.status === 'processing' ? 'Processing' : order.status === 'cancelled' ? 'Cancelled' : 'Pending'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-slate-500 text-[13px] font-medium">{new Date(order.createdAt).toLocaleDateString()}</td>
                                                    <td className="px-4 py-4 text-right font-black text-slate-900">{formatPKR(order.totalAmount)}</td>
                                                </tr>
                                            ))}
                                            {salesOrders.length === 0 && (
                                                <tr><td colSpan="5" className="px-4 py-16 text-center text-slate-400 font-medium">No sales found.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-white rounded-[1.5rem] border border-[#E2E8F0] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] p-6">
                                    <h3 className="font-heading text-lg font-bold text-slate-800 tracking-tight mb-5">Top Categories</h3>
                                    <div className="space-y-5">
                                        {['Cricket Gear', 'Protective Wear', 'Athletic Shoes'].map((cat, i) => (
                                            <div key={i} className="group">
                                                <div className="flex justify-between text-[13px] mb-1.5">
                                                    <span className="font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{cat}</span>
                                                    <span className="text-slate-500 font-bold">{75 - (i * 15)}%</span>
                                                </div>
                                                <div className="w-full bg-slate-50 border border-slate-100 rounded-full h-2 overflow-hidden">
                                                    <div className="bg-slate-900 h-full rounded-full transition-all duration-500" style={{ width: `${75 - (i * 15)}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ----------------- PURCHASES TAB ----------------- */}
                {activeTab === 'purchases' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-[1.5rem] border border-[#E2E8F0] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)]">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="font-heading text-lg font-bold text-slate-800 tracking-tight">Procurement Trend</h3>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Monthly Procurement Spend</p>
                                </div>
                                <div className="px-3 py-1.5 bg-blue-50/50 rounded-lg border border-blue-100">
                                    <span className="font-bold text-blue-700 text-[13px] tracking-wide">{formatPKR(stats.totalPurchasesVal)}</span>
                                </div>
                            </div>
                            <div className="h-[320px] w-full -ml-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barGap={6}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 600}} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} width={100} tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 600}} tickFormatter={(val) => formatPKRShort(val)} dx={-10} />
                                        <RechartsTooltip 
                                            contentStyle={{borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px', fontWeight: 'bold'}}
                                            formatter={(value) => [formatPKR(value), 'Purchases']}
                                        />
                                        <Bar dataKey="Expenses" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={48} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 bg-white rounded-[1.5rem] border border-[#E2E8F0] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
                                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="font-heading text-lg font-bold text-slate-800 tracking-tight">Recent Purchase Orders</h3>
                                </div>
                                <div className="overflow-x-auto flex-1 p-2">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="text-slate-400 text-[10px] uppercase tracking-widest font-bold border-b border-slate-50">
                                                <th className="px-4 py-4">PO Number</th>
                                                <th className="px-4 py-4">Supplier</th>
                                                <th className="px-4 py-4">Status</th>
                                                <th className="px-4 py-4">Date</th>
                                                <th className="px-4 py-4 text-right">Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {purchaseOrders.slice(0, 5).map((order) => (
                                                <tr key={order._id} className="hover:bg-slate-50/50 transition-colors text-sm font-semibold text-slate-700 group cursor-pointer">
                                                    <td className="px-4 py-4 group-hover:text-slate-900 transition-colors">#{order._id.substring(order._id.length - 6).toUpperCase()}</td>
                                                    <td className="px-4 py-4 truncate max-w-[150px] group-hover:text-slate-900 transition-colors">{order.seller?.businessName || order.seller?.name || 'Unknown Supplier'}</td>
                                                    <td className="px-4 py-4">
                                                        <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-widest ${
                                                            order.status === 'delivered' || order.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                                            order.status === 'processing' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                                            order.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                                                            'bg-blue-50 text-blue-700 border border-blue-100'
                                                        }`}>
                                                            {order.status === 'completed' ? 'Delivered' : order.status === 'delivered' ? 'Delivered' : order.status === 'processing' ? 'Pending Approval' : order.status === 'cancelled' ? 'Cancelled' : 'Pending'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-slate-500 text-[13px] font-medium">{new Date(order.createdAt).toLocaleDateString()}</td>
                                                    <td className="px-4 py-4 text-right font-black text-slate-900">{formatPKR(order.totalAmount)}</td>
                                                </tr>
                                            ))}
                                            {purchaseOrders.length === 0 && (
                                                <tr><td colSpan="5" className="px-4 py-16 text-center text-slate-400 font-medium">No purchases found.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="bg-white rounded-[1.5rem] border border-[#E2E8F0] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] p-6">
                                    <h3 className="font-heading text-lg font-bold text-slate-800 tracking-tight mb-5">Supplier Concentration</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-[13px] border-b border-slate-50 pb-3">
                                            <span className="font-bold text-slate-700">Total Suppliers Used</span>
                                            <span className="bg-slate-100 text-slate-900 font-bold px-2.5 py-1 rounded-md">{stats.uniqueSuppliers}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[13px] border-b border-slate-50 pb-3">
                                            <span className="font-bold text-slate-700">Top Supplier Dependency</span>
                                            <span className="text-amber-600 font-bold">42%</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[13px]">
                                            <span className="font-bold text-slate-700">Avg Lead Time</span>
                                            <span className="text-emerald-600 font-bold tracking-wide">4.2 Days</span>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                )}

                {/* ----------------- PROFIT TAB ----------------- */}
                {activeTab === 'profit' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-[1.5rem] border border-[#E2E8F0] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)]">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="font-heading text-lg font-bold text-slate-800 tracking-tight">Financial Performance Overview</h3>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Revenue vs Expenses Margin</p>
                                </div>
                                <div className="px-3 py-1.5 bg-teal-50/50 rounded-lg border border-teal-100">
                                    <span className="font-bold text-teal-700 text-[13px] tracking-wide">{formatPKR(stats.grossProfitVal)} Profit</span>
                                </div>
                            </div>
                            <div className="h-[320px] w-full -ml-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barGap={6}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 600}} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} width={100} tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 600}} tickFormatter={(val) => formatPKRShort(val)} dx={-10} />
                                        <RechartsTooltip 
                                            contentStyle={{borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px', fontWeight: 'bold'}}
                                            formatter={(value) => [formatPKR(value)]}
                                        />
                                        <Bar dataKey="Revenue" fill="#00A878" radius={[4, 4, 0, 0]} barSize={24} />
                                        <Bar dataKey="Expenses" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-3 bg-white rounded-[1.5rem] border border-[#E2E8F0] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
                                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="font-heading text-lg font-bold text-slate-800 tracking-tight">Monthly Profitability Breakdown</h3>
                                </div>
                                <div className="overflow-x-auto flex-1 p-2">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="text-slate-400 text-[10px] uppercase tracking-widest font-bold border-b border-slate-50">
                                                <th className="px-4 py-4">Month</th>
                                                <th className="px-4 py-4 text-right">Revenue</th>
                                                <th className="px-4 py-4 text-right">Expenses</th>
                                                <th className="px-4 py-4 text-right">Net Profit</th>
                                                <th className="px-4 py-4 text-center">Margin</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {stats.chartData.slice(-5).reverse().map((month, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors text-sm font-semibold text-slate-700 group">
                                                    <td className="px-4 py-4 font-bold text-slate-900 group-hover:text-slate-900 transition-colors">{month.name}</td>
                                                    <td className="px-4 py-4 text-right text-emerald-600 font-bold tracking-wide">{formatPKR(month.Revenue)}</td>
                                                    <td className="px-4 py-4 text-right text-rose-600 font-bold tracking-wide">{formatPKR(month.Expenses)}</td>
                                                    <td className="px-4 py-4 text-right font-black text-slate-900">{formatPKR(month.Profit)}</td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                                                            (month.Revenue > 0 && (month.Profit / month.Revenue) > 0.15) ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                                            (month.Revenue > 0 && (month.Profit / month.Revenue) > 0) ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                                            'bg-rose-50 text-rose-700 border border-rose-100'
                                                        }`}>
                                                            {month.Revenue > 0 ? ((month.Profit / month.Revenue) * 100).toFixed(1) : 0}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {stats.chartData.length === 0 && (
                                                <tr><td colSpan="5" className="px-4 py-16 text-center text-slate-400 font-medium">No monthly data available.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>


                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AnalyticsPage() {
    return (
        <Suspense fallback={<div className="p-8"><Skeleton variant="chart" /></div>}>
            <AnalyticsContent />
        </Suspense>
    );
}
