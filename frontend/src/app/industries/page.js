"use client";

import React from 'react';
import Link from 'next/link';
import PublicLayout from '../../components/shared/PublicLayout';
import {
    Factory,
    TrendingUp,
    MapPin,
    Users,
    ShieldCheck,
    ArrowRight,
    CheckCircle2,
    BarChart3,
} from 'lucide-react';

const Industries = () => {
    const industries = [
        {
            id: 'cricket',
            name: 'Cricket Manufacturing',
            badge: 'Leading Sports Manufacturing Hub',
            description: 'Connect with trusted sports equipment manufacturers across Pakistan. Find quality products from verified suppliers all in one place',
            stats: {
                suppliers: { value: '450+', label: 'Active Mfrs' },
                avgOrder: { value: 'PKR 2.5M', label: 'Avg Ticket' },
                location: { value: 'Sialkot, PK', label: 'Primary Hub' }
            },
            products: ['Cricket Bats', 'Match Balls', 'Protective Gear', 'Team Kits', 'Training Aids'],
            color: 'from-blue-500 to-indigo-600',
            bgIconColor: 'bg-blue-500',
            textIconColor: 'text-blue-500'
        },
        {
            id: 'football',
            name: 'Football Manufacturing',
            badge: 'Pakistan\'s Sports Marketplace',
            description: 'Source quality footballs directly from trusted manufacturers in Sialkot, Pakistan\'s sports manufacturing hub',
            stats: {
                suppliers: { value: '380+', label: 'Active Mfrs' },
                avgOrder: { value: 'PKR 1.8M', label: 'Avg Ticket' },
                location: { value: 'Sialkot, PK', label: 'Primary Hub' }
            },
            products: ['Match Balls', 'Team Jerseys', 'Pro Boots', 'Training Gear', 'Goalie Kits'],
            color: 'from-[#00A878] to-[#009166]',
            bgIconColor: 'bg-[#00A878]',
            textIconColor: 'text-[#00A878]'
        }
    ];

    const trustFeatures = [
        {
            icon: ShieldCheck,
            title: "Trusted Suppliers",
            desc: "Find verified manufacturers and reliable business partners."
        },
        {
            icon: Factory,
            title: "Easy Bulk Orders",
            desc: "Source products in bulk quickly and efficiently."
        },
        {
            icon: Users,
            title: "Direct Communication",
            desc: "Connect directly with suppliers and negotiate with confidence."
        },
        {
            icon: TrendingUp,
            title: "Grow Your Business",
            desc: "Discover new opportunities and expand your network."
        }
    ];

    return (
        <PublicLayout>
            <div className="min-h-screen relative pt-32 pb-24 overflow-hidden">
                {/* Modern Dynamic Background */}
                <div className="absolute inset-0 bg-[#F8FAFC] z-0" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-[#00A878]/10 to-transparent rounded-[100%] blur-[100px] z-0" />
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] z-0" />
                <div className="absolute top-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] z-0" />

                <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                    {/* Page Header */}
                    <div className="text-center mb-16 animate-in slide-in-from-bottom-5 fade-in duration-700">
                        <span className="inline-block py-1.5 px-4 rounded-full bg-white border border-[#E5E7EB] text-[12px] font-bold text-[#00A878] tracking-widest uppercase mb-6 shadow-sm">
                            Industries
                        </span>
                        <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold text-[#0F172A] mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#0F172A] to-slate-600">
                            Industries We Power
                        </h1>
                        <p className="font-body text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
                            Specialized B2B marketplaces for Pakistan's sports manufacturing ecosystem
                        </p>
                    </div>

                    <div className="space-y-16 animate-in slide-in-from-bottom-10 fade-in duration-1000 delay-150">

                        {/* Industry Cards Grid */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {industries.map((industry) => (
                                <div key={industry.id} className="group bg-white/80 backdrop-blur-xl rounded-[24px] border border-white/40 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-8 md:p-10 relative overflow-hidden hover:shadow-[0_20px_40px_-15px_rgba(0,168,120,0.15)] transition-all duration-500 hover:-translate-y-1 flex flex-col">
                                    {/* Card Top Border Accent */}
                                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${industry.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                                    {/* Header Section */}
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-bold tracking-widest uppercase mb-4 shadow-sm border border-${industry.bgIconColor}/10 bg-${industry.bgIconColor}/5 ${industry.textIconColor}`}>
                                                {industry.badge}
                                            </span>
                                            <h2 className="font-heading text-[28px] font-bold text-[#0F172A] flex items-center gap-2 leading-tight tracking-tight">
                                                {industry.name}
                                                <CheckCircle2 className={`w-6 h-6 ${industry.textIconColor}`} />
                                            </h2>
                                        </div>
                                    </div>

                                    <p className="font-body text-slate-500 text-[15px] mb-8 leading-relaxed">
                                        {industry.description}
                                    </p>

                                    {/* Benefits List */}
                                    <div className="mb-8 p-6 bg-[#F8FAFC] rounded-[16px] border border-[#E5E7EB]">
                                        <div className="flex flex-col gap-3">
                                            {[
                                                "Verified Suppliers",
                                                "Secure Transactions",
                                                "Bulk Order Management",
                                                "Nationwide Delivery",
                                                "24/7 B2B Support"
                                            ].map((benefit, idx) => (
                                                <div key={idx} className="flex items-center gap-3">
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center bg-white border shadow-sm ${industry.textIconColor}`}>
                                                        <CheckCircle2 size={14} className="stroke-[3]" />
                                                    </div>
                                                    <span className="font-body text-[14px] font-bold text-slate-600">{benefit}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Products Grid */}
                                    <div className="mb-10 flex-1">
                                        <h3 className="font-heading text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-4">Key Products</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {industry.products.map((product, idx) => (
                                                <span key={idx} className="px-4 py-2 bg-white border border-[#E5E7EB] text-slate-600 rounded-[12px] text-[13px] font-semibold hover:border-[#00A878]/30 hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-all cursor-default shadow-sm">
                                                    {product}
                                                </span>
                                            ))}
                                        </div>
                                    </div>


                                </div>
                            ))}
                        </div>

                        {/* Trust & Stats Section */}
                        <div className="pt-16 border-t border-slate-200">
                            <div className="text-center mb-12">
                                <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#0F172A] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#0F172A] to-slate-600 mb-3">
                                    Why Choose GearUp?
                                </h2>
                                <p className="font-body text-lg text-slate-500 max-w-2xl mx-auto">
                                    Connecting businesses with trusted manufacturers across Pakistan.
                                </p>
                            </div>

                            <div className="bg-[#0B1121] text-white rounded-[24px] p-8 md:p-12 shadow-2xl border border-white/10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-gradient-to-br from-[#00A878]/20 to-[#00A878]/0 blur-3xl" />
                                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-gradient-to-tr from-blue-500/15 to-purple-500/0 blur-3xl" />
                                
                                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                                    {trustFeatures.map((feature, idx) => (
                                        <div key={idx} className="group p-4 bg-white/5 border border-white/10 rounded-[16px] hover:bg-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-md">
                                            <div className="w-12 h-12 bg-white/10 rounded-[12px] flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-[#00A878]/20 transition-all duration-300">
                                                <feature.icon className="text-white group-hover:text-[#00A878] transition-colors" size={22} strokeWidth={2} />
                                            </div>
                                            <h3 className="font-heading text-lg font-bold text-white mb-2">{feature.title}</h3>
                                            <p className="font-body text-[13px] text-slate-400 font-medium leading-relaxed">
                                                {feature.desc}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </PublicLayout>
    );
};

export default Industries;
