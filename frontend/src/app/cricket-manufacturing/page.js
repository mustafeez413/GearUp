"use client";

import React from 'react';
import Link from 'next/link';
import PublicLayout from '../../components/shared/PublicLayout';
import { CheckCircle, MapPin, Package, ArrowRight, Trophy } from 'lucide-react';

const CricketManufacturing = () => {
    const stats = {
        suppliers: '450+',
        avgMOQ: '100 units',
        exportReadiness: '95%',
        totalCapacity: '2.5M+ units/month',
        topLocations: ['Sialkot', 'Lahore', 'Karachi']
    };

    const categories = [
        { name: 'Cricket Bats', count: '180+ suppliers', description: 'English willow and Kashmir willow bats' },
        { name: 'Cricket Balls', count: '120+ suppliers', description: 'Leather and synthetic cricket balls' },
        { name: 'Protective Gear', count: '150+ suppliers', description: 'Helmets, pads, gloves, and guards' },
        { name: 'Cricket Kits', count: '80+ suppliers', description: 'Complete cricket sets and accessories' },
    ];

    const topManufacturers = [
        { name: 'ProCricket Manufacturing Co.', location: 'Sialkot', capacity: '50K+ units/month', verified: true },
        { name: 'MasterCraft Sports Equipment', location: 'Sialkot', capacity: '75K+ units/month', verified: true },
        { name: 'Champion Sports Gear', location: 'Sialkot', capacity: '90K+ units/month', verified: true },
    ];

    return (
        <PublicLayout>
            <div className="min-h-screen bg-neutral-50 pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="text-center mb-16 max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full mb-6">
                            <Trophy className="text-emerald-600" size={20} />
                            <span className="font-body text-sm font-bold text-emerald-700 uppercase tracking-[0.2em]">
                                World Class Excellence
                            </span>
                        </div>
                        <h1 className="font-heading text-5xl md:text-7xl font-black text-slate-900 mb-8 tracking-tighter">
                            Cricket Manufacturing
                        </h1>
                        <p className="font-body text-xl text-slate-600 leading-relaxed font-medium">
                            Sialkot's world-renowned cricket equipment manufacturing ecosystem. From professional-grade bats to protective gear, connect directly with established manufacturers serving global markets.
                        </p>

                        {/* Key Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
                            {[
                                { label: "Verified Suppliers", value: stats.suppliers },
                                { label: "Average MOQ", value: stats.avgMOQ },
                                { label: "Export Ready", value: stats.exportReadiness },
                                { label: "Monthly Capacity", value: stats.totalCapacity }
                            ].map((stat, i) => (
                                <div key={i} className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="font-heading text-4xl font-black text-slate-900 mb-1">{stat.value}</div>
                                    <div className="font-body text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Product Categories */}
                    <div className="mb-24">
                        <h2 className="font-heading text-3xl font-bold text-slate-900 mb-10 tracking-tight">Product Categories</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {categories.map((category, index) => (
                                <Link
                                    key={index}
                                    href="/marketplace"
                                    className="group bg-white border border-slate-100 rounded-[2rem] p-8 hover:border-emerald-500 hover:shadow-2xl transition-all duration-500 shadow-lg flex flex-col"
                                >
                                    <h3 className="font-heading text-2xl font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors">
                                        {category.name}
                                    </h3>
                                    <p className="font-body font-bold text-emerald-600 mb-4 text-xs uppercase tracking-widest">{category.count}</p>
                                    <p className="font-body text-slate-500 text-sm leading-relaxed mb-6">{category.description}</p>
                                    <div className="mt-auto flex items-center gap-2 text-slate-900 font-body font-bold text-xs uppercase tracking-[0.2em] group-hover:text-emerald-600 group-hover:gap-3 transition-all">
                                        Explore Marketplace <ArrowRight size={16} />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Top Manufacturing Hubs */}
                    <div className="mb-24">
                        <h2 className="font-heading text-3xl font-bold text-slate-900 mb-10 tracking-tight">Primary Manufacturing Hubs</h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            {stats.topLocations.map((location, index) => (
                                <div key={index} className="bg-slate-900 text-white rounded-[2rem] p-10 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[60px] -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-colors"></div>
                                    <div className="flex items-center gap-4 mb-6 relative z-10">
                                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                                            <MapPin className="text-emerald-400" size={24} />
                                        </div>
                                        <h3 className="font-heading text-3xl font-bold">{location}</h3>
                                    </div>
                                    <p className="font-body text-slate-400 text-lg leading-relaxed relative z-10">Leading cricket equipment manufacturing center with proprietary facilities and export-ready logistics.</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Manufacturers */}
                    <div className="mb-24">
                        <div className="flex justify-between items-end mb-10">
                            <div>
                                <h2 className="font-heading text-3xl font-bold text-slate-900 tracking-tight">Top Verified Manufacturers</h2>
                                <p className="font-body text-slate-500 mt-2">Elite producers vetted for capacity and compliance</p>
                            </div>
                            <Link href="/suppliers" className="hidden sm:flex font-body font-bold text-xs text-slate-900 uppercase tracking-[0.2em] hover:text-emerald-600 transition-colors items-center gap-3">
                                View All Directory <ArrowRight size={18} />
                            </Link>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            {topManufacturers.map((manufacturer, index) => (
                                <div key={index} className="bg-white border border-slate-100 rounded-[2.5rem] p-10 hover:shadow-2xl transition-all duration-500 group shadow-lg">
                                    <div className="flex items-center gap-2 mb-6">
                                        {manufacturer.verified && (
                                            <CheckCircle className="text-emerald-500" size={24} />
                                        )}
                                        <h3 className="font-heading text-2xl font-bold text-slate-900">{manufacturer.name}</h3>
                                    </div>
                                    <div className="space-y-4 mb-10">
                                        <div className="flex items-center gap-3 text-slate-500">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center"><MapPin size={16} /></div>
                                            <span className="font-body font-medium">{manufacturer.location}, Pakistan</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-900">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center"><Package size={16} className="text-emerald-600" /></div>
                                            <span className="font-body font-bold uppercase text-xs tracking-widest">{manufacturer.capacity}</span>
                                        </div>
                                    </div>
                                    <Link
                                        href="/marketplace"
                                        className="block text-center px-8 py-4 bg-slate-900 text-white rounded-2xl hover:bg-emerald-600 transition-all font-body font-bold shadow-xl"
                                    >
                                        View Products
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="bg-slate-900 rounded-[3rem] p-16 text-white text-center relative overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-transparent"></div>
                        <div className="relative z-10">
                            <h2 className="font-heading text-5xl font-black mb-6 tracking-tighter italic">Ready to Source Cricket Equipment?</h2>
                            <p className="font-body text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                                Connect with verified manufacturers and access premium cricket equipment at competitive bulk pricing. Scale your procurement with certainty.
                            </p>
                            <Link
                                href="/marketplace"
                                className="inline-flex items-center gap-3 px-12 py-5 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-500 transition-all font-body font-bold text-lg shadow-xl shadow-emerald-600/20 active:scale-[0.98]"
                            >
                                Explore Marketplace
                                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={24} />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
};

export default CricketManufacturing;
