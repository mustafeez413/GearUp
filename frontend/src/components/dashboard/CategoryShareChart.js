"use client";

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import Skeleton from '@/components/common/Skeleton';
import { Layers } from 'lucide-react';

const COLORS = ['#0EA5E9', '#00A878', '#8B5CF6', '#F59E0B', '#EC4899'];

const CategoryShareChart = ({ products = [], loading = false }) => {

    const chartData = useMemo(() => {
        const categoryTotals = {};
        let totalCount = 0;

        products.forEach(p => {
            const cat = p.category || 'Other';
            if (!categoryTotals[cat]) categoryTotals[cat] = 0;
            categoryTotals[cat] += 1;
            totalCount += 1;
        });

        let data = Object.entries(categoryTotals).map(([name, count]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            count,
            value: totalCount > 0 ? (count / totalCount) * 100 : 0
        })).sort((a, b) => b.count - a.count);

        if (data.length > 6) {
            const top5 = data.slice(0, 5);
            const othersCount = data.slice(5).reduce((sum, item) => sum + item.count, 0);
            const othersValue = totalCount > 0 ? (othersCount / totalCount) * 100 : 0;
            top5.push({ name: 'Other', count: othersCount, value: othersValue });
            data = top5;
        }

        data = data.map((item, idx) => {
            let color = COLORS[idx % COLORS.length];
            const lowerName = item.name.toLowerCase();
            if (lowerName.includes('cricket')) color = '#0EA5E9';
            else if (lowerName.includes('protective')) color = '#00A878';
            else if (lowerName.includes('football')) color = '#8B5CF6';
            return { ...item, color };
        });

        return data;
    }, [products]);

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center min-h-[400px]"
                 style={{
                    background: '#FFFFFF',
                    borderRadius: '20px',
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 10px 30px rgba(15,23,42,0.06)',
                 }}
            >
                <Skeleton variant="chart" />
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col min-h-[320px] sm:min-h-[400px] min-w-0 transition-all duration-300 hover:shadow-[0_14px_32px_rgba(15,23,42,0.08)]"
             style={{
                background: '#FFFFFF',
                borderRadius: '20px',
                border: '1px solid #E5E7EB',
                boxShadow: '0 10px 30px rgba(15,23,42,0.06)',
             }}
        >
            <div className="px-6 py-5 border-b border-[#E5E7EB]">
                <h3 className="font-heading text-[18px] font-bold text-[#0F172A] tracking-tight">Market Category Share</h3>
                <p className="font-body text-[13px] font-medium text-[#64748B] mt-1">Top wholesale vertical shares</p>
            </div>
            
            <div className="flex-1 flex flex-col p-6 items-center justify-center relative">
                {chartData.length > 0 ? (
                    <>
                        <div className="w-full h-[220px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={95}
                                        paddingAngle={4}
                                        cornerRadius={6}
                                        dataKey="value"
                                        stroke="none"
                                        animationDuration={1200}
                                        animationEasing="ease-in-out"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} className="hover:opacity-90 transition-opacity outline-none cursor-pointer" />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        cursor={{fill: 'transparent'}}
                                        wrapperStyle={{ zIndex: 50 }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div className="bg-[#031A1F] border border-[#062B20] rounded-xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.15)] select-none min-w-[160px] transform -translate-y-2">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: data.color }} />
                                                            <span className="font-heading text-[12px] font-extrabold text-white uppercase tracking-wider">{data.name}</span>
                                                        </div>
                                                        <div className="flex flex-col gap-1 mt-2 border-t border-slate-700 pt-2">
                                                            <span className="font-heading text-[11px] font-semibold text-[#94A3B8] uppercase tracking-widest">{data.count} Products</span>
                                                            <span className="font-heading text-[22px] font-bold text-white leading-none">{data.value.toFixed(1)}<span className="text-[14px] text-[#94A3B8]">%</span></span>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            
                            {/* Center Content inside Donut */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col mt-1">
                                <span className="font-heading text-[11px] font-bold text-[#64748B] tracking-[0.1em] uppercase mb-1">Cataloged</span>
                                <span className="font-heading text-[32px] font-bold text-[#0F172A] leading-none">100%</span>
                            </div>
                        </div>

                        {/* Legends */}
                        <div className="w-full mt-8 flex flex-col gap-3">
                            {chartData.map((entry, index) => {
                                return (
                                    <div key={index} className="flex items-center justify-between py-2 px-2 hover:bg-[#F8FFFC] transition-all duration-200 rounded-xl group cursor-default">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: entry.color }} />
                                            <span className="font-heading text-[14px] font-semibold text-[#0F172A] transition-colors">{entry.name}</span>
                                        </div>
                                        <div>
                                            <span className="font-heading text-[13px] font-bold text-[#0F172A] bg-[#F8FAFC] px-3 py-1 rounded-[10px] border border-[#E5E7EB] transition-all group-hover:border-[#00A878] group-hover:text-[#00A878]">
                                                {entry.value.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center h-full opacity-60">
                        <Layers size={48} className="text-[#94A3B8] mb-4" />
                        <span className="font-heading text-[14px] font-bold text-[#0F172A]">No products found</span>
                        <span className="text-[13px] text-[#64748B] mt-1 max-w-[200px]">Add products to your catalog to see category distribution.</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(CategoryShareChart);
