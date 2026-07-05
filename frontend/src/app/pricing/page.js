"use client";

import React from 'react';
import Link from 'next/link';
import PublicLayout from '../../components/shared/PublicLayout';
import { CheckCircle, ArrowRight, Building2, ShoppingCart, Users } from 'lucide-react';

const Pricing = () => {
    const plans = [
        {
            role: 'Manufacturer',
            icon: Building2,
            description: 'List products, manage orders, and grow sales',
            price: 'Commission-based',
            features: [
                'Unlimited product listings',
                'Order management dashboard',
                'Sales analytics & insights',
                'Buyer connection tools',
                'Inventory management',
                'Marketing support'
            ],
            cta: 'Start Selling',
            highlight: false
        },
        {
            role: 'Wholesaler',
            icon: ShoppingCart,
            description: 'Discover suppliers and streamline procurement',
            price: 'Free to browse',
            description2: 'Transaction fees apply',
            features: [
                'Access verified suppliers',
                'Bulk order management',
                'Real-time order tracking',
                'Price comparison tools',
                'Supplier evaluation',
                '24/7 support'
            ],
            cta: 'Start Buying',
            highlight: true
        },
        {
            role: 'Distributor / Admin',
            icon: Users,
            description: 'Platform management and oversight',
            price: 'Enterprise',
            features: [
                'Business verification tools',
                'Platform analytics',
                'Order oversight',
                'User management',
                'Compliance monitoring',
                'Dedicated support'
            ],
            cta: 'Contact Sales',
            highlight: false
        }
    ];

    return (
        <PublicLayout>
            <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50 pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="text-center mb-16 max-w-3xl mx-auto">
                        <h1 className="font-heading text-5xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tight">Pricing & Plans</h1>
                        <p className="font-body text-xl text-slate-600 leading-relaxed">
                            Transparent, role-based pricing designed for B2B trade at scale
                        </p>
                    </div>

                    {/* Pricing Cards */}
                    <div className="grid md:grid-cols-3 gap-8 mb-20">
                        {plans.map((plan, index) => {
                            const Icon = plan.icon;
                            return (
                                <div
                                    key={index}
                                    className={`bg-white rounded-3xl border ${plan.highlight ? 'border-emerald-500 shadow-2xl ring-4 ring-emerald-50' : 'border-slate-200'
                                        } p-10 hover:shadow-xl transition-all relative group shadow-sm`}
                                >
                                    {plan.highlight && (
                                        <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 px-6 py-1.5 bg-emerald-600 text-white rounded-full font-body text-sm font-bold shadow-lg shadow-emerald-600/20">
                                            Most Popular
                                        </div>
                                    )}

                                    <div className="text-center mb-10">
                                        <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                            <Icon className="text-emerald-600" size={36} />
                                        </div>
                                        <h3 className="font-heading text-3xl font-extrabold text-slate-900 mb-3">{plan.role}</h3>
                                        <p className="font-body text-slate-500 mb-6 h-12">{plan.description}</p>
                                        <div className="mb-2">
                                            <span className="font-heading text-4xl font-extrabold text-slate-900">{plan.price}</span>
                                        </div>
                                        {plan.description2 && (
                                            <p className="font-body text-sm font-semibold text-emerald-600 uppercase tracking-widest">{plan.description2}</p>
                                        )}
                                    </div>

                                    <ul className="space-y-5 mb-10">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-4">
                                                <CheckCircle className="text-emerald-500 flex-shrink-0 mt-1" size={20} />
                                                <span className="font-body text-slate-700 font-medium">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Link
                                        href={plan.cta === 'Contact Sales' ? '/contact' : '/register'}
                                        className={`block w-full text-center px-10 py-5 rounded-2xl font-body font-bold text-lg transition-all ${plan.highlight
                                                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 active:scale-[0.98]'
                                                : 'bg-white border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white'
                                            }`}
                                    >
                                        {plan.cta}
                                    </Link>
                                </div>
                            );
                        })}
                    </div>

                    {/* Additional Information */}
                    <div className="bg-white rounded-[3rem] border border-slate-100 p-12 mb-16 shadow-lg shadow-slate-200/50">
                        <h2 className="font-heading text-4xl font-bold text-slate-900 mb-12 text-center tracking-tight">
                            Transparent Pricing Structure
                        </h2>
                        <div className="grid md:grid-cols-2 gap-16">
                            <div className="relative p-8 bg-slate-50 rounded-3xl border border-transparent hover:border-emerald-100 transition-colors">
                                <div className="absolute -top-4 -left-4 w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg text-emerald-600 font-bold">1</div>
                                <h3 className="font-heading text-2xl font-bold text-slate-900 mb-5">For Manufacturers</h3>
                                <p className="font-body text-lg text-slate-600 leading-relaxed mb-6">
                                    Build and manage your digital storefront with zero upfront costs. Pay only when you make a sale. Commission rates are tailored by category and volume.
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    {['No Upfront Fees', 'No Subscriptions', 'Value-Driven'].map((badge, i) => (
                                        <span key={i} className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold">{badge}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="relative p-8 bg-slate-50 rounded-3xl border border-transparent hover:border-emerald-100 transition-colors">
                                <div className="absolute -top-4 -left-4 w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg text-emerald-600 font-bold">2</div>
                                <h3 className="font-heading text-2xl font-bold text-slate-900 mb-5">For Buyers</h3>
                                <p className="font-body text-lg text-slate-600 leading-relaxed mb-6">
                                    Free to browse, free to connect. Leverage Pakistan’s largest verified sports manufacturing directory without any search or connection fees.
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    {['Free Registration', 'Verified Access', 'Bulk-First'].map((badge, i) => (
                                        <span key={i} className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold">{badge}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Enterprise CTA */}
                    <div className="bg-slate-900 rounded-[3rem] p-16 text-white text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/10 via-transparent to-blue-600/10"></div>
                        <div className="relative z-10">
                            <h2 className="font-heading text-5xl font-bold mb-6 tracking-tight">Need Custom Enterprise Pricing?</h2>
                            <p className="font-body text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                                Contact our sales team for volume discounts, enterprise-grade features, and white-label integration options.
                            </p>
                            <Link
                                href="/contact"
                                className="inline-flex items-center gap-3 px-10 py-5 bg-white text-slate-900 rounded-2xl hover:bg-slate-100 transition-all font-body font-bold text-lg group shadow-xl"
                            >
                                Contact Sales Team
                                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={24} />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
};

export default Pricing;
