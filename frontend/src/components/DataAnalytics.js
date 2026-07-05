"use client";

import React from 'react';
import { BarChart3, TrendingUp, Users, ArrowUpRight, Activity } from 'lucide-react';
import styles from './DataAnalytics.module.css';

const DataAnalytics = () => {
    return (
        <section className="py-24 bg-white overflow-hidden">
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left: Content */}
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-600 text-sm font-semibold mb-6">
                            <Activity size={16} />
                            <span>Real-Time Intelligence</span>
                        </div>
                        <h2 className="font-heading text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                            Make data-driven decisions at scale.
                        </h2>
                        <p className="font-body text-lg text-slate-600 mb-8 leading-relaxed">
                            Stop guessing. GearUp provides deep analytics on supplier capacity, market demand trends, and pricing fluctuations—giving you the edge in negotiations and planning.
                        </p>

                        <div className="space-y-6">
                            {[
                                { label: 'Market Demand Trends', desc: 'Predict upcoming spikes in cricket & football gear demand.' },
                                { label: 'Supplier Performance', desc: 'Track on-time delivery rates and quality scores.' },
                                { label: 'Price Benchmarking', desc: 'Compare quotes against historical market averages.' }
                            ].map((item, idx) => (
                                <div key={idx} className="flex gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                                        <BarChart3 className="text-blue-600" size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-heading font-bold text-slate-900 text-lg">{item.label}</h4>
                                        <p className="font-body text-slate-600">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Dashboard Mockup */}
                    <div className="relative">
                        {/* Main Card */}
                        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 relative z-10">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="font-heading font-bold text-slate-900 text-xl">Procurement Overview</h3>
                                    <p className="text-slate-500 text-sm">Last 30 Days</p>
                                </div>
                                <button className="text-sm font-medium text-blue-600 hover:text-blue-700">Export Report</button>
                            </div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-slate-500 text-sm mb-1">Active Orders</p>
                                    <p className="text-2xl font-bold text-slate-900">1,248</p>
                                    <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium mt-2">
                                        <TrendingUp size={14} /> +12.5%
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-slate-500 text-sm mb-1">Total Savings</p>
                                    <p className="text-2xl font-bold text-slate-900">Rs 4.2M</p>
                                    <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium mt-2">
                                        <TrendingUp size={14} /> +8.2%
                                    </div>
                                </div>
                            </div>

                            {/* Mock Chart Area */}
                            <div className="h-48 bg-slate-50 rounded-xl border border-slate-100 flex items-end justify-between p-4 gap-2">
                                {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                                    <div key={i} className="w-full bg-blue-500 rounded-t-sm opacity-80 hover:opacity-100 transition-opacity" style={{ height: `${h}%` }}></div>
                                ))}
                            </div>
                        </div>

                        {/* Floating Card */}
                        <div className={`absolute -bottom-4 left-0 sm:-left-4 md:-bottom-8 md:-left-8 bg-white p-5 rounded-xl shadow-xl border border-slate-200 z-20 w-64 ${styles.animateBounceSlow}`}>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                    <Users className="text-emerald-600" size={20} />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">New Supplier Match</p>
                                    <p className="font-bold text-slate-900 text-sm">Apex Sports Ltd.</p>
                                    <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
                                        98% Match Score <ArrowUpRight size={12} />
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default DataAnalytics;
