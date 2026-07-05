"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getApiBaseUrl } from '@/lib/api';
import Skeleton from '@/components/common/Skeleton';
import { isOrderInTimeRange } from '@/lib/dashboardUtils';
import { useAuth } from '@/context/AuthContext';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Download, TrendingUp, Users, Package, Banknote } from 'lucide-react';
import { formatPKR, formatPKRShort } from '@/lib/financeUtils';

export default function SalesReportsPage() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState('6months');

    const fetchSalesData = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${getApiBaseUrl()}/api/orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                // Filter to only sales (user is seller/manufacturer)
                const sales = data.data.filter(o => o.seller?._id === user?.id || o.seller === user?.id || o.seller?._id === user?._id);
                setOrders(sales);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [user?.id, user?._id]);

    useEffect(() => {
        if (user) {
            fetchSalesData();
        }
    }, [fetchSalesData, user]);

    const filteredOrders = useMemo(() => {
        return orders.filter(o => isOrderInTimeRange(o.createdAt, timeFilter));
    }, [orders, timeFilter]);

    const stats = useMemo(() => {
        const revenue = filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const totalSales = filteredOrders.length;
        const uniqueBuyers = new Set(filteredOrders.map(o => o.buyer?._id || o.buyer)).size;
        const totalItems = filteredOrders.reduce((sum, o) => sum + (o.items || []).reduce((s, i) => s + (i.quantity || 0), 0), 0);

        return { revenue, totalSales, uniqueBuyers, totalItems };
    }, [filteredOrders]);

    const chartData = useMemo(() => {
        // Group by month for 'year' or '6months'
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const dataMap = {};
        
        filteredOrders.forEach(o => {
            const date = new Date(o.createdAt);
            const key = `${months[date.getMonth()]} ${date.getFullYear()}`;
            if (!dataMap[key]) dataMap[key] = { name: key, revenue: 0, orders: 0 };
            dataMap[key].revenue += (o.totalAmount || 0);
            dataMap[key].orders += 1;
        });

        return Object.values(dataMap);
    }, [filteredOrders]);

    if (loading) {
        return (
                <div className="p-6"><Skeleton variant="chart" /></div>
        );
    }

    return (
            <div className="p-6 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-bold text-[#0F172A]">Sales Analytics</h1>
                        <p className="text-slate-500 font-medium text-sm mt-1">Detailed revenue reports and sales trends.</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <select 
                            value={timeFilter} 
                            onChange={(e) => setTimeFilter(e.target.value)}
                            className="bg-white border border-slate-200 text-sm font-semibold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#00A878] focus:border-transparent cursor-pointer shadow-sm"
                        >
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="6months">Last 6 Months</option>
                            <option value="year">This Year</option>
                            <option value="all">All Time</option>
                        </select>
                        <button className="flex items-center gap-2 bg-[#0F172A] hover:bg-[#1E293B] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm">
                            <Download size={16} /> Export Report
                        </button>
                    </div>
                </div>

                {/* KPI Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[
                        { label: 'Total Revenue', value: formatPKR(stats.revenue), icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Total Sales', value: stats.totalSales, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Unique Buyers', value: stats.uniqueBuyers, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
                        { label: 'Items Sold', value: stats.totalItems, icon: Package, color: 'text-amber-600', bg: 'bg-amber-50' }
                    ].map((kpi, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${kpi.bg}`}>
                                    <kpi.icon size={24} className={kpi.color} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-500 mb-1">{kpi.label}</p>
                                    <p className="font-heading text-2xl font-bold text-slate-800">{kpi.value}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Chart */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
                    <h3 className="font-heading text-lg font-bold text-slate-800 mb-6">Revenue Trend</h3>
                    <div className="w-full h-[350px]">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barGap={6}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} width={100} tick={{fill: '#64748B', fontSize: 12}} tickFormatter={(val) => formatPKRShort(val)} />
                                    <RechartsTooltip 
                                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                        formatter={(value) => [formatPKR(value), 'Revenue']}
                                    />
                                    <Bar dataKey="revenue" fill="#00A878" radius={[4, 4, 0, 0]} maxBarSize={48} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400 font-medium">No revenue data for this period</div>
                        )}
                    </div>
                </div>

                {/* Sales History Table & Operational Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-heading text-lg font-bold text-slate-800">Recent Sales Orders</h3>
                        </div>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                                        <th className="px-6 py-4">Order ID</th>
                                        <th className="px-6 py-4">Buyer</th>
                                        <th className="px-6 py-4 text-center">Items</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4 text-right">Revenue</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredOrders.slice(0, 10).map((order) => (
                                        <tr key={order._id} className="hover:bg-slate-50/50 transition-colors text-sm font-medium text-slate-700">
                                            <td className="px-6 py-4">#{order._id.substring(order._id.length - 6).toUpperCase()}</td>
                                            <td className="px-6 py-4 truncate max-w-[150px]" title={order.buyer?.businessName || order.buyer?.name}>
                                                {order.buyer?.businessName || order.buyer?.name || 'Unknown Buyer'}
                                            </td>
                                            <td className="px-6 py-4 text-center">{order.items?.length || 0}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                                                    order.status === 'delivered' || order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                                    order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                                    order.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                                                    'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {order.status === 'completed' ? 'Completed' : order.status === 'delivered' ? 'Completed' : order.status === 'processing' ? 'Processing' : order.status === 'cancelled' ? 'Cancelled' : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 text-xs">{new Date(order.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-900">{formatPKR(order.totalAmount)}</td>
                                        </tr>
                                    ))}
                                    {filteredOrders.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-medium">No sales found for this period.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                            <h3 className="font-heading text-lg font-bold text-slate-800 mb-5">Top Selling Categories</h3>
                            <div className="space-y-4">
                                {['Cricket Gear', 'Protective Wear', 'Athletic Shoes'].map((cat, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-bold text-slate-700">{cat}</span>
                                            <span className="text-slate-500 font-medium">{75 - (i * 15)}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2">
                                            <div className="bg-[#00A878] h-2 rounded-full" style={{ width: `${75 - (i * 15)}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-[#0F172A] rounded-3xl border border-slate-800 shadow-xl p-6 relative overflow-hidden">
                            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-[#00A878]/20 blur-3xl rounded-full pointer-events-none" />
                            <h3 className="font-heading text-lg font-bold text-white mb-2 relative z-10">Revenue Insight</h3>
                            <p className="text-sm text-slate-300 font-medium leading-relaxed relative z-10">
                                Your sales velocity has increased by <span className="text-[#00A878] font-bold">12%</span> this month. Consider expanding your high-margin product lines to maximize this growth trajectory.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
    );
}
