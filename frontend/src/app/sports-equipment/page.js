"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import PublicLayout from '../../components/shared/PublicLayout';
import { Search, Package, ArrowRight, Activity } from 'lucide-react';

const SportsEquipment = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const equipmentCategories = [
        { name: 'Training Equipment', products: '120+ products', description: 'Cones, agility ladders, training aids' },
        { name: 'Fitness Equipment', products: '80+ products', description: 'Weights, resistance bands, mats' },
        { name: 'Sports Accessories', products: '150+ products', description: 'Bags, water bottles, towels' },
        { name: 'Field Equipment', products: '60+ products', description: 'Nets, posts, markers' },
    ];

    return (
        <PublicLayout>
            <div className="min-h-screen bg-neutral-50 pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-16 max-w-4xl">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full mb-6">
                            <Activity className="text-emerald-600" size={20} />
                            <span className="font-body text-sm font-bold text-emerald-700 uppercase tracking-widest">
                                Bulk Sourcing Catalog
                            </span>
                        </div>
                        <h1 className="font-heading text-6xl md:text-7xl font-black text-slate-900 mb-6 tracking-tighter">Sports Equipment</h1>
                        <p className="font-body text-xl text-slate-600 max-w-3xl leading-relaxed font-medium">
                            Verified procurement for training equipment, fitness gear, and professional sports accessories from Pakistan’s leading manufacturers.
                        </p>
                    </div>

                    {/* Search & Intelligence */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 mb-16 shadow-2xl shadow-slate-200/50 flex flex-col lg:flex-row gap-8 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-slate-400" size={24} />
                            <input
                                type="text"
                                placeholder="Search bulk products, manufacturers, or categories..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-16 pr-6 py-6 border-2 border-slate-50 bg-slate-50 rounded-2xl focus:ring-4 focus:ring-emerald-50/50 focus:border-emerald-500 focus:bg-white outline-none transition-all font-body text-xl"
                            />
                        </div>
                        <div className="flex items-center gap-4 bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100">
                            <div className="flex -space-x-3">
                                {[1, 2, 3].map(i => <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200"></div>)}
                            </div>
                            <div className="font-body text-sm font-bold text-emerald-800">120+ Verified Suppliers</div>
                        </div>
                    </div>

                    {/* Categories Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
                        {equipmentCategories.map((category, index) => (
                            <Link
                                key={index}
                                href="/marketplace"
                                className="group bg-white border border-slate-100 rounded-[3rem] p-10 hover:border-emerald-500 hover:shadow-2xl transition-all duration-500 text-center shadow-lg"
                            >
                                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-600 transition-all duration-500 transform group-hover:scale-110 group-hover:rotate-6">
                                    <Package className="text-slate-400 group-hover:text-white transition-colors" size={36} />
                                </div>
                                <h3 className="font-heading text-2xl font-bold text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors">
                                    {category.name}
                                </h3>
                                <p className="font-body font-black text-emerald-600 mb-4 text-xs uppercase tracking-[0.2em]">{category.products}</p>
                                <p className="font-body text-slate-500 text-base leading-relaxed">{category.description}</p>
                            </Link>
                        ))}
                    </div>

                    {/* CTA & Partnership */}
                    <div className="bg-slate-900 rounded-[4rem] p-16 lg:p-24 text-white relative overflow-hidden flex flex-col lg:flex-row items-center gap-16 shadow-2xl">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -mr-64 -mt-64"></div>
                        <div className="flex-1 text-center lg:text-left relative z-10">
                            <h2 className="font-heading text-5xl lg:text-6xl font-black mb-6 tracking-tighter">Source in Bulk. <br /><span className="text-emerald-500">Scale Globally.</span></h2>
                            <p className="font-body text-xl text-slate-400 mb-10 max-w-2xl leading-relaxed">
                                Access private label manufacturing, tiered pricing, and unified order management for your sports equipment inventory.
                            </p>
                            <Link
                                href="/marketplace"
                                className="inline-flex items-center gap-3 px-12 py-5 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-500 transition-all font-body font-black text-lg shadow-xl shadow-emerald-600/30 group"
                            >
                                Browse Full Catalog
                                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={24} />
                            </Link>
                        </div>
                        <div className="flex-1 hidden lg:grid grid-cols-2 gap-6 relative z-10">
                            {[
                                { label: "Quality Checks", icon: Activity },
                                { label: "Bulk Pricing", icon: Package },
                                { label: "Global Logistics", icon: Activity },
                                { label: "Private Label", icon: Activity }
                            ].map((item, i) => (
                                <div key={i} className="p-8 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 hover:border-emerald-500/50 transition-colors">
                                    <item.icon className="text-emerald-500 mb-4" size={32} />
                                    <div className="font-heading text-xl font-bold">{item.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
};

export default SportsEquipment;
