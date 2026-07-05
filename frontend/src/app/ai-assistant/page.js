"use client";

import React from 'react';
import Link from 'next/link';
import PublicLayout from '../../components/shared/PublicLayout';
import { Brain, CheckCircle, Clock, TrendingUp, FileText, ArrowRight, MessageSquare } from 'lucide-react';

const AIAssistant = () => {
    const capabilities = [
        {
            icon: FileText,
            title: 'Supplier Evaluation',
            description: 'Compare manufacturers by capacity, reliability, pricing, and export readiness to find optimal trade partners'
        },
        {
            icon: Clock,
            title: 'Delivery Timeline Analysis',
            description: 'Get accurate production and shipping estimates based on current supplier capacity and order volume'
        },
        {
            icon: TrendingUp,
            title: 'MOQ Optimization',
            description: 'Analyze order quantities to balance cost efficiency with inventory management and cash flow'
        },
        {
            icon: CheckCircle,
            title: 'Risk Assessment',
            description: 'Evaluate supplier track records, delivery performance, and identify potential supply chain risks'
        }
    ];

    return (
        <PublicLayout>
            <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50 pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="text-center mb-16 max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full mb-6">
                            <Brain className="text-emerald-600" size={20} />
                            <span className="font-body text-sm font-semibold text-emerald-700 uppercase tracking-wide">
                                AI Trade Advisor
                            </span>
                        </div>
                        <h1 className="font-heading text-5xl font-bold text-slate-900 mb-6 tracking-tight">
                            Intelligent Trade Decision Support
                        </h1>
                        <p className="font-body text-xl text-slate-600 leading-relaxed">
                            Make data-driven procurement decisions with AI-powered business intelligence for supplier evaluation, order optimization, and risk management
                        </p>
                    </div>

                    {/* Main Content */}
                    <div className="grid lg:grid-cols-2 gap-16 items-center mb-16">
                        {/* Left Column */}
                        <div>
                            <div className="mb-10">
                                <h2 className="font-heading text-3xl font-bold text-slate-900 mb-4">
                                    Business Intelligence, Not Just a Chatbot
                                </h2>
                                <p className="font-body text-lg text-slate-600 leading-relaxed mb-6">
                                    Our AI assistant helps you evaluate suppliers, optimize orders, and make strategic procurement decisions through actionable insights—not through conversational chat, but through structured business intelligence.
                                </p>
                            </div>

                            {/* Capabilities */}
                            <div className="space-y-4">
                                {capabilities.map((capability, index) => {
                                    const Icon = capability.icon;
                                    return (
                                        <div key={index} className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-emerald-500 hover:shadow-xl transition-all group">
                                            <div className="flex items-start gap-5">
                                                <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-600 transition-colors">
                                                    <Icon className="text-emerald-600 group-hover:text-white transition-colors" size={28} />
                                                </div>
                                                <div>
                                                    <h3 className="font-heading text-xl font-bold text-slate-900 mb-2">
                                                        {capability.title}
                                                    </h3>
                                                    <p className="font-body text-slate-600 leading-relaxed">
                                                        {capability.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-10">
                                <Link
                                    href="/chat"
                                    className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-body font-bold text-lg group shadow-lg hover:shadow-emerald-600/20 active:scale-[0.98]"
                                >
                                    Access AI Trade Advisor
                                    <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                                </Link>
                            </div>
                        </div>

                        {/* Right Column - Visual */}
                        <div className="bg-white rounded-3xl border border-slate-200 p-10 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full -mr-32 -mt-32"></div>

                            <div className="relative z-10 bg-slate-900 rounded-2xl p-8 text-white mb-8 border border-slate-800 shadow-xl">
                                <div className="flex items-center gap-5 mb-8">
                                    <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
                                        <Brain className="text-white" size={36} />
                                    </div>
                                    <div>
                                        <h3 className="font-heading text-2xl font-bold">GearUp Trade Advisor</h3>
                                        <p className="font-body text-slate-400">AI-Powered Intelligence</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {[
                                        { label: "Supplier Comparison Analysis", desc: "Compare 3+ suppliers by capacity, pricing, and reliability" },
                                        { label: "Order Optimization", desc: "Recommended MOQ based on volume pricing tiers" },
                                        { label: "Delivery Estimates", desc: "Production timeline analysis with capacity constraints" }
                                    ].map((item, idx) => (
                                        <div key={idx} className="p-5 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm hover:border-emerald-500/50 transition-colors">
                                            <div className="font-body font-bold text-lg mb-1">{item.label}</div>
                                            <div className="font-body text-sm text-slate-400">{item.desc}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <CheckCircle className="text-emerald-600" size={20} />
                                <span className="font-body font-medium">Real-time data analysis with live supplier capacity</span>
                            </div>
                        </div>
                    </div>

                    {/* Use Cases */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-12 shadow-sm">
                        <h2 className="font-heading text-3xl font-bold text-slate-900 mb-10 text-center">
                            Common Use Cases
                        </h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                { icon: MessageSquare, title: "Supplier Discovery", desc: "Find suppliers matching your specific requirements for capacity, location, and certifications" },
                                { icon: TrendingUp, title: "Price Optimization", desc: "Analyze pricing tiers to optimize order quantities for maximum cost efficiency" },
                                { icon: Clock, title: "Timeline Planning", desc: "Get accurate delivery estimates considering production capacity and shipping logistics" }
                            ].map((item, idx) => (
                                <div key={idx} className="p-8 bg-slate-50 rounded-2xl border border-transparent hover:border-emerald-100 transition-all">
                                    <item.icon className="text-emerald-600 mb-5" size={40} />
                                    <h3 className="font-heading text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                                    <p className="font-body text-slate-600 leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
};

export default AIAssistant;
