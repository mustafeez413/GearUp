"use client";

import React from 'react';
import PublicLayout from '../../components/shared/PublicLayout';

const Privacy = () => {
    return (
        <PublicLayout>
            <div className="min-h-screen bg-neutral-50 pt-32 pb-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-3xl border border-slate-200 p-10 md:p-16 shadow-xl shadow-slate-200/50">
                        <h1 className="font-heading text-5xl font-black text-slate-900 mb-4 tracking-tighter">Privacy Policy</h1>
                        <p className="font-body text-slate-500 mb-12 font-medium">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

                        <div className="space-y-12">
                            <section>
                                <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">01</span>
                                    Introduction
                                </h2>
                                <p className="font-body text-lg text-slate-600 leading-relaxed">
                                    GearUp ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our B2B marketplace platform. We prioritize the security of your business data as much as your personal information.
                                </p>
                            </section>

                            <section>
                                <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">02</span>
                                    Information We Collect
                                </h2>
                                <div className="space-y-8 pl-11">
                                    <div>
                                        <h3 className="font-heading text-xl font-bold text-slate-900 mb-3">Business Information</h3>
                                        <p className="font-body text-slate-600 leading-relaxed">
                                            We collect business information including company name, registration details, tax identification numbers, business addresses, and contact information for verification and platform operations.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-heading text-xl font-bold text-slate-900 mb-3">Transaction Data</h3>
                                        <p className="font-body text-slate-600 leading-relaxed">
                                            We collect information about orders, transactions, payment details (processed through secure payment gateways), and communication between buyers and sellers on the platform.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-heading text-xl font-bold text-slate-900 mb-3">Usage Data</h3>
                                        <p className="font-body text-slate-600 leading-relaxed">
                                            We automatically collect information about how you interact with our platform, including pages visited, features used, and time spent on the platform to improve our services.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">03</span>
                                    How We Use Your Information
                                </h2>
                                <ul className="space-y-4 font-body text-slate-600 text-lg pl-11 list-none">
                                    {[
                                        "To provide and maintain our B2B marketplace services",
                                        "To verify business accounts and prevent fraud",
                                        "To facilitate transactions between buyers and sellers",
                                        "To send important notifications about your account and orders",
                                        "To analyze platform usage and improve our services",
                                        "To comply with legal obligations and enforce our terms"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2.5 flex-shrink-0"></div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            <section>
                                <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">04</span>
                                    Data Security
                                </h2>
                                <p className="font-body text-lg text-slate-600 leading-relaxed">
                                    We implement enterprise-grade security measures including encryption, secure authentication, and regular security audits to protect your business and personal information. All payment transactions are processed through PCI DSS compliant payment gateways.
                                </p>
                            </section>

                            <section>
                                <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">05</span>
                                    Data Sharing
                                </h2>
                                <p className="font-body text-lg text-slate-600 leading-relaxed">
                                    We do not sell your information. We may share data with verified partners on the platform to facilitate transactions, with service providers who assist in platform operations, and when required by law or to protect our rights.
                                </p>
                            </section>

                            <section className="pt-12 border-t border-slate-100">
                                <div className="bg-slate-900 rounded-3xl p-10 text-white">
                                    <h2 className="font-heading text-2xl font-bold mb-4">Questions regarding Privacy?</h2>
                                    <p className="font-body text-slate-400 mb-6">Our legal and compliance team is here to help clarify any concerns regarding your data.</p>
                                    <a href="mailto:privacy@gearup.com" className="inline-block px-8 py-4 bg-emerald-600 text-white rounded-xl font-body font-bold hover:bg-emerald-500 transition-all">
                                        privacy@gearup.com
                                    </a>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
};

export default Privacy;
