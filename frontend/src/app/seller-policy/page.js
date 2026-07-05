"use client";

import React from 'react';
import PublicLayout from '../../components/shared/PublicLayout';

const SellerPolicy = () => {
    return (
        <PublicLayout>
            <div className="min-h-screen bg-neutral-50 pt-32 pb-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-3xl border border-slate-200 p-10 md:p-16 shadow-xl shadow-slate-200/50">
                        <h1 className="font-heading text-5xl font-black text-slate-900 mb-4 tracking-tighter">Seller Policies</h1>
                        <p className="font-body text-slate-500 mb-12 font-medium">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

                        <div className="space-y-12">
                            <section>
                                <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">01</span>
                                    Seller Registration & Verification
                                </h2>
                                <p className="font-body text-lg text-slate-600 leading-relaxed">
                                    To list products and receive wholesale orders, manufacturers must go through rigorous business verification. This requires submitting a valid Tax ID/NTN, business license, and address proof. Admin verification takes up to 48 hours.
                                </p>
                            </section>

                            <section>
                                <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">02</span>
                                    Listing Standards
                                </h2>
                                <p className="font-body text-lg text-slate-600 leading-relaxed">
                                    Sellers must provide high-quality product images, detailed specifications, accurate packaging info (bulk units), and transparent pricing. Fraudulent listings, copyright infringements, or misleading stock counts will result in immediate suspension.
                                </p>
                            </section>

                            <section>
                                <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">03</span>
                                    Fulfillment & Performance Metrics
                                </h2>
                                <p className="font-body text-lg text-slate-600 leading-relaxed">
                                    Manufacturers must accept orders promptly, update status updates (e.g. Processing, Shipped), and attach legitimate tracking codes. Consistently delayed fulfillment or high refund rates will trigger automatic review of seller ratings and potential commission surcharge.
                                </p>
                            </section>

                            <section className="pt-12 border-t border-slate-100">
                                <div className="bg-slate-900 rounded-3xl p-10 text-white">
                                    <h2 className="font-heading text-2xl font-bold mb-4">Seller Support?</h2>
                                    <p className="font-body text-slate-400 mb-6">Our merchant relations team is here to support you in scale and production optimization.</p>
                                    <a href="mailto:sellers@gearup.com" className="inline-block px-8 py-4 bg-emerald-600 text-white rounded-xl font-body font-bold hover:bg-emerald-500 transition-all">
                                        sellers@gearup.com
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

export default SellerPolicy;
