"use client";

import React from 'react';
import { CheckCircle, Search, FileText, TrendingUp } from 'lucide-react';
import styles from './HowItWorks.module.css';

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

    return (
        <section id="how-it-works" className={styles.howItWorks}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className={styles.worksHeader}>
                    <h2 className="font-heading text-5xl font-bold text-primary-deep mb-4">
                        Professional Trade Lifecycle
                    </h2>
                    <p className="font-body text-xl text-neutral-600">
                        From verification to analytics—a complete workflow designed for serious B2B trade
                    </p>
                </div>

                {/* Lifecycle Timeline */}
                <div className="relative">
                    {/* Connection Line (Hidden on mobile) */}
                    <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-deep via-primary-navy to-primary-deep opacity-20"></div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {lifecycle.map((step, index) => {
                            const Icon = step.icon;
                            return (
                                <div key={index} className="relative">
                                    {/* Phase Number Badge */}
                                    <div className="flex justify-center mb-6">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-primary-deep/10 rounded-full blur-xl"></div>
                                            <div className="relative bg-primary-deep text-white w-16 h-16 rounded-full flex items-center justify-center font-heading text-2xl font-bold">
                                                {step.phase}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content Card */}
                                    <div className="bg-white border-2 border-neutral-200 rounded-2xl p-8 h-full hover:border-primary-navy hover:shadow-xl transition-all">
                                        <div className="mb-6">
                                            <div className="w-12 h-12 bg-primary-deep/10 rounded-xl flex items-center justify-center mb-4">
                                                <Icon className="text-primary-deep" size={24} />
                                            </div>
                                            <h3 className="font-heading text-2xl font-bold text-primary-deep mb-3">
                                                {step.title}
                                            </h3>
                                            <div className="inline-block px-3 py-1 bg-accent-orange/10 border border-accent-orange/20 rounded-full mb-4">
                                                <span className="font-body text-xs font-semibold text-accent-orange uppercase tracking-wide">
                                                    Outcome
                                                </span>
                                            </div>
                                            <p className="font-body font-semibold text-primary-deep mb-4">
                                                {step.outcome}
                                            </p>
                                        </div>
                                        <p className="font-body text-neutral-700 leading-relaxed">
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
