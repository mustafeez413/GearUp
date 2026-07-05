"use client";

import React from 'react';
import PublicLayout from '../../components/shared/PublicLayout';

const CommissionPolicy = () => {
    return (
        <PublicLayout>
            <div className="min-h-screen bg-neutral-50 pt-32 pb-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-3xl border border-slate-200 p-10 md:p-16 shadow-xl shadow-slate-200/50">
                        <h1 className="font-heading text-5xl font-black text-slate-900 mb-4 tracking-tighter">Commission & Payment Policy</h1>
                        <p className="font-body text-slate-500 mb-12 font-medium">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

                        <div className="space-y-12">
                            <section>
                                <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">01</span>
                                    Overview
                                </h2>
                                <p className="font-body text-lg text-slate-600 leading-relaxed mb-4">
                                    GearUp charges a small platform commission on completed orders. This helps us keep the marketplace running smoothly for manufacturers and wholesalers.
                                </p>
                                <p className="font-body text-lg text-slate-600 leading-relaxed mb-4">
                                    Your commission supports:
                                </p>
                                <ul className="font-body text-lg text-slate-600 leading-relaxed list-disc pl-6 space-y-2">
                                    <li>Keeping the platform secure and reliable</li>
                                    <li>Processing payments and verifying transactions safely</li>
                                    <li>Customer support when you need help with orders or payouts</li>
                                    <li>Ongoing improvements to the GearUp B2B experience</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">02</span>
                                    Platform Commission
                                </h2>
                                <p className="font-body text-lg text-slate-600 leading-relaxed mb-4">
                                    Commission rates are set and managed by GearUp administrators. They are not fixed forever and may be updated from time to time as the platform grows.
                                </p>
                                <ul className="font-body text-lg text-slate-600 leading-relaxed list-disc pl-6 space-y-2">
                                    <li>Current rates are always shown on the platform where they apply to your account or orders</li>
                                    <li>When rates change, the new rate applies only to new transactions going forward</li>
                                    <li>Any updates will also be reflected on this policy page</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">03</span>
                                    Automatic Deduction
                                </h2>
                                <p className="font-body text-lg text-slate-600 leading-relaxed mb-4">
                                    You do not need to calculate commission yourself. The system handles it automatically for every eligible order.
                                </p>
                                <ul className="font-body text-lg text-slate-600 leading-relaxed list-disc pl-6 space-y-2">
                                    <li><strong>Buyers (wholesalers)</strong> pay the total order amount shown on the platform at checkout</li>
                                    <li><strong>Sellers (manufacturers)</strong> receive their payout after any applicable platform fees are deducted</li>
                                    <li>All calculations are done securely on our servers, so amounts stay accurate and consistent</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">04</span>
                                    Payment Verification & Settlement
                                </h2>
                                <p className="font-body text-lg text-slate-600 leading-relaxed mb-4">
                                    To protect both buyers and sellers, GearUp verifies payments before orders move forward.
                                </p>
                                <ul className="font-body text-lg text-slate-600 leading-relaxed list-disc pl-6 space-y-2 mb-4">
                                    <li>Buyers may be asked to upload payment proof, such as a bank deposit slip or transfer receipt</li>
                                    <li>Payments are reviewed and verified before they are accepted</li>
                                    <li>Settlements to sellers are released according to GearUp&apos;s platform policies and schedules</li>
                                    <li>Any applicable platform fees are deducted before the seller receives their final payout</li>
                                </ul>
                                <p className="font-body text-lg text-slate-600 leading-relaxed">
                                    This process helps ensure that only confirmed payments lead to fulfilled orders and fair payouts.
                                </p>
                            </section>

                            <section>
                                <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">05</span>
                                    Policy Updates
                                </h2>
                                <p className="font-body text-lg text-slate-600 leading-relaxed mb-4">
                                    GearUp may update this Commission & Payment Policy when needed—for example, to reflect changes in how we operate or how fees are applied.
                                </p>
                                <ul className="font-body text-lg text-slate-600 leading-relaxed list-disc pl-6 space-y-2">
                                    <li>Updated policies will be published on this page</li>
                                    <li>The &quot;Last updated&quot; date at the top will change when revisions are made</li>
                                    <li>We encourage you to review this page from time to time so you stay informed</li>
                                </ul>
                            </section>

                            <section className="pt-12 border-t border-slate-100">
                                <div className="bg-slate-900 rounded-3xl p-10 text-white">
                                    <h2 className="font-heading text-2xl font-bold mb-4">Financial Support?</h2>
                                    <p className="font-body text-slate-400 mb-6">If you have any questions regarding your transactions, payouts, or deductions, get in touch with our billing department.</p>
                                    <a href="mailto:billing@gearup.com" className="inline-block px-8 py-4 bg-emerald-600 text-white rounded-xl font-body font-bold hover:bg-emerald-500 transition-all">
                                        billing@gearup.com
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

export default CommissionPolicy;
