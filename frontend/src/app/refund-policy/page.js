"use client";

import React from 'react';
import PublicLayout from '../../components/shared/PublicLayout';

const RefundPolicy = () => {
    return (
        <PublicLayout>
            <div className="min-h-screen bg-neutral-50 pt-32 pb-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-3xl border border-slate-200 p-10 md:p-16 shadow-xl shadow-slate-200/50">
                        <h1 className="font-heading text-5xl font-black text-slate-900 mb-4 tracking-tighter">Refund & Chargeback Policy</h1>
                        <p className="font-body text-slate-500 mb-12 font-medium">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

                        <div className="space-y-12">
                            <section>
                                <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">01</span>
                                    B2B Return Conditions
                                </h2>
                                <p className="font-body text-lg text-slate-600 leading-relaxed">
                                    Because GearUp is a bulk purchase B2B platform, all refund requests are subject to verification. Refunds or order cancellations are only supported before shipment or in cases of damaged/faulty shipments, subject to immediate seller notification within 48 hours of delivery.
                                </p>
                            </section>

                            <section>
                                <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">02</span>
                                    Commission Refund Policies
                                </h2>
                                <p className="font-body text-lg text-slate-600 leading-relaxed">
                                    In cases of approved full order cancellation or seller-driven failures, the platform commission will be returned to the buyer along with the subtotal. However, in buyer-driven cancellation cases, the platform commission may be retained to cover bank charges and administrative fees, as set by the Admin refund deduction policies.
                                </p>
                            </section>

                            <section>
                                <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">03</span>
                                    Dispute Resolution
                                </h2>
                                <p className="font-body text-lg text-slate-600 leading-relaxed">
                                    Buyers and sellers are encouraged to settle disputes through the GearUp message center. If a resolution cannot be reached, GearUp administrators will review transaction logs, order records, and shipping invoices to issue a final, binding decision.
                                </p>
                            </section>

                            <section className="pt-12 border-t border-slate-100">
                                <div className="bg-slate-900 rounded-3xl p-10 text-white">
                                    <h2 className="font-heading text-2xl font-bold mb-4">Need Help with a Dispute?</h2>
                                    <p className="font-body text-slate-400 mb-6">Our dedicated support team is here to assist you with any refund, return, or payout claims.</p>
                                    <a href="mailto:disputes@gearup.com" className="inline-block px-8 py-4 bg-emerald-600 text-white rounded-xl font-body font-bold hover:bg-emerald-500 transition-all">
                                        disputes@gearup.com
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

export default RefundPolicy;
