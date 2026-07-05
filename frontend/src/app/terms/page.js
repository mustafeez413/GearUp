"use client";

import React from 'react';
import PublicLayout from '../../components/shared/PublicLayout';

const Terms = () => {
    return (
        <PublicLayout>
            <div className="min-h-screen bg-neutral-50 pt-32 pb-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-3xl border border-slate-200 p-10 md:p-16 shadow-xl shadow-slate-200/50">
                        <h1 className="font-heading text-5xl font-black text-slate-900 mb-4 tracking-tighter">Terms of Service</h1>
                        <p className="font-body text-slate-500 mb-12 font-medium">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

                        <div className="space-y-12">
                            <section>
                                <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">01</span>
                                    Agreement to Terms
                                </h2>
                                <p className="font-body text-lg text-slate-600 leading-relaxed">
                                    By accessing or using GearUp's B2B marketplace platform, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the platform. These terms apply to all visitors, users, and others who access or use the Service.
                                </p>
                            </section>

                            <section>
                                <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">02</span>
                                    Business Account Requirements
                                </h2>
                                <p className="font-body text-lg text-slate-600 leading-relaxed">
                                    To use GearUp, you must register a business account with accurate company information. You must be authorized to represent the business and provide verification documents as requested. All accounts are subject to verification and approval. You are responsible for safeguarding the password that you use to access the Service.
                                </p>
                            </section>

                            <section>
                                <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">03</span>
                                    Platform Use
                                </h2>
                                <div className="space-y-8 pl-11">
                                    <div>
                                        <h3 className="font-heading text-xl font-bold text-slate-900 mb-3">Permitted Use</h3>
                                        <p className="font-body text-slate-600 leading-relaxed">
                                            You may use GearUp for legitimate B2B transactions, supplier discovery, order management, and business communication related to sports goods trade.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-heading text-xl font-bold text-slate-900 mb-3 text-red-600 uppercase tracking-widest text-sm">Prohibited Activities</h3>
                                        <ul className="space-y-3 font-body text-slate-600 list-none font-medium">
                                            {[
                                                "Misrepresenting business information or credentials",
                                                "Engaging in fraudulent transactions",
                                                "Violating intellectual property rights",
                                                "Interfering with platform operations or security",
                                                "Using the platform for illegal purposes"
                                            ].map((item, i) => (
                                                <li key={i} className="flex items-center gap-3">
                                                    <span className="text-red-500 font-bold">×</span>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">04</span>
                                    Transactions & Platform Fees
                                </h2>
                                <div className="space-y-6 pl-11">
                                    <p className="font-body text-lg text-slate-600 leading-relaxed">
                                        All transactions are between buyers and sellers. GearUp facilitates the procurement process but is not a party to the direct sale.
                                    </p>
                                    <ul className="space-y-4 font-body text-slate-600 font-medium">
                                        <li className="flex gap-3">
                                            <span className="text-emerald-600 font-bold">•</span>
                                            <div>
                                                <strong>Platform Commission:</strong> A standard platform service fee (currently 0.1%) applies to all transactions. This commission is automatically deducted from the seller's payment.
                                            </div>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="text-emerald-600 font-bold">•</span>
                                            <div>
                                                <strong>Advance Payment:</strong> As a B2B marketplace, GearUp requires advance payment verification for all bulk orders to ensure transaction security.
                                            </div>
                                        </li>
                                        <li className="flex gap-3">
                                            <span className="text-emerald-600 font-bold">•</span>
                                            <div>
                                                <strong>Invoice Verification:</strong> Buyers must upload valid payment proof (receipt/invoice) which must be verified by the seller or GearUp administration before order processing begins.
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </section>

                            <section>
                                <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">05</span>
                                    Limitation of Liability
                                </h2>
                                <p className="font-body text-lg text-slate-600 leading-relaxed">
                                    GearUp provides a platform for B2B transactions but does not guarantee the quality, safety, or legality of products listed. We are not liable for disputes between buyers and sellers, product defects, or delivery issues. Users are responsible for due diligence in business transactions.
                                </p>
                            </section>

                            <section className="pt-12 border-t border-slate-100">
                                <div className="bg-slate-900 rounded-3xl p-10 text-white">
                                    <h2 className="font-heading text-2xl font-bold mb-4">Legal Inquiry?</h2>
                                    <p className="font-body text-slate-400 mb-6">Our legal department is available for any clarifications regarding our terms.</p>
                                    <a href="mailto:legal@gearup.com" className="inline-block px-8 py-4 bg-emerald-600 text-white rounded-xl font-body font-bold hover:bg-emerald-500 transition-all">
                                        legal@gearup.com
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

export default Terms;
