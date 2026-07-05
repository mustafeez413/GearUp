"use client";

import React from 'react';
import Link from 'next/link';
import PublicLayout from '../../components/shared/PublicLayout';
import { CheckCircle, MapPin, Package, ArrowRight, Star } from 'lucide-react';

const FootballManufacturing = () => {
    const stats = {
        suppliers: '380+',
        avgMOQ: '500 units',
        exportReadiness: '88%',
        totalCapacity: '1.8M+ units/month',
        topLocations: ['Lahore', 'Karachi', 'Faisalabad']
    };

    const categories = [
        { name: 'Football Jerseys', count: '150+ suppliers', description: 'Custom and standard football jerseys' },
        { name: 'Football Balls', count: '100+ suppliers', description: 'Professional and training footballs' },
        { name: 'Football Boots', count: '80+ suppliers', description: 'Professional-grade football footwear' },
        { name: 'Training Equipment', count: '50+ suppliers', description: 'Cones, training kits, and accessories' },
    ];

    const topManufacturers = [
        { name: 'Elite Sports Textiles Ltd.', location: 'Lahore', capacity: '100K+ units/month', verified: true },
        { name: 'Prime Footwear Industries', location: 'Karachi', capacity: '60K+ units/month', verified: true },
        { name: 'Apex Sports Manufacturing', location: 'Faisalabad', capacity: '45K+ units/month', verified: true },
    ];

    return (
        <PublicLayout>
            <div className="min-h-screen bg-neutral-50 pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="text-center mb-16 max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-full mb-6">
                            <Star className="text-amber-400 fill-amber-400" size={16} />
                            <span className="font-body text-sm font-bold text-white uppercase tracking-[0.2em]">
                                Premium Sports Textiles
                            </span>
                        </div>
                        <h1 className="font-heading text-5xl md:text-7xl font-black text-slate-900 mb-8 tracking-tighter">
                            Football Manufacturing
                        </h1>
                        <p className="font-body text-xl text-slate-600 leading-relaxed font-medium">
                            Pakistan's largest network of football equipment manufacturers. Premium jerseys, balls, and training gear produced for international brands and local distributors.
                        </p>

                        {/* Key Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
                            {[
                                { label: "Verified Suppliers", value: stats.suppliers },
                                { label: "Average MOQ", value: stats.avgMOQ },
                                { label: "Export Ready", value: stats.exportReadiness },
                                { label: "Monthly Capacity", value: stats.totalCapacity }
                            ].map((stat, i) => (
                                <div key={i} className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all">
                                    <div className="font-heading text-4xl font-black text-slate-900 mb-1">{stat.value}</div>
                                    <div className="font-body text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Product Categories */}
                    <div className="mb-24">
                        <h2 className="font-heading text-4xl font-bold text-slate-900 mb-12 tracking-tight">Capabilities</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {categories.map((category, index) => (
                                <Link
                                    key={index}
                                    href="/marketplace"
                                    className="group bg-slate-900 border border-slate-800 rounded-[3rem] p-10 hover:border-emerald-500 hover:shadow-2xl transition-all duration-700 shadow-xl flex flex-col relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors rounded-full -mr-12 -mt-12 blur-2xl"></div>
                                    <h3 className="font-heading text-2xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors relative z-10">
                                        {category.name}
                                    </h3>
                                    <p className="font-body font-bold text-emerald-500 mb-4 text-xs uppercase tracking-widest relative z-10">{category.count}</p>
                                    <p className="font-body text-slate-400 text-sm leading-relaxed mb-10 relative z-10">{category.description}</p>
                                    <div className="mt-auto flex items-center gap-3 text-white font-body font-bold text-xs uppercase tracking-[0.2em] group-hover:gap-4 transition-all relative z-10">
                                        View Catalog <ArrowRight size={18} className="text-emerald-500" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Top Manufacturing Hubs */}
                    <div className="mb-24">
                        <h2 className="font-heading text-3xl font-bold text-slate-900 mb-10 tracking-tight">Regional Hubs</h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            {stats.topLocations.map((location, index) => (
                                <div key={index} className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-lg group hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                                            <MapPin className="text-slate-400 group-hover:text-emerald-600 transition-colors" size={24} />
                                        </div>
                                        <h3 className="font-heading text-3xl font-bold text-slate-900">{location}</h3>
                                    </div>
                                    <p className="font-body text-slate-600 text-lg leading-relaxed">Major football equipment production centers with global export capabilities and advanced machinery.</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Manufacturers */}
                    <div className="mb-24">
                        <div className="flex justify-between items-end mb-12">
                            <div>
                                <h2 className="font-heading text-4xl font-bold text-slate-900 tracking-tight">Certified Manufacturers</h2>
                                <p className="font-body text-slate-500 mt-2">Vetted for high-volume export and compliance standards</p>
                            </div>
                            <Link href="/suppliers" className="hidden sm:flex font-body font-bold text-xs text-slate-900 uppercase tracking-[0.2em] hover:text-emerald-600 transition-colors items-center gap-3">
                                Full Supplier Base <ArrowRight size={18} />
                            </Link>
                        </div>
                        <div className="grid md:grid-cols-3 gap-10">
                            {topManufacturers.map((manufacturer, index) => (
                                <div key={index} className="bg-white border-2 border-slate-50 rounded-[3rem] p-12 hover:shadow-2xl transition-all duration-500 group relative">
                                    <div className="absolute top-6 right-8">
                                        {manufacturer.verified && (
                                            <CheckCircle className="text-emerald-500" size={32} />
                                        )}
                                    </div>
                                    <h3 className="font-heading text-2xl font-bold text-slate-900 mb-8 pr-12">{manufacturer.name}</h3>
                                    <div className="space-y-5 mb-12">
                                        <div className="flex items-center gap-4 text-slate-400">
                                            <MapPin size={20} />
                                            <span className="font-body font-bold text-slate-600">{manufacturer.location}, Pakistan</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Package size={20} className="text-emerald-500" />
                                            <span className="font-body font-black uppercase text-sm tracking-widest text-slate-900">{manufacturer.capacity}</span>
                                        </div>
                                    </div>
                                    <Link
                                        href="/marketplace"
                                        className="block text-center px-10 py-5 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all font-body font-bold text-lg shadow-xl shadow-emerald-600/20"
                                    >
                                        View Catalog
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="bg-emerald-600 rounded-[4rem] p-16 lg:p-24 text-white text-center relative overflow-hidden shadow-2xl shadow-emerald-600/30">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-50"></div>
                        <div className="relative z-10">
                            <h2 className="font-heading text-5xl lg:text-6xl font-black mb-8 tracking-tighter">Scale Your Football Sourcing</h2>
                            <p className="font-body text-xl text-emerald-50 mb-14 max-w-3xl mx-auto leading-relaxed">
                                Connect with verified manufacturers and access premium football gear at competitive bulk pricing. Join the digital revolution in sports trade.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-6 justify-center">
                                <Link
                                    href="/marketplace"
                                    className="inline-flex items-center gap-3 px-14 py-6 bg-white text-emerald-600 rounded-3xl hover:bg-slate-900 hover:text-white transition-all font-body font-black text-xl shadow-2xl active:scale-[0.98]"
                                >
                                    Explore Marketplace
                                    <ArrowRight className="group-hover:translate-x-1 transition-transform" size={28} />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
};

export default FootballManufacturing;
