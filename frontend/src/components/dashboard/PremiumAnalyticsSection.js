"use client";

import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { isOrderInTimeRange } from '@/lib/dashboardUtils';
import { formatPKR, formatPKRShort } from '@/lib/financeUtils';
import {
    getSellerSubtotal,
    isChartEligiblePurchaseOrder,
    isChartEligibleSellerOrder,
    isSellerOnOrder,
} from '@/lib/dashboardAnalytics';

const PremiumAnalyticsSection = ({ orders = [], products = [], user, loading = false, timeRange, onTimeRangeChange }) => {
    const [activeTab, setActiveTab] = useState('Overview');

    const chartData = useMemo(() => {
        const filtered = orders.filter(o => isOrderInTimeRange(o.createdAt, timeRange));
        
        const processOrder = (o) => {
            const currentUserId = (user?._id || user?.id)?.toString();
            const buyerId = (o.buyer?._id || o.buyer?.id || o.buyer)?.toString();
            const isPurchase = buyerId === currentUserId;

            let totalSales = 0;
            let totalPurchases = 0;

            if (isPurchase) {
                if (isChartEligiblePurchaseOrder(o, currentUserId)) {
                    totalPurchases = o.totalAmount || 0;
                }
            } else if (isChartEligibleSellerOrder(o, currentUserId)) {
                totalSales = getSellerSubtotal(o, currentUserId);
            }

            return { totalSales, totalPurchases };
        };

        let periods = [];
        let data = [];
        
        switch (timeRange) {
            case 'today':
                periods = ['09:00', '12:00', '15:00', '18:00', '21:00'];
                data = periods.map(p => ({ period: p, totalSales: 0, totalPurchases: 0 }));
                filtered.forEach(o => {
                    if (!o.createdAt) return;
                    const hour = new Date(o.createdAt).getHours();
                    let idx = 4;
                    if (hour < 11) idx = 0;
                    else if (hour < 14) idx = 1;
                    else if (hour < 17) idx = 2;
                    else if (hour < 20) idx = 3;
                    const val = processOrder(o);
                    data[idx].totalSales += val.totalSales;
                    data[idx].totalPurchases += val.totalPurchases;
                });
                break;
            case 'week':
                periods = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                data = periods.map(p => ({ period: p, totalSales: 0, totalPurchases: 0 }));
                filtered.forEach(o => {
                    if (!o.createdAt) return;
                    let dayIdx = new Date(o.createdAt).getDay() - 1;
                    if (dayIdx < 0) dayIdx = 6;
                    const val = processOrder(o);
                    data[dayIdx].totalSales += val.totalSales;
                    data[dayIdx].totalPurchases += val.totalPurchases;
                });
                break;
            case 'month':
                periods = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
                data = periods.map(p => ({ period: p, totalSales: 0, totalPurchases: 0 }));
                filtered.forEach(o => {
                    if (!o.createdAt) return;
                    const date = new Date(o.createdAt).getDate();
                    let idx = 3;
                    if (date <= 7) idx = 0;
                    else if (date <= 14) idx = 1;
                    else if (date <= 21) idx = 2;
                    const val = processOrder(o);
                    data[idx].totalSales += val.totalSales;
                    data[idx].totalPurchases += val.totalPurchases;
                });
                break;
            case 'year':
                periods = ['Q1', 'Q2', 'Q3', 'Q4'];
                data = periods.map(p => ({ period: p, totalSales: 0, totalPurchases: 0 }));
                filtered.forEach(o => {
                    if (!o.createdAt) return;
                    const m = new Date(o.createdAt).getMonth();
                    let idx = 3;
                    if (m < 3) idx = 0;
                    else if (m < 6) idx = 1;
                    else if (m < 9) idx = 2;
                    const val = processOrder(o);
                    data[idx].totalSales += val.totalSales;
                    data[idx].totalPurchases += val.totalPurchases;
                });
                break;
            case '6months':
            default:
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const currentMonth = new Date().getMonth();
                data = [];
                for (let i = 5; i >= 0; i--) {
                    const m = (currentMonth - i + 12) % 12;
                    data.push({ period: months[m], totalSales: 0, totalPurchases: 0 });
                }
                filtered.forEach(o => {
                    if (!o.createdAt) return;
                    const mName = months[new Date(o.createdAt).getMonth()];
                    const entry = data.find(m => m.period === mName);
                    if (entry) {
                        const val = processOrder(o);
                        entry.totalSales += val.totalSales;
                        entry.totalPurchases += val.totalPurchases;
                    }
                });
                break;
        }

        const totalSum = data.reduce((sum, d) => sum + d.totalSales + d.totalPurchases, 0);
        return data;
    }, [orders, timeRange, user]);

    const totals = useMemo(() => {
        let sales = 0;
        let purchases = 0;
        chartData.forEach(d => {
            sales += d.totalSales;
            purchases += d.totalPurchases;
        });
        return { sales, purchases, growth: null };
    }, [chartData]);

    return (
        <div className="w-full flex flex-col h-full gap-6">
            <div 
                className="w-full flex flex-col h-full transition-all duration-300 hover:shadow-[0_14px_32px_rgba(15,23,42,0.08)]"
                style={{
                    background: '#FFFFFF',
                    borderRadius: '20px',
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 10px 30px rgba(15,23,42,0.06)',
                }}
            >
                {/* Premium Header: Tabs & Filters */}
                <div className="px-6 py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-[#E5E7EB]">
                    {/* Tabs Enhancement */}
                    <div className="flex gap-2 p-1">
                        {['Overview', 'Sales', 'Purchases'].map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 py-2 rounded-xl text-[13px] font-bold transition-all duration-200 ${
                                    activeTab === tab
                                        ? 'bg-[#00A878] text-white shadow-[0_8px_20px_rgba(0,168,120,0.25)]'
                                        : 'bg-transparent text-[#64748B] hover:bg-[#F8FFFC] hover:text-[#00A878]'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Time Filter Buttons */}
                    <div className="flex gap-2">
                        {[
                            { id: 'today', label: 'Day' },
                            { id: 'week', label: 'Week' },
                            { id: 'month', label: 'Month' },
                            { id: 'year', label: 'Year' }
                        ].map((range) => (
                            <button
                                key={range.id}
                                type="button"
                                onClick={() => onTimeRangeChange(range.id)}
                                className={`h-[40px] px-4 rounded-xl text-[13px] font-bold transition-all duration-200 border ${
                                    timeRange === range.id
                                        ? 'bg-[#E8FFF5] text-[#00A878] border-[#00A878]'
                                        : 'bg-transparent text-[#64748B] border-transparent hover:bg-[#F8FFFC] hover:text-[#0F172A]'
                                }`}
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>
                </div>
                

                
                {/* Chart Area */}
                <div className={`p-6 w-full h-[320px] sm:h-[360px] transition-opacity duration-500 ${loading ? 'opacity-50' : 'opacity-100'}`}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }} barGap={8}>
                            <CartesianGrid strokeDasharray="4 4" stroke="#F1F5F9" vertical={false} />
                            <XAxis 
                                dataKey="period" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }} 
                                dy={15} 
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                width={85}
                                tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }} 
                                tickFormatter={(val) => formatPKRShort(val)}
                                dx={-10} 
                            />
                            <Tooltip 
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-[#031A1F] border border-[#062B20] rounded-xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.15)] select-none text-left min-w-[220px] text-white transform -translate-y-2 transition-transform">
                                                <p className="font-heading text-[12px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-3 pb-2 border-b border-slate-700">
                                                    {label}
                                                </p>
                                                <div className="flex flex-col gap-3">
                                                    {payload.map((entry, index) => (
                                                        <div key={index} className="flex items-center justify-between gap-6">
                                                            <span className="text-[13px] font-semibold flex items-center gap-2 text-white">
                                                                <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color || entry.fill }}></span> 
                                                                {entry.name}
                                                            </span>
                                                            <span className="font-heading text-[14px] font-bold text-white">
                                                                {formatPKR(entry.value)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                                cursor={{ fill: '#F8FAFC', opacity: 0.5 }}
                            />
                            
                            {(activeTab === 'Overview' || activeTab === 'Sales') && (
                                <Bar 
                                    dataKey="totalSales" 
                                    name="Total Sales" 
                                    fill="#00A878" 
                                    barSize={24}
                                    radius={[6, 6, 6, 6]}
                                    shape={(props) => {
                                        const { fill, x, y, width, height } = props;
                                        if (!height || height <= 0) return null;
                                        const minHeight = 12;
                                        const h = Math.max(height, minHeight);
                                        const yPos = height < minHeight ? y - (minHeight - height) : y;
                                        return <rect x={x} y={yPos} width={width} height={h} fill={fill} rx={6} ry={6} className="hover:brightness-110 transition-all cursor-pointer" />;
                                    }}
                                />
                            )}
                            {(activeTab === 'Overview' || activeTab === 'Purchases') && (
                                <Bar 
                                    dataKey="totalPurchases" 
                                    name="Total Purchases" 
                                    fill="#0EA5E9" 
                                    barSize={24}
                                    radius={[6, 6, 6, 6]}
                                    shape={(props) => {
                                        const { fill, x, y, width, height } = props;
                                        if (!height || height <= 0) return null;
                                        const minHeight = 12;
                                        const h = Math.max(height, minHeight);
                                        const yPos = height < minHeight ? y - (minHeight - height) : y;
                                        return <rect x={x} y={yPos} width={width} height={h} fill={fill} rx={6} ry={6} className="hover:brightness-110 transition-all cursor-pointer" />;
                                    }}
                                />
                            )}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
};

export default React.memo(PremiumAnalyticsSection);
