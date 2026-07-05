"use client";

import React, { useState } from 'react';
import PublicLayout from '../../components/shared/PublicLayout';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Package, Banknote, Users, Download } from 'lucide-react';

const Analytics = () => {
    const [timeRange, setTimeRange] = useState('6months');

    const platformStats = [
        { label: 'Total Orders', value: '3,247', change: '+24%', trend: 'up', icon: Package },
        { label: 'Trade Volume', value: 'PKR 2.1B', change: '+32%', trend: 'up', icon: Banknote },
        { label: 'Active Suppliers', value: '856', change: '+18%', trend: 'up', icon: Users },
        { label: 'Growth Rate', value: '+28%', change: 'YoY', trend: 'up', icon: TrendingUp },
    ];

    const orderData = [
        { month: 'Jan', orders: 420, revenue: 280 },
        { month: 'Feb', orders: 480, revenue: 320 },
        { month: 'Mar', orders: 520, revenue: 350 },
        { month: 'Apr', orders: 580, revenue: 390 },
        { month: 'May', orders: 640, revenue: 430 },
        { month: 'Jun', orders: 720, revenue: 480 },
    ];

    const industryData = [
        { name: 'Cricket', value: 55, color: '#062B20' },
        { name: 'Football', value: 35, color: '#059669' },
        { name: 'Other', value: 10, color: '#64748b' },
    ];

    return (
        <PublicLayout>
            <div className="min-h-screen bg-neutral-50 pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-12 flex flex-col md:flex-row justify-between items-start gap-6">
                        <div>
                            <h1 className="font-heading text-5xl font-bold text-slate-900 mb-4 tracking-tight">Platform Analytics</h1>
                            <p className="font-body text-xl text-slate-600 max-w-3xl">
                                Real-time insights into trade volume, supplier performance, and market trends
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <select
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                                className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-transparent font-body outline-none transition-all bg-white"
                            >
                                <option value="3months">Last 3 Months</option>
                                <option value="6months">Last 6 Months</option>
                                <option value="1year">Last Year</option>
                            </select>
                            <button className="px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 font-body font-semibold bg-white shadow-sm">
                                <Download size={18} />
                                Export
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        {platformStats.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <div key={index} className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                                            <Icon className="text-emerald-600" size={24} />
                                        </div>
                                        <div className="flex items-center gap-1 text-emerald-600">
                                            <TrendingUp size={18} />
                                            <span className="font-body font-bold text-sm">{stat.change}</span>
                                        </div>
                                    </div>
                                    <div className="font-heading text-3xl font-bold text-slate-900 mb-1 tracking-tight">
                                        {stat.value}
                                    </div>
                                    <div className="font-body font-medium text-slate-600">
                                        {stat.label}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Charts Grid */}
                    <div className="grid lg:grid-cols-2 gap-8 mb-8">
                        {/* Order Trend */}
                        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                            <h3 className="font-heading text-2xl font-bold text-slate-900 mb-8">Order Volume Trend</h3>
                            <div className="h-[300px] min-h-[300px] min-w-0">
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={orderData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                        <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '12px', fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} />
                                        <YAxis stroke="#94a3b8" style={{ fontSize: '12px', fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Line type="monotone" dataKey="orders" stroke="#022c22" strokeWidth={3} dot={{ fill: '#022c22', r: 4, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Revenue Trend */}
                        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                            <h3 className="font-heading text-2xl font-bold text-slate-900 mb-8">Revenue Growth (PKR Millions)</h3>
                            <div className="h-[300px] min-h-[300px] min-w-0">
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={orderData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                        <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '12px', fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} />
                                        <YAxis stroke="#94a3b8" style={{ fontSize: '12px', fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Bar dataKey="revenue" fill="#059669" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Industry Distribution */}
                    <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                        <h3 className="font-heading text-2xl font-bold text-slate-900 mb-8">Trade Distribution by Industry</h3>
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <div className="h-[350px] min-h-[350px] min-w-0">
                                <ResponsiveContainer width="100%" height={350}>
                                    <PieChart>
                                        <Pie
                                            data={industryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={120}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {industryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-6">
                                {industryData.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl transition-all hover:bg-slate-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-5 h-5 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
                                            <span className="font-body font-bold text-slate-900 text-lg">{item.name}</span>
                                        </div>
                                        <span className="font-heading text-3xl font-bold text-slate-900">{item.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
};

export default Analytics;
