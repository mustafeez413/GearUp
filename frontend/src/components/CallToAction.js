"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import styles from './CallToAction.module.css';

const CallToAction = () => {
    return (
        <section className={styles.callToAction}>
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="bg-[#022c22] rounded-[2rem] md:rounded-[2.5rem] p-6 sm:p-10 md:p-16 lg:p-24 relative overflow-hidden text-center md:text-left">
                    {/* Background Glow */}
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/10 blur-[100px] rounded-full pointer-events-none -ml-32 -mb-32"></div>

                    <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="font-heading text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                                Ready to digitize your sports business?
                            </h2>
                            <p className="font-body text-xl text-slate-300 mb-10 leading-relaxed">
                                Join Pakistan's specialized B2B marketplace. Connect with top-tier manufacturers, streamline procurement, and access real-time market data.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                                <Link
                                    href="/register"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-xl text-lg font-bold hover:bg-emerald-500 transition-all shadow-lg hover:shadow-emerald-500/25"
                                >
                                    Create Business Account
                                    <ArrowRight size={20} />
                                </Link>
                                <Link
                                    href="/contact"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent border-2 border-white/20 text-white rounded-xl text-lg font-bold hover:bg-white/10 transition-all"
                                >
                                    Query Us
                                </Link>
                            </div>

                            <div className="mt-8 flex flex-col md:flex-row gap-6 text-sm text-slate-400 justify-center md:justify-start">
                                <div className="flex items-center gap-2">
                                    <Check size={16} className="text-emerald-500" />
                                    <span>Free for Wholesalers</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check size={16} className="text-emerald-500" />
                                    <span>Verified Suppliers Only</span>
                                </div>
                            </div>
                        </div>

                        {/* Visual Element (Mockup or Abstract) */}
                        <div className="hidden lg:block relative">
                            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="h-32 bg-emerald-900/20 rounded-xl animate-pulse"></div>
                                    <div className="h-32 bg-emerald-900/20 rounded-xl animate-pulse"></div>
                                    <div className="h-32 bg-emerald-900/20 rounded-xl animate-pulse"></div>
                                    <div className="h-32 bg-emerald-900/20 rounded-xl animate-pulse"></div>
                                </div>
                                <div className="mt-6 flex justify-between items-center bg-[#022c22] p-4 rounded-xl border border-emerald-500/20">
                                    <div className="w-1/3 h-4 bg-emerald-900/50 rounded"></div>
                                    <div className="w-1/3 h-10 bg-emerald-600 rounded-lg"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CallToAction;
