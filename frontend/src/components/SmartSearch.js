"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Sparkles, TrendingUp, CheckCircle, MapPin } from 'lucide-react';
import styles from './SmartSearch.module.css';

const SmartSearch = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const smartSuggestions = [
        { label: 'High Capacity', icon: TrendingUp, count: '50K+ units/month' },
        { label: 'Low MOQ', icon: CheckCircle, count: '<100 units' },
        { label: 'Sialkot Experts', icon: MapPin, count: '450+ suppliers' },
    ];

    return (
        <section className={styles.smartSearch}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12 max-w-3xl mx-auto">
                    <h2 className={styles.searchTitle}>
                        Trade Discovery
                    </h2>
                    <p className={styles.searchSubtitle}>
                        Find verified manufacturers and bulk products for cricket and football trade
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-neutral-500">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="font-body">Updated in real-time from Pakistan's manufacturing hubs</span>
                    </div>
                </div>

                {/* Intelligent Search */}
                <div className="max-w-4xl mx-auto mb-8">
                    <div className="relative">
                        <Search className="absolute right-6 top-1/2 transform -translate-y-1/2 text-neutral-400" size={24} />
                        <input
                            type="text"
                            placeholder="Search manufacturers, products, or production capabilities..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-6 pr-16 w-full py-5 text-lg border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-deep focus:border-transparent font-body shadow-sm hover:shadow-md transition-shadow outline-none"
                        />
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                            <Sparkles className="text-primary-deep/60" size={20} />
                        </div>
                    </div>
                </div>

                {/* Smart Suggestions */}
                <div className="max-w-4xl mx-auto mb-8">
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        <span className="font-body text-sm font-semibold text-neutral-600 uppercase tracking-wide">
                            Quick Discovery:
                        </span>
                        {smartSuggestions.map((suggestion, index) => {
                            const Icon = suggestion.icon;
                            return (
                                <Link
                                    key={index}
                                    href="/industries"
                                    className="group flex items-center gap-3 px-5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg hover:bg-primary-deep hover:border-primary-deep transition-all"
                                >
                                    <Icon className="text-primary-deep group-hover:text-white transition-colors" size={18} />
                                    <div className="text-left">
                                        <div className="font-body font-semibold text-primary-deep group-hover:text-white transition-colors">
                                            {suggestion.label}
                                        </div>
                                        <div className="font-body text-xs text-neutral-500 group-hover:text-white/80 transition-colors">
                                            {suggestion.count}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Trust Indicators */}
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-center gap-8 text-center flex-wrap">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="text-green-600" size={20} />
                            <span className="font-body text-sm font-medium text-neutral-700">
                                850+ Verified Suppliers
                            </span>
                        </div>
                        <div className="hidden md:block w-1 h-1 bg-neutral-300 rounded-full"></div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="text-green-600" size={20} />
                            <span className="font-body text-sm font-medium text-neutral-700">
                                Real-time Capacity Data
                            </span>
                        </div>
                        <div className="hidden md:block w-1 h-1 bg-neutral-300 rounded-full"></div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="text-green-600" size={20} />
                            <span className="font-body text-sm font-medium text-neutral-700">
                                Export-Ready Products
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SmartSearch;
