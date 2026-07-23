"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import PublicLayout from '../../components/shared/PublicLayout';
import { Search, Shield, CheckCircle, Award, Package, ArrowRight } from 'lucide-react';

const ProtectiveGear = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCompliance, setActiveCompliance] = useState('all');

    const gearCategories = [
        { name: 'Cricket Helmets', compliance: 'CE, BSI', description: 'Professional cricket helmets with safety certifications' },
        { name: 'Protective Pads', compliance: 'CE, BSI', description: 'Leg guards, arm guards, thigh pads' },
        { name: 'Goalkeeper Gloves', compliance: 'CE', description: 'Professional goalkeeper protection gear' },
        { name: 'Shin Guards', compliance: 'CE, FIFA', description: 'Football shin guards meeting FIFA standards' },
    ];

    return (
        <PublicLayout>
            <div className="min-h-screen bg-neutral-50 pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="text-center mb-16 max-w-4xl mx-auto">
                        <h1 className="font-heading text-6xl md:text-7xl font-black text-slate-900 mb-6 tracking-tighter">Protective Gear</h1>
                        <p className="font-body text-xl text-slate-600 leading-relaxed font-medium">
                            Compliance-focused procurement of certified professional protective equipment for cricket, football, and team sports.
                        </p>
                    </div>

                    {/* Compliance Intelligence Card */}
                    <div className="bg-slate-900 rounded-[3rem] p-10 lg:p-16 mb-20 text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                        <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
                            <div className="w-24 h-24 bg-emerald-600 rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-600/20 rotate-12 flex-shrink-0">
                                <Shield className="text-white" size={48} />
                            </div>
                            <div className="flex-1 text-center lg:text-left">
                                <h3 className="font-heading text-3xl font-bold mb-4">Safety & Compliance Standards</h3>
                                <p className="font-body text-slate-400 text-lg leading-relaxed mb-10 max-w-2xl">
                                    All protective gear listed on GearUp meets international safety regulations. We verify manufacturer compliance (CE, BSI, FIFA) before any vendor or product is added to the marketplace.
                                </p>
                                <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                                    {[
                                        { label: 'CE Certified', color: 'bg-emerald-500' },
                                        { label: 'BSI Standards', color: 'bg-blue-500' },
                                        { label: 'FIFA Approved', color: 'bg-amber-500' }
                                    ].map((tag, i) => (
                                        <div key={i} className="flex items-center gap-2 px-5 py-2.5 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
                                            <div className={`w-2 h-2 rounded-full ${tag.color} animate-pulse`}></div>
                                            <span className="font-body font-bold text-xs uppercase tracking-widest">{tag.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters & Navigation */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 mb-12 shadow-xl shadow-slate-200/50">
                        <div className="flex flex-col lg:flex-row gap-6">
                            <div className="flex-1 relative">
                                <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                                <input
                                    type="text"
                                    placeholder="Search certified protection..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-6 pr-16 w-full py-5 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:ring-4 focus:ring-emerald-50/50 focus:border-emerald-500 focus:bg-white outline-none transition-all font-body text-xl"
                                />
                            </div>
                            <div className="flex gap-3">
                                {['all', 'ce', 'bsi', 'fifa'].map(standard => (
                                    <button
                                        key={standard}
                                        onClick={() => setActiveCompliance(standard)}
                                        className={`px-8 py-5 rounded-2xl font-body font-bold text-xs uppercase tracking-widest transition-all ${activeCompliance === standard
                                                ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20'
                                                : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-400'
                                            }`}
                                    >
                                        {standard === 'all' ? 'All Standards' : standard}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Categories Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
                        {gearCategories.map((category, index) => (
                            <Link
                                key={index}
                                href="/marketplace"
                                className="group bg-white border border-slate-100 rounded-[3rem] p-10 hover:border-emerald-500 hover:shadow-2xl transition-all duration-500 shadow-lg"
                            >
                                <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mb-8 group-hover:bg-emerald-600 transition-all duration-500 transform group-hover:-rotate-12">
                                    <Shield className="text-emerald-600 group-hover:text-white" size={36} />
                                </div>
                                <h3 className="font-heading text-2xl font-bold text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors">
                                    {category.name}
                                </h3>
                                <div className="flex items-center gap-2 mb-6">
                                    <Award className="text-emerald-500" size={20} />
                                    <span className="font-body text-xs font-black text-emerald-700 uppercase tracking-widest">{category.compliance}</span>
                                </div>
                                <p className="font-body text-slate-500 text-base leading-relaxed mb-10">{category.description}</p>
                                <div className="flex items-center justify-between group-hover:translate-x-1 transition-transform">
                                    <div className="font-body font-bold text-xs uppercase tracking-[0.2em] text-slate-900">View Products</div>
                                    <Package className="text-emerald-500" size={20} />
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Compliance Detail Cards */}
                    <div className="mb-24">
                        <h2 className="font-heading text-4xl font-bold text-slate-900 mb-12 tracking-tight">Compliance Profiles</h2>
                        <div className="grid md:grid-cols-3 gap-10">
                            {[
                                { title: "CE Certification", desc: "European Conformity mark ensuring products meet EU safety, health, and environmental protection requirements." },
                                { title: "BSI Standards", desc: "British Standards Institution certification for quality and safety in high-impact sports protective equipment." },
                                { title: "FIFA Approved", desc: "FIFA Quality Programme certification for football protective gear meeting professional match standards." }
                            ].map((item, i) => (
                                <div key={i} className="p-10 bg-white rounded-[2.5rem] border border-slate-100 hover:bg-emerald-50/50 transition-colors shadow-sm">
                                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-8">
                                        <CheckCircle className="text-emerald-600" size={24} />
                                    </div>
                                    <h3 className="font-heading text-2xl font-bold text-slate-900 mb-4">{item.title}</h3>
                                    <p className="font-body text-slate-600 text-lg leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="bg-slate-900 rounded-[4rem] p-16 lg:p-24 text-white text-center relative overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/30 via-transparent to-blue-600/10"></div>
                        <div className="relative z-10 max-w-4xl mx-auto">
                            <h2 className="font-heading text-5xl lg:text-7xl font-black mb-8 tracking-tighter">Safety-First Procurement</h2>
                            <p className="font-body text-xl text-slate-400 mb-14 leading-relaxed font-medium">
                                Ensure full laboratory-tested safety compliance with our verified network of certified manufacturers. Secure your supply chain today.
                            </p>
                            <Link
                                href="/marketplace"
                                className="inline-flex items-center gap-3 px-14 py-6 bg-emerald-600 text-white rounded-3xl hover:bg-emerald-500 transition-all font-body font-black text-xl shadow-2xl shadow-emerald-600/30 active:scale-95 group"
                            >
                                Browse Certified Gear
                                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={28} />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
};

export default ProtectiveGear;
