"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getApiBaseUrl } from '@/lib/api';
import Skeleton from '@/components/common/Skeleton';
import { isOrderInTimeRange } from '@/lib/dashboardUtils';
import { useAuth } from '@/context/AuthContext';
import {
    ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Download, Activity, TrendingUp, TrendingDown, Percent } from 'lucide-react';
import { formatPKR, formatPKRShort } from '@/lib/financeUtils';

export default function ProfitAnalyticsPage() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState('6months');

    const fetchAllOrders = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${getApiBaseUrl()}/api/orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setOrders(data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchAllOrders();
        }
    }, [fetchAllOrders, user]);

    const filteredOrders = useMemo(() => {
        return orders.filter(o => isOrderInTimeRange(o.createdAt, timeFilter));
    }, [orders, timeFilter]);

    const stats = useMemo(() => {
        let revenue = 0;
        let expenses = 0;

        filteredOrders.forEach(o => {
            const isPurchase = o.buyer?._id === user?.id || o.buyer === user?.id;
            if (isPurchase) {
                expenses += (o.totalAmount || 0);
            } else {
                revenue += (o.totalAmount || 0);
            }
        });

        const grossProfit = revenue - expenses;
        const profitMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

        return { revenue, expenses, grossProfit, profitMargin };
    }, [filteredOrders, user]);

    const chartData = useMemo(() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const dataMap = {};
        
        filteredOrders.forEach(o => {
            const date = new Date(o.createdAt);
            const key = `${months[date.getMonth()]} ${date.getFullYear()}`;
            if (!dataMap[key]) dataMap[key] = { name: key, Revenue: 0, Expenses: 0, Profit: 0 };
            
            const isPurchase = o.buyer?._id === user?.id || o.buyer === user?.id;
            if (isPurchase) {
                dataMap[key].Expenses += (o.totalAmount || 0);
            } else {
                dataMap[key].Revenue += (o.totalAmount || 0);
            }
            dataMap[key].Profit = dataMap[key].Revenue - dataMap[key].Expenses;
        });

        return Object.values(dataMap);
    }, [filteredOrders, user]);

    if (loading) {
        return (
                <div className="p-6"><Skeleton variant="chart" /></div>
        );
    }

    return (
            <div className="p-6 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="font-heading text-2xl font-bold text-[#0F172A]">Profit Analytics</h1>
                        <p className="text-slate-500 font-medium text-sm mt-1">Analyze gross profit margins, revenue, and expenses.</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <select 
                            value={timeFilter} 
                            onChange={(e) => setTimeFilter(e.target.value)}
                            className="bg-white border border-slate-200 text-sm font-semibold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer shadow-sm"
                        >
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="6months">Last 6 Months</option>
                            <option value="year">This Year</option>
                            <option value="all">All Time</option>
                        </select>
                        <button className="flex items-center gap-2 bg-[#0F172A] hover:bg-[#1E293B] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm">
                            <Download size={16} /> Export Financials
                        </button>
                    </div>
                </div>

                {/* KPI Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[
                        { label: 'Gross Profit', value: formatPKR(stats.grossProfit), icon: Activity, color: 'text-teal-600', bg: 'bg-teal-50' },
                        { label: 'Total Revenue', value: formatPKR(stats.revenue), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Total Expenses', value: formatPKR(stats.expenses), icon: TrendingDown, color: 'text-rose-600', bg: 'bg-rose-50' },
                        { label: 'Profit Margin', value: `${stats.profitMargin.toFixed(1)}%`, icon: Percent, color: 'text-indigo-600', bg: 'bg-indigo-50' }
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
                    <h3 className="font-heading text-lg font-bold text-slate-800 mb-6">Revenue vs Expenses (Gross Profit)</h3>
                    <div className="w-full h-[400px]">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} width={100} tick={{fill: '#64748B', fontSize: 12}} tickFormatter={(val) => formatPKRShort(val)} />
                                    <RechartsTooltip 
                                        cursor={{fill: '#F1F5F9'}}
                                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                        formatter={(value) => [formatPKR(value)]}
                                    />
                                    <Legend wrapperStyle={{paddingTop: '20px'}} />
                                    <Bar dataKey="Revenue" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    <Bar dataKey="Expenses" fill="#F43F5E" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    <Line type="monotone" dataKey="Profit" stroke="#0EA5E9" strokeWidth={3} dot={{r: 4}} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400 font-medium">No financial data for this period</div>
                        )}
                    </div>
                </div>

                {/* Operational Tables & Advanced Summaries */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Revenue vs Expenses Table */}
                    <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-heading text-lg font-bold text-slate-800">Monthly Profitability Breakdown</h3>
                        </div>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                                        <th className="px-6 py-4">Month</th>
                                        <th className="px-6 py-4 text-right">Revenue</th>
                                        <th className="px-6 py-4 text-right">Expenses</th>
                                        <th className="px-6 py-4 text-right">Net Profit</th>
                                        <th className="px-6 py-4 text-center">Margin</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {chartData.slice(-6).reverse().map((month, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors text-sm font-medium text-slate-700">
                                            <td className="px-6 py-4 font-bold text-slate-900">{month.name}</td>
                                            <td className="px-6 py-4 text-right text-emerald-600">{formatPKR(month.Revenue)}</td>
                                            <td className="px-6 py-4 text-right text-rose-600">{formatPKR(month.Expenses)}</td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-900">{formatPKR(month.Profit)}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                                                    (month.Revenue > 0 && (month.Profit / month.Revenue) > 0.15) ? 'bg-emerald-100 text-emerald-700' :
                                                    (month.Revenue > 0 && (month.Profit / month.Revenue) > 0) ? 'bg-amber-100 text-amber-700' :
                                                    'bg-rose-100 text-rose-700'
                                                }`}>
                                                    {month.Revenue > 0 ? ((month.Profit / month.Revenue) * 100).toFixed(1) : 0}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {chartData.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium">No monthly data available.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Operational Cost Insights */}
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                            <h3 className="font-heading text-lg font-bold text-slate-800 mb-5">Financial Performance</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-3">
                                    <span className="font-bold text-slate-700">Best Category</span>
                                    <span className="bg-slate-100 text-slate-700 font-bold px-2.5 py-0.5 rounded-md">Protective Gear</span>
                                </div>
                                <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-3">
                                    <span className="font-bold text-slate-700">Avg Cost Per Item</span>
                                    <span className="text-rose-600 font-bold">{formatPKR(4200)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-bold text-slate-700">Avg Sale Value</span>
                                    <span className="text-emerald-600 font-bold">{formatPKR(8500)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Smart AI Summaries */}
                        <div className="bg-[#0F172A] p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-center">
                            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-teal-500/20 blur-3xl rounded-full pointer-events-none" />
                            <h4 className="font-heading text-lg font-bold text-white mb-2 z-10">Operational Cost Insight</h4>
                            <p className="text-slate-300 text-sm z-10 mb-4 leading-relaxed">
                                Based on recent trends, your operational margins are currently stable at <span className="text-teal-400 font-bold">{stats.profitMargin.toFixed(1)}%</span>. Renegotiating raw material bulk purchases could push this above 20%.
                            </p>
                            <button className="bg-white text-slate-900 font-bold text-[11px] uppercase tracking-wider px-4 py-2.5 rounded-xl w-max z-10 hover:bg-slate-100 transition-colors shadow-sm">
                                View Full Analysis
                            </button>
                        </div>
                    </div>
                </div>
            </div>
    );
}
