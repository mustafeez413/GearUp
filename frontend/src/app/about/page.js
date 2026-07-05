"use client";

import React from 'react';
import Link from 'next/link';
import PublicLayout from '../../components/shared/PublicLayout';
import { ArrowRight } from 'lucide-react';

const About = () => {
    return (
        <PublicLayout>
            <div className="min-h-screen relative pt-32 pb-24 overflow-hidden">
                {/* Modern Dynamic Background — identical to Contact page */}
                <div className="absolute inset-0 bg-[#F8FAFC] z-0" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-[#00A878]/10 to-transparent rounded-[100%] blur-[100px] z-0" />
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] z-0" />
                <div className="absolute top-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] z-0" />

                <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                    {/* Page Header */}
                    <div className="text-center mb-16 animate-in slide-in-from-bottom-5 fade-in duration-700">
                        <span className="inline-block py-1.5 px-4 rounded-full bg-white border border-[#E5E7EB] text-[12px] font-bold text-[#00A878] tracking-widest uppercase mb-6 shadow-sm">
                            About Us
                        </span>
                        <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold text-[#0F172A] mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#0F172A] to-slate-600">
                            About GearUp
                        </h1>
                        <p className="font-body text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
                            Transforming Pakistan's sports goods industry through digital innovation
                        </p>
                    </div>

                    <div className="space-y-12 animate-in slide-in-from-bottom-10 fade-in duration-1000 delay-150">

                        {/* Our Mission — Dark Glassmorphic Card */}
                        <div className="relative overflow-hidden rounded-[24px] bg-[#0B1121] text-white p-8 md:p-10 shadow-2xl border border-white/10">
                            {/* Decorative background elements */}
                            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-gradient-to-br from-[#00A878]/30 to-[#00A878]/0 blur-3xl" />
                            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/0 blur-3xl" />

                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#00A878]" />
                                    <h2 className="text-[12px] font-bold uppercase tracking-widest text-slate-300">Our Mission</h2>
                                </div>
                                <h3 className="text-[28px] md:text-[32px] font-[800] leading-tight tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                    Digitizing Pakistan's Sports Trade
                                </h3>
                                <p className="text-[16px] text-slate-400 font-medium leading-relaxed mb-6">
                                    GearUp is Pakistan's premier B2B digital marketplace dedicated to revolutionizing the sports goods industry.
                                    We connect manufacturers, wholesalers, retailers, and distributors in a single, streamlined platform that
                                    facilitates efficient trade, fosters growth, and drives innovation.
                                </p>
                                <p className="text-[16px] text-slate-400 font-medium leading-relaxed">
                                    Our mission is to digitize traditional trade processes, making it easier for businesses to discover trusted
                                    suppliers, manage bulk orders, track shipments, and make data-driven decisions that propel their success.
                                </p>
                            </div>
                        </div>

                        {/* Who We Serve */}
                        <div>
                            <div className="text-center mb-8">
                                <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#0F172A] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#0F172A] to-slate-600">
                                    Who We Serve
                                </h2>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                {[
                                    {
                                        title: 'Manufacturers',
                                        desc: 'Showcase your products, manage inventory, and connect with buyers across Pakistan and beyond.',
                                        color: 'from-[#00A878] to-[#009166]'
                                    },
                                    {
                                        title: 'Wholesalers',
                                        desc: 'Discover verified suppliers, place bulk orders, and streamline your procurement process.',
                                        color: 'from-blue-500 to-indigo-600'
                                    }
                                ].map((item, idx) => (
                                    <div key={idx} className="group bg-white/80 backdrop-blur-xl rounded-[24px] border border-white/40 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-8 md:p-10 relative overflow-hidden hover:shadow-[0_20px_40px_-15px_rgba(0,168,120,0.15)] transition-all duration-500 hover:-translate-y-1">
                                        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                                        <h3 className="font-heading text-xl font-bold text-[#0F172A] mb-3">{item.title}</h3>
                                        <p className="font-body text-[15px] text-slate-500 leading-relaxed">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Why GearUp */}
                        <div>
                            <div className="text-center mb-8">
                                <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#0F172A] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#0F172A] to-slate-600">
                                    Why GearUp
                                </h2>
                            </div>
                            <div className="bg-white/80 backdrop-blur-xl rounded-[24px] border border-white/40 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-8 md:p-10">
                                <div className="space-y-6">
                                    {[
                                        { title: "Verified Suppliers", desc: "All manufacturers undergo strict verification processes" },
                                        { title: "Secure Transactions", desc: "Bank-grade encryption for all payments and data" },
                                        { title: "AI-Powered Insights", desc: "Make data-driven decisions with advanced analytics" },
                                        { title: "Local Industry Focus", desc: "Deep expertise in Pakistan sports manufacturing" }
                                    ].map((item, idx) => (
                                        <div key={idx} className="group flex items-start gap-5 p-4 bg-[#F8FAFC] border border-transparent rounded-[16px] hover:bg-white hover:border-[#00A878]/20 hover:shadow-sm transition-all duration-300">
                                            <div className="flex-shrink-0 w-10 h-10 rounded-[12px] bg-gradient-to-br from-[#00A878] to-[#009166] text-white flex items-center justify-center font-bold text-[14px] shadow-md group-hover:scale-110 transition-transform duration-300">
                                                ✓
                                            </div>
                                            <div>
                                                <h4 className="font-heading font-bold text-[16px] text-[#0F172A] mb-1">{item.title}</h4>
                                                <p className="font-body text-[14px] text-slate-500 leading-relaxed">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Leadership */}
                        <div>
                            <div className="text-center mb-4">
                                <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#0F172A] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#0F172A] to-slate-600 mb-3">
                                    Our Leadership
                                </h2>
                                <p className="font-body text-lg text-slate-500 max-w-2xl mx-auto">
                                    The people building GearUp's B2B sports commerce ecosystem
                                </p>
                            </div>

                            <div className="grid md:grid-cols-3 gap-6 mt-8">
                                {[
                                    { name: "Mustafeez ur Rehman", role: "Co-Founder / Platform Strategy" },
                                    { name: "Hamza Asif", role: "Co-Founder / Product & Technology" },
                                    { name: "Fazail Ishtiaq", role: "Co-Founder / Operations & Growth" }
                                ].map((member, idx) => (
                                    <div key={idx} className="group bg-white/80 backdrop-blur-xl rounded-[24px] border border-white/40 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden hover:shadow-[0_20px_40px_-15px_rgba(0,168,120,0.15)] transition-all duration-500 hover:-translate-y-1">
                                        <div className="aspect-square bg-[#0B1121] relative overflow-hidden">
                                            {/* Decorative glow */}
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[#00A878]/10 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                            <img
                                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=022c22&color=fff&size=500`}
                                                alt={member.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                            />
                                        </div>
                                        <div className="p-6 text-center bg-white relative z-10">
                                            <h3 className="font-heading text-xl font-bold text-[#0F172A] mb-2">{member.name}</h3>
                                            <p className="font-body text-[11px] font-bold text-[#00A878] uppercase tracking-widest">
                                                {member.role}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* CTA Section */}
                        <div className="relative overflow-hidden rounded-[24px] bg-[#0B1121] text-white p-8 md:p-10 shadow-2xl border border-white/10 text-center">
                            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-gradient-to-br from-[#00A878]/20 to-[#00A878]/0 blur-3xl" />
                            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-gradient-to-tr from-blue-500/15 to-purple-500/0 blur-3xl" />
                            <div className="relative z-10">
                                <h3 className="text-[28px] md:text-[32px] font-[800] leading-tight tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                    Ready to Join GearUp?
                                </h3>
                                <p className="text-[16px] text-slate-400 font-medium leading-relaxed mb-8 w-full max-w-2xl mx-auto text-center">
                                    Whether you're a manufacturer expanding reach or a wholesaler seeking trusted suppliers — we're here for you.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Link
                                        href="/register"
                                        className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-[#00A878] to-[#009166] text-white rounded-[16px] font-bold text-[16px] transition-all duration-300 shadow-[0_10px_30px_-10px_rgba(0,168,120,0.5)] hover:shadow-[0_20px_40px_-15px_rgba(0,168,120,0.6)] hover:-translate-y-1"
                                    >
                                        Create Free Account
                                        <ArrowRight size={18} />
                                    </Link>
                                    <Link
                                        href="/contact"
                                        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-slate-300 rounded-[16px] font-bold text-[16px] hover:bg-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-md"
                                    >
                                        Contact Us
                                    </Link>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </PublicLayout>
    );
};

export default About;
