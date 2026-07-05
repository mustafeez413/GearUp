"use client";

import React from 'react';
import PublicLayout from '../../components/shared/PublicLayout';

const Cookies = () => {
    return (
        <PublicLayout>
            <div className="min-h-screen bg-neutral-50 pt-32 pb-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-3xl border border-slate-200 p-10 md:p-16 shadow-xl shadow-slate-200/50">
                        <h1 className="font-heading text-5xl font-black text-slate-900 mb-4 tracking-tighter">Cookie Policy</h1>
                        <p className="font-body text-slate-500 mb-12 font-medium">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

                        <div className="space-y-12">
                            <section>
                                <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">01</span>
                                    What Are Cookies
                                </h2>
                                <p className="font-body text-lg text-slate-600 leading-relaxed">
                                    Cookies are small text files stored on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and enabling certain platform features. They allow the server to identify your browser across pages.
                                </p>
                            </section>

                            <section>
                                <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">02</span>
                                    How We Use Cookies
                                </h2>
                                <div className="space-y-8 pl-11">
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                        <h3 className="font-heading text-xl font-bold text-slate-900 mb-2">Essential Cookies</h3>
                                        <p className="font-body text-slate-600 leading-relaxed font-medium">
                                            Necessary for the platform to function. Enable core features like authentication, security, and account management. Cannot be disabled.
                                        </p>
                                    </div>

                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                        <h3 className="font-heading text-xl font-bold text-slate-900 mb-2">Analytics Cookies</h3>
                                        <p className="font-body text-slate-600 leading-relaxed font-medium">
                                            Help us understand how users interact with our platform, improving functionality and user experience. Data is aggregated and anonymized.
                                        </p>
                                    </div>

                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                        <h3 className="font-heading text-xl font-bold text-slate-900 mb-2">Preference Cookies</h3>
                                        <p className="font-body text-slate-600 leading-relaxed font-medium">
                                            Remember your settings (language, display preferences) to personalize your experience on the platform.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">03</span>
                                    Managing Cookies
                                </h2>
                                <p className="font-body text-lg text-slate-600 leading-relaxed">
                                    You can control cookies through your browser settings. However, disabling certain cookies may limit your ability to use some features of the GearUp platform. Most browsers allow you to refuse or accept cookies, and delete existing cookies.
                                </p>
                            </section>

                            <section className="pt-12 border-t border-slate-100">
                                <div className="bg-slate-900 rounded-3xl p-10 text-white">
                                    <h2 className="font-heading text-2xl font-bold mb-4">Cookie Consent</h2>
                                    <p className="font-body text-slate-400 mb-6">When you first visit GearUp, we may ask for your consent to use non-essential cookies. You can modify your cookie preferences at any time through your account settings.</p>
                                    <a href="mailto:privacy@gearup.com" className="inline-block px-8 py-4 bg-emerald-600 text-white rounded-xl font-body font-bold hover:bg-emerald-500 transition-all font-medium">
                                        Manage Preferences
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

export default Cookies;
