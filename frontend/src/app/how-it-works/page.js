"use client";

import React from 'react';
import Link from 'next/link';
import PublicLayout from '../../components/shared/PublicLayout';
import { CheckCircle, Search, FileText, TrendingUp } from 'lucide-react';

const HowItWorks = () => {
    const lifecycle = [
        {
            phase: '01',
            title: 'Business Verification',
            outcome: 'Access verified supplier network',
            description: 'Complete business registration and verification to join Pakistan\'s premier B2B manufacturing network. All members are vetted for legitimacy and trade capacity.',
            icon: CheckCircle
        },
        {
            phase: '02',
            title: 'Supplier Discovery',
            outcome: 'Match with production capabilities',
            description: 'Discover manufacturers aligned with your requirements. Filter by capacity, MOQ, location, and export readiness to find optimal trade partners.',
            icon: Search
        },
        {
            phase: '03',
            title: 'Bulk Order Management',
            outcome: 'Streamlined procurement workflow',
            description: 'Initiate bulk orders with transparent pricing, production timelines, and order tracking. Negotiate terms and manage contracts through the platform.',
            icon: FileText
        },
        {
            phase: '04',
            title: 'Intelligence & Analytics',
            outcome: 'Data-driven trade decisions',
            description: 'Leverage real-time analytics for demand forecasting, supplier performance metrics, and market insights to optimize your procurement strategy.',
            icon: TrendingUp
        }
    ];

    const roles = [
        {
            title: 'For Manufacturers',
            description: 'Showcase products, manage inventory, connect with buyers',
            features: ['Product listing', 'Order management', 'Sales analytics', 'Capacity tracking']
        },
        {
            title: 'For Retailers & Wholesalers',
            description: 'Discover suppliers, place orders, track shipments',
            features: ['Supplier discovery', 'Bulk ordering', 'Order tracking', 'Price comparison']
        },
        {
            title: 'For Distributors',
            description: 'Platform oversight, verification, and analytics',
            features: ['Business verification', 'Order management', 'Platform analytics', 'User management']
        }
    ];

    return (
        <PublicLayout>
            <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50 pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="text-center mb-16 max-w-3xl mx-auto">
                        <h1 className="font-heading text-5xl font-bold text-slate-900 mb-6 tracking-tight">How GearUp Works</h1>
                        <p className="font-body text-xl text-slate-600 leading-relaxed">
                            From verification to analytics—a complete workflow designed for serious B2B trade
                        </p>
                    </div>

                    {/* Lifecycle Timeline */}
                    <div className="mb-24">
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {lifecycle.map((step, index) => {
                                const Icon = step.icon;
                                return (
                                    <div key={index} className="relative group">
                                        <div className="flex justify-center mb-10">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl group-hover:blur-3xl transition-all"></div>
                                                <div className="relative bg-emerald-600 text-white w-20 h-20 rounded-3xl flex items-center justify-center font-heading text-3xl font-bold rotate-12 group-hover:rotate-0 transition-transform shadow-xl">
                                                    {step.phase}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white border border-slate-200 rounded-3xl p-8 h-full hover:border-emerald-500 hover:shadow-2xl transition-all shadow-sm">
                                            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-6">
                                                <Icon className="text-emerald-600" size={24} />
                                            </div>
                                            <h3 className="font-heading text-2xl font-bold text-slate-900 mb-4">
                                                {step.title}
                                            </h3>
                                            <div className="inline-block px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full mb-4">
                                                <span className="font-body text-xs font-bold text-emerald-700 uppercase tracking-widest">
                                                    Outcome
                                                </span>
                                            </div>
                                            <p className="font-body font-bold text-slate-900 mb-4 text-lg">
                                                {step.outcome}
                                            </p>
                                            <p className="font-body text-slate-600 leading-relaxed">
                                                {step.description}
                                            </p>
                                        </div>

                                        {/* Connector line for desktop */}
                                        {index < lifecycle.length - 1 && (
                                            <div className="hidden lg:block absolute top-[60px] left-[calc(50%+60px)] w-[calc(100%-120px)] h-[2px] bg-slate-200 z-0"></div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Role-Based Benefits */}
                    <div className="mb-20">
                        <h2 className="font-heading text-4xl font-bold text-slate-900 mb-16 text-center tracking-tight">
                            Built for Every Business Type
                        </h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            {roles.map((role, index) => (
                                <div key={index} className="bg-white border border-slate-100 rounded-3xl p-10 shadow-lg hover:shadow-xl transition-all border-b-4 border-b-emerald-600">
                                    <h3 className="font-heading text-2xl font-bold text-slate-900 mb-4">{role.title}</h3>
                                    <p className="font-body text-slate-600 mb-8 text-lg">{role.description}</p>
                                    <ul className="space-y-4">
                                        {role.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-center gap-3">
                                                <CheckCircle className="text-emerald-600 flex-shrink-0" size={20} />
                                                <span className="font-body font-medium text-slate-700">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="bg-slate-900 rounded-[3rem] p-16 text-white text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-600/10 to-transparent"></div>
                        <div className="relative z-10">
                            <h2 className="font-heading text-5xl font-bold mb-6 tracking-tight">Ready to Get Started?</h2>
                            <p className="font-body text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                                Join Pakistan's premier B2B marketplace for sports goods manufacturing and take your business digital today.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-6 justify-center">
                                <Link
                                    href="/register"
                                    className="px-10 py-5 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-500 transition-all font-body font-bold text-lg shadow-xl shadow-emerald-600/20 active:scale-[0.98]"
                                >
                                    Create Account
                                </Link>
                                <Link
                                    href="/contact"
                                    className="px-10 py-5 border-2 border-slate-700 text-white rounded-2xl hover:bg-slate-800 transition-all font-body font-bold text-lg"
                                >
                                    Contact Sales
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
};

export default HowItWorks;
