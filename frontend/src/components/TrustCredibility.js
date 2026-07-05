"use client";

import React from 'react';
import { Shield, Clock, Award, Globe } from 'lucide-react';
import styles from './TrustCredibility.module.css';

const TrustCredibility = () => {
    const cards = [
        {
            icon: Shield,
            title: "Verified Suppliers",
            desc: "Every manufacturer undergoes a rigorous 5-step on-site verification process.",
            color: "text-blue-600",
            bg: "bg-blue-50"
        },
        {
            icon: Clock,
            title: "On-Time Guarantee",
            desc: "Smart contracts ensuring adherence to production timelines and shipment schedules.",
            color: "text-emerald-600",
            bg: "bg-emerald-50"
        },
        {
            icon: Award,
            title: "Quality Assured",
            desc: "Third-party quality inspections available at every stage of production.",
            color: "text-purple-600",
            bg: "bg-purple-50"
        },
        {
            icon: Globe,
            title: "Global Compliance",
            desc: "End-to-end documentation support for international trade regulations.",
            color: "text-orange-600",
            bg: "bg-orange-50"
        }
    ];

    return (
        <section className={styles.trustCredibility}>
            <div className="container mx-auto px-4 max-w-7xl">
                <div className={styles.trustHeader}>
                    <h2 className="font-heading text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                        Built for enterprise-grade trade.
                    </h2>
                    <p className="font-body text-xl text-slate-600">
                        Secure, transparent, and compliant. We've built the infrastructure so you can focus on scaling your business.
                    </p>
                </div>

                <div className={styles.trustGrid}>
                    {cards.map((item, idx) => {
                        const Icon = item.icon;
                        return (
                            <div key={idx} className={styles.trustCard}>
                                <div className={`w-14 h-14 ${item.bg} rounded-xl flex items-center justify-center mb-6`}>
                                    <Icon className={item.color} size={28} />
                                </div>
                                <h3 className="font-heading font-bold text-slate-900 text-xl mb-3">{item.title}</h3>
                                <p className="font-body text-slate-600 leading-relaxed">
                                    {item.desc}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default TrustCredibility;
