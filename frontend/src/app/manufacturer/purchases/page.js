"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getApiBaseUrl } from '@/lib/api';
import Skeleton from '@/components/common/Skeleton';
import { isOrderInTimeRange } from '@/lib/dashboardUtils';
import { useAuth } from '@/context/AuthContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { formatPKR, formatPKRShort, sumBuyerRefundDeductions } from '@/lib/financeUtils';
import { isBuyerOnOrder, resolveUserId } from '@/lib/dashboardAnalytics';
import { useRefundRecords } from '@/hooks/useRefundRecords';
import { subscribeFinancialSync } from '@/lib/financialSync';
import { Download, ShoppingCart, ShoppingBag, Clock, ShieldCheck } from 'lucide-react';

export default function PurchasesPage() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState('6months');
    const { refundRecords } = useRefundRecords();
    const userId = resolveUserId(user);

    const fetchPurchasesData = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${getApiBaseUrl()}/api/orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                const purchases = data.data.filter((o) => isBuyerOnOrder(o, userId));
                setOrders(purchases);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (user) {
            fetchPurchasesData();
        }
    }, [fetchPurchasesData, user]);

    useEffect(() => {
        return subscribeFinancialSync(() => {
            if (user) fetchPurchasesData();
        });
    }, [fetchPurchasesData, user]);

    const filteredOrders = useMemo(() => {
        return orders.filter(o => isOrderInTimeRange(o.createdAt, timeFilter));
    }, [orders, timeFilter]);

    const stats = useMemo(() => {
        const grossSpent = filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const buyerRefundDeductions = sumBuyerRefundDeductions(refundRecords, userId, timeFilter);
        const totalSpent = Math.max(0, grossSpent - buyerRefundDeductions);
        const totalPurchases = filteredOrders.length;
        const pendingPurchases = filteredOrders.filter(o => o.status === 'pending' || o.status === 'processing').length;
        const uniqueSuppliers = new Set(filteredOrders.map(o => o.seller?._id || o.seller)).size;

        return { totalSpent, totalPurchases, pendingPurchases, uniqueSuppliers };
    }, [filteredOrders, refundRecords, userId, timeFilter]);

    const chartData = useMemo(() => [], []);

    if (loading) {
        return (
                <div className="flex flex-col gap-6 w-full p-6 animate-in fade-in duration-300">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-2">
                        <div>
                            <Skeleton variant="text" className="w-64 h-10 mb-2" />
                            <Skeleton variant="text" className="w-96 h-5" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} variant="stat" />
                        ))}
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start w-full">
                        <div className="xl:col-span-3 space-y-6 w-full">
                            <Skeleton variant="card" className="h-[400px]" />
                            <Skeleton variant="table" rows={5} />
                        </div>
                        <div className="space-y-6 w-full">
                            <Skeleton variant="card" className="h-[200px]" />
                        </div>
                    </div>
                </div>
        );
    }

    return (
            <div className="flex flex-col gap-6 w-full p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-slate-200 pb-6 mb-2 text-center sm:text-left">
                    <div>
                        <h1 className="font-sans text-3xl font-semibold text-slate-900 tracking-tight">Purchases & Procurement</h1>
                        <p className="font-sans text-[14px] font-medium text-slate-500 mt-1.5">Manage purchase orders and track supplier spending.</p>
                    </div>
                    <div className="flex justify-center sm:justify-end">
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-sans font-semibold text-[13px] transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer hover:-translate-y-0.5">
                            <Download size={16} /> Export Data
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-2">
                    {[
                        { label: 'Total Spent', value: formatPKR(stats.totalSpent), icon: ShoppingCart, color: 'text-blue-700', bg: 'bg-blue-100' },
                        { label: 'Total Purchases', value: stats.totalPurchases, icon: ShoppingBag, color: 'text-indigo-700', bg: 'bg-indigo-100' },
                        { label: 'Pending Orders', value: stats.pendingPurchases, icon: Clock, color: 'text-amber-700', bg: 'bg-amber-100' },
                        { label: 'Active Suppliers', value: stats.uniqueSuppliers, icon: ShieldCheck, color: 'text-emerald-700', bg: 'bg-emerald-100' }
                    ].map((stat, idx) => (
                        <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-md transition-all duration-300 group hover:-translate-y-1">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} transition-transform duration-300 group-hover:scale-110`}>
                                    <stat.icon size={18} className="stroke-[2.5]" />
                                </div>
                            </div>
                            <div>
                                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{stat.label}</div>
                                <div className="font-sans text-2xl font-bold text-slate-900">{loading ? '-' : stat.value}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Layout Grid */}
                <div className="w-full">
                    {/* Purchases History Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_2px_10px_rgb(0,0,0,0.02)] overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
                            <h4 className="font-sans text-[13px] font-bold text-slate-900 uppercase tracking-wider">Recent Purchase Orders</h4>
                        </div>
                        <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                            <table className="w-full min-w-[800px] text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/80">
                                        <th className="px-6 py-4 font-sans text-[11px] font-bold text-slate-500 uppercase tracking-widest">PO Number</th>
                                        <th className="px-6 py-4 font-sans text-[11px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
                                        <th className="px-6 py-4 font-sans text-[11px] font-bold text-slate-500 uppercase tracking-widest">Supplier</th>
                                        <th className="px-6 py-4 font-sans text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-4 font-sans text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Cost</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredOrders.slice(0, 10).map((order) => (
                                        <tr key={order._id} className="hover:bg-slate-50/60 transition-all duration-200 group">
                                            <td className="px-6 py-5 whitespace-nowrap align-top">
                                                <div className="font-sans font-bold text-[14px] text-slate-900 group-hover:text-emerald-600 transition-colors">
                                                    #{order._id.slice(-8).toUpperCase()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 align-top">
                                                <div className="font-mono text-[11px] text-slate-500 font-medium mt-1.5">
                                                    {new Date(order.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 align-top">
                                                <div className="font-sans text-[14px] font-semibold text-slate-900 line-clamp-1 max-w-[150px]" title={order.seller?.businessName || order.seller?.name}>
                                                    {order.seller?.businessName || order.seller?.name || 'Unknown Supplier'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 align-top whitespace-nowrap">
                                                <div className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-widest border inline-block ${
                                                    order.status === 'delivered' || order.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                    order.status === 'processing' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                    order.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                    'bg-blue-50 text-blue-700 border-blue-100'
                                                }`}>
                                                    {order.status === 'completed' ? 'Received' : order.status === 'delivered' ? 'Received' : order.status === 'processing' ? 'Pending Approval' : order.status === 'cancelled' ? 'Cancelled' : 'Pending'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 align-top font-sans text-[14px] font-bold text-slate-900 whitespace-nowrap text-right">
                                                {formatPKR(order.totalAmount)}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredOrders.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium font-sans text-[13px]">No purchases found for this period.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
    );
}
