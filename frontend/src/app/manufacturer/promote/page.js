"use client";

import React, { useState, useMemo } from 'react';
import { 
    Sparkles, Target, Megaphone, Eye, MessageSquare, Banknote, 
    CheckCircle2, Upload, ChevronRight, ShoppingBag, Search, 
    ArrowUpRight, Landmark, ArrowLeft, ShieldCheck, BadgeInfo, HelpCircle,
    ChevronDown, ChevronUp, BarChart3, Pencil, Trash2, Coins, Lock, Clock
} from 'lucide-react';
import Card from '@/components/common/Card';
import { formatPKR } from '@/lib/financeUtils';

const PROMOTION_TYPES = [
    {
        id: 'hero',
        title: 'Homepage Banner',
        icon: Megaphone,
        desc: 'Place your factory at the absolute top of the homepage hero slider.',
        pricing: 49999,
        duration: '30 Days',
        reach: 'High (All visiting wholesalers)',
        badge: 'Maximum Reach'
    },
    {
        id: 'featured',
        title: 'Featured Exporter',
        icon: Sparkles,
        desc: 'Stand out in the Netflix-style exporter track with a gold star badge.',
        pricing: 24999,
        duration: '30 Days',
        reach: 'Targeted (Buyers browsing suppliers)',
        badge: 'Best Value'
    },
    {
        id: 'grid',
        title: 'Sponsored Product',
        icon: ShoppingBag,
        desc: 'Boost your cricket bat/ball to appear prominent in bulk deals.',
        pricing: 14999,
        duration: '14 Days',
        reach: 'High Conversion (Ready-to-buy wholesalers)',
        badge: 'Popular'
    },
    {
        id: 'search',
        title: 'Search Boost',
        icon: Search,
        desc: 'Appear at the very top of search results when buyers look for your items.',
        pricing: 9999,
        duration: '14 Days',
        reach: 'Direct Intent (Buyers searching keywords)',
        badge: 'Frictionless'
    }
];

const INITIAL_PROMOTIONS = [
    { 
        id: 'promo-101', 
        name: 'Daska Willow Bat Boost', 
        placement: 'Homepage Banner', 
        status: 'Live', 
        views: 24800, 
        inquiries: 180,
        category: 'Cricket Equipment',
        ctaText: 'Request Catalog',
        duration: '30 Days',
        viewsGrowth: '+14%',
        interestBadge: '🔥 High Interest'
    },
    { 
        id: 'promo-102', 
        name: 'Specialist Red Leather Balls', 
        placement: 'Sponsored Product', 
        status: 'Pending Approval', 
        views: 0, 
        inquiries: 0,
        category: 'Cricket Equipment',
        ctaText: 'Inquire Price',
        duration: '14 Days',
        viewsGrowth: '+0%',
        interestBadge: '⏳ Under Review'
    },
    { 
        id: 'promo-103', 
        name: 'Winter Kits Discount', 
        placement: 'Search Boost', 
        status: 'Expired', 
        views: 8200, 
        inquiries: 48,
        category: 'Sports Kits & Wear',
        ctaText: 'View Deals',
        duration: '14 Days',
        viewsGrowth: '+4%',
        interestBadge: 'Completed'
    }
];

export default function ManufacturerPromotePage() {
    const [step, setStep] = useState(1);
    const [selectedType, setSelectedType] = useState('hero');
    const [paymentMethod, setPaymentMethod] = useState('easypaisa');
    const [campaignForm, setCampaignForm] = useState({
        name: 'My Elite Sports Campaign',
        productName: 'Professional Handcrafted English Willow Bats',
        tagline: 'Sialkot\'s finest Grade-A cricket bat exporters.',
        duration: 30,
        targetCategory: 'cricket',
        ctaText: 'Request Quote'
    });

    const [uploadedBanner, setUploadedBanner] = useState(null);
    const [promotions, setPromotions] = useState(INITIAL_PROMOTIONS);
    const [launching, setLaunching] = useState(false);
    const [expandedPromoId, setExpandedPromoId] = useState(null);

    const handleInputChange = (key, value) => {
        setCampaignForm(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleUploadClick = () => {
        setUploadedBanner('daska_willow_premium.png');
    };

    const activeTypeDetails = useMemo(() => {
        return PROMOTION_TYPES.find(t => t.id === selectedType);
    }, [selectedType]);

    const handlePaymentSubmit = () => {
        setLaunching(true);
        setTimeout(() => {
            const newPromo = {
                id: `promo-${Math.floor(Math.random() * 100) + 200}`,
                name: campaignForm.name,
                placement: activeTypeDetails.title,
                status: 'Pending Approval',
                views: 0,
                inquiries: 0,
                category: campaignForm.targetCategory === 'cricket' ? 'Cricket Equipment' : campaignForm.targetCategory === 'football' ? 'Football Equipment' : 'Sports Accessories',
                ctaText: campaignForm.ctaText || 'Request Quote',
                duration: `${activeTypeDetails.duration}`,
                viewsGrowth: '+0%',
                interestBadge: '⏳ Under Review'
            };
            setPromotions(prev => [newPromo, ...prev]);
            setLaunching(false);
            setStep(4); // Advance to Admin Approval Timeline state
        }, 2500);
    };

    const toggleRow = (id) => {
        setExpandedPromoId(prev => prev === id ? null : id);
    };

    const handleDeletePromo = (id, e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to stop this promotion?')) {
            setPromotions(prev => prev.filter(p => p.id !== id));
        }
    };

    // Calculate simplified total numbers for the cards
    const stats = useMemo(() => {
        let totalViews = 0;
        let totalInquiries = 0;
        promotions.forEach(p => {
            totalViews += p.views;
            totalInquiries += p.inquiries;
        });
        const activeCount = promotions.filter(p => p.status === 'Live').length;
        return {
            active: activeCount,
            views: totalViews.toLocaleString(),
            inquiries: totalInquiries.toLocaleString(),
            spend: 84997
        };
    }, [promotions]);

    return (
        <div className="relative min-h-screen bg-slate-50/50 pb-16 overflow-hidden select-none animate-in fade-in duration-300">
            {/* Soft Radials Glows for ambient SaaS backdrop */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#00C26E]/3 rounded-full filter blur-[120px] pointer-events-none z-0"></div>
            <div className="absolute bottom-[20%] left-[-10%] w-[400px] h-[400px] bg-blue-500/2 rounded-full filter blur-[100px] pointer-events-none z-0"></div>

            <div className="relative z-10 space-y-8 max-w-6xl mx-auto px-4 sm:px-6">
                
                {/* Header */}
                <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-3xl font-black text-slate-900 tracking-tight leading-none flex items-center gap-2">
                            <Megaphone className="text-[#00C26E]" size={28} /> B2B Sourcing Promotion Center
                        </h1>
                        <p className="font-body text-slate-550 font-medium text-xs sm:text-sm mt-1">
                            Promote your sports manufacturing factory and catalog items to bulk wholesalers in less than 2 minutes.
                        </p>
                    </div>
                </div>

                {/* USER-FRIENDLY COMPACT STAT CARDS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Live Promotions', value: stats.active, icon: Sparkles, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                        { label: 'Total Buyer Views', value: stats.views, icon: Eye, color: 'text-blue-600 bg-blue-50 border-blue-100' },
                        { label: 'Wholesaler Inquiries', value: stats.inquiries, icon: MessageSquare, color: 'text-purple-600 bg-purple-50 border-purple-100' },
                        { label: 'Sourcing Spend', value: stats.spend, icon: Banknote, color: 'text-amber-600 bg-amber-50 border-amber-100' }
                    ].map((stat, i) => {
                        const StatIcon = stat.icon;
                        return (
                            <div key={i} className="bg-white border border-slate-200/60 p-4 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.01)] hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-3.5">
                                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${stat.color}`}>
                                    <StatIcon size={14} className="stroke-[2.5]" />
                                </div>
                                <div className="min-w-0">
                                    <span className="font-body font-bold text-slate-450 text-[9px] uppercase tracking-widest block leading-none">{stat.label}</span>
                                    <span className="font-heading text-lg font-black text-slate-900 tracking-tight mt-1 block leading-none">{stat.label === 'Sourcing Spend' ? formatPKR(stat.value) : stat.value}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* 5-STEP GUIDED TIMELINE PROGRESS BAR */}
                <div className="bg-white border border-slate-200/60 p-4 rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                    <div className="grid grid-cols-5 gap-2 items-center">
                        {[
                            { stepNum: 1, label: 'Choose Spot', desc: 'Select Placement' },
                            { stepNum: 2, label: 'Design Promotion', desc: 'Customize Ad' },
                            { stepNum: 3, label: 'Review & Pay', desc: 'SaaS Invoice' },
                            { stepNum: 4, label: 'Admin Approval', desc: 'Trade Vetting' },
                            { stepNum: 5, label: 'Go Live', desc: 'Wholesaler Grid' }
                        ].map((s, idx) => {
                            const isActive = step === s.stepNum;
                            const isCompleted = step > s.stepNum || (step === 4 && s.stepNum === 4);
                            return (
                                <div key={idx} className="flex flex-col items-center text-center relative">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-heading font-black text-[10px] transition-all border ${
                                        isActive 
                                            ? 'bg-[#00C26E] text-slate-950 border-[#00C26E] shadow-[0_0_15px_rgba(0,194,110,0.25)]'
                                            : isCompleted 
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                                : 'bg-slate-100 text-slate-400 border-slate-200'
                                    }`}>
                                        {isCompleted && s.stepNum < 4 ? '✓' : s.stepNum}
                                    </div>
                                    <span className={`font-heading font-black text-[9.5px] tracking-tight mt-2 block ${isActive ? 'text-[#00C26E]' : isCompleted ? 'text-slate-700' : 'text-slate-400'}`}>
                                        {s.label}
                                    </span>
                                    <span className="font-body text-[8px] text-slate-400 font-bold block mt-0.5 leading-none uppercase">
                                        {s.desc}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 3-STEP SINGLE WORKFLOW GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left Column: Promotion Setup steps (7 Cols) */}
                    <div className="lg:col-span-7 space-y-6">
                        
                        {step === 1 && (
                            <div className="space-y-4 animate-in fade-in duration-300">
                                <h3 className="font-heading font-black text-slate-900 text-base tracking-tight leading-none">Step 1 — Where do you want to show your business?</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {PROMOTION_TYPES.map((type) => {
                                        const CardIcon = type.icon;
                                        return (
                                            <div
                                                key={type.id}
                                                onClick={() => setSelectedType(type.id)}
                                                className={`bg-white border rounded-2xl p-4 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 relative group flex flex-col justify-between min-h-[160px] ${
                                                    selectedType === type.id
                                                        ? 'border-[#00C26E] bg-emerald-500/5 shadow-[0_4px_20px_rgba(0,194,110,0.05)]'
                                                        : 'border-slate-200/60'
                                                }`}
                                            >
                                                <span className="absolute top-3 right-3 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-mono text-[7px] font-black uppercase tracking-wider">
                                                    {type.badge}
                                                </span>
                                                <div>
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                                        selectedType === type.id
                                                            ? 'bg-emerald-50 text-slate-950'
                                                            : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        <CardIcon size={14} className="stroke-[2.5]" />
                                                    </div>
                                                    <h4 className="font-heading font-black text-slate-800 text-xs tracking-tight mt-2.5 leading-none">{type.title}</h4>
                                                    <p className="font-body text-[10.5px] text-slate-400 leading-normal mt-1.5 line-clamp-2">
                                                        {type.desc}
                                                    </p>
                                                </div>
                                                <div className="flex items-center justify-between border-t border-slate-100/80 mt-3 pt-2">
                                                    <span className="font-heading font-black text-slate-900 text-xs">{formatPKR(type.pricing)}</span>
                                                    <span className="font-body text-[9px] text-slate-400 font-bold uppercase">{type.duration}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="w-full py-2.5 bg-slate-900 hover:bg-[#00C26E] hover:text-slate-950 text-white font-body font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                                >
                                    Customize Promotion Details <ChevronRight size={10} className="stroke-[3]" />
                                </button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.01)] space-y-5 animate-in fade-in duration-300">
                                <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100">
                                    <h3 className="font-heading font-black text-slate-900 text-sm tracking-tight">Step 2 — Design Your Promotion</h3>
                                    <button
                                        onClick={() => setStep(1)}
                                        className="inline-flex items-center gap-1 text-[9px] font-body font-black text-slate-450 uppercase tracking-widest hover:text-slate-950 transition-colors"
                                    >
                                        <ArrowLeft size={10} /> Back
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="font-body text-[9.5px] font-black text-slate-400 uppercase tracking-widest block mb-1">Factory Name / Title</label>
                                        <span className="font-body text-[8.5px] text-slate-400 block mb-1.5">Official manufacturer name shown to global trade buyers.</span>
                                        <input
                                            type="text"
                                            value={campaignForm.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-xs font-body text-slate-900 font-bold"
                                            placeholder="e.g. Sialkot English Willow Factory"
                                        />
                                    </div>

                                    <div>
                                        <label className="font-body text-[9.5px] font-black text-slate-400 uppercase tracking-widest block mb-1">Promoted Item Name</label>
                                        <span className="font-body text-[8.5px] text-slate-400 block mb-1.5">Highlight your top cricket bat, match ball, or active kits.</span>
                                        <input
                                            type="text"
                                            value={campaignForm.productName}
                                            onChange={(e) => handleInputChange('productName', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-xs font-body text-slate-900 font-bold"
                                            placeholder="e.g. Premium Match Cricket Bats"
                                        />
                                    </div>

                                    <div>
                                        <label className="font-body text-[9.5px] font-black text-slate-400 uppercase tracking-widest block mb-1">Short Buyer Tagline</label>
                                        <span className="font-body text-[8.5px] text-slate-400 block mb-1.5">Brief one-sentence business pitch detailing exports or bulk capabilities.</span>
                                        <input
                                            type="text"
                                            value={campaignForm.tagline}
                                            onChange={(e) => handleInputChange('tagline', e.target.value)}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-xs font-body text-slate-900 font-bold"
                                            placeholder="e.g. Top export-grade cricket bat manufacturers in Sialkot."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="font-body text-[9.5px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Target Category</label>
                                            <select
                                                value={campaignForm.targetCategory}
                                                onChange={(e) => handleInputChange('targetCategory', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-xs font-body text-slate-900 font-bold"
                                            >
                                                <option value="cricket">Cricket Equipment</option>
                                                <option value="football">Football Equipment</option>
                                                <option value="accessories">Sports Kits & Wear</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="font-body text-[9.5px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Button Action Text</label>
                                            <input
                                                type="text"
                                                value={campaignForm.ctaText}
                                                onChange={(e) => handleInputChange('ctaText', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-xs font-body text-slate-900 font-bold"
                                                placeholder="e.g. Request Quote"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="font-body text-[9.5px] font-black text-slate-400 uppercase tracking-widest block mb-1">Promotion Photo / Banner</label>
                                        <div
                                            onClick={handleUploadClick}
                                            className="border-2 border-dashed border-slate-200 hover:border-emerald-500/60 rounded-2xl p-5 text-center cursor-pointer hover:bg-slate-50/50 transition-all flex flex-col items-center justify-center gap-1.5"
                                        >
                                            <Upload size={20} className="text-slate-400" />
                                            <span className="font-body text-xs text-slate-500 font-bold block leading-none">
                                                {uploadedBanner ? `Selected: ${uploadedBanner}` : 'Click to select ad picture'}
                                            </span>
                                            <span className="text-[8.5px] font-mono text-slate-400 uppercase tracking-wider block">PNG or JPG, up to 5MB</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setStep(3)}
                                    className="w-full py-2.5 bg-slate-900 hover:bg-[#00C26E] hover:text-slate-950 text-white font-body font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                                >
                                    Proceed to Review & Payment <ChevronRight size={10} className="stroke-[3]" />
                                </button>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.01)] space-y-6 animate-in fade-in duration-300">
                                <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100">
                                    <h3 className="font-heading font-black text-slate-900 text-sm tracking-tight">Step 3 — Review Promotion Billing</h3>
                                    <button
                                        onClick={() => setStep(2)}
                                        className="inline-flex items-center gap-1 text-[9px] font-body font-black text-slate-450 uppercase tracking-widest hover:text-slate-950 transition-colors"
                                    >
                                        <ArrowLeft size={10} /> Back
                                    </button>
                                </div>

                                {/* Invoice-style summary card */}
                                <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-5 space-y-4 shadow-sm">
                                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                                        <div className="space-y-1">
                                            <span className="font-heading font-black text-slate-800 text-xs tracking-tight">{activeTypeDetails.title} Placement</span>
                                            <span className="font-body text-[9px] text-slate-400 font-bold uppercase block leading-none">B2B Discovery Channels</span>
                                        </div>
                                        <span className="px-2.5 py-1 rounded bg-[#00C26E]/10 border border-[#00C26E]/20 text-[#00C26E] font-mono text-[8px] font-black uppercase">
                                            {activeTypeDetails.duration}
                                        </span>
                                    </div>

                                    <div className="space-y-2.5 font-body text-xs text-slate-600 font-bold">
                                        <div className="flex justify-between">
                                            <span>Promotion Type:</span>
                                            <span className="text-slate-900 uppercase font-black text-[10px]">{activeTypeDetails.title}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Subtotal Base Rate:</span>
                                            <span className="text-slate-950 font-mono">{formatPKR(activeTypeDetails.pricing)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Sourcing Platform Tax (5%):</span>
                                            <span className="text-slate-500 font-mono">
                                                {formatPKR(activeTypeDetails.pricing * 0.05)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center border-t border-slate-200/80 pt-3 text-slate-900 font-heading">
                                        <span className="text-xs font-black uppercase tracking-wider">Total Ad Price:</span>
                                        <span className="text-base font-black text-[#00C26E] font-mono">
                                            {formatPKR(activeTypeDetails.pricing * 1.05)}
                                        </span>
                                    </div>
                                </div>

                                {/* PREMIUM PAKISTANI PAYMENT METHODS SELECTOR */}
                                <div className="space-y-3">
                                    <label className="font-body text-[9.5px] font-black text-slate-400 uppercase tracking-widest block leading-none">Select Payment Method (Pakistan Trade channels)</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { id: 'easypaisa', title: 'Easypaisa', label: 'Mobile Wallet', icon: '🟢' },
                                            { id: 'jazzcash', title: 'JazzCash', label: 'Mobile Wallet', icon: '🟡' },
                                            { id: 'bank', title: 'Bank Transfer', label: 'Local Settlements', icon: '🏦' },
                                            { id: 'stripe', title: 'Debit/Credit Card', label: 'Instant Settlement', icon: '💳' }
                                        ].map((method) => {
                                            const isSelected = paymentMethod === method.id;
                                            return (
                                                <div
                                                    key={method.id}
                                                    onClick={() => setPaymentMethod(method.id)}
                                                    className={`bg-white border rounded-2xl p-3.5 cursor-pointer transition-all hover:bg-slate-50 flex items-start gap-3 select-none ${
                                                        isSelected 
                                                            ? 'border-[#00C26E] bg-emerald-500/5 shadow-[0_4px_15px_rgba(0,194,110,0.04)]'
                                                            : 'border-slate-250'
                                                    }`}
                                                >
                                                    <span className="text-lg shrink-0 mt-0.5">{method.icon}</span>
                                                    <div className="min-w-0">
                                                        <span className="font-heading font-black text-slate-800 text-xs block leading-none">{method.title}</span>
                                                        <span className="font-body text-[8.5px] text-slate-400 font-bold block mt-1 leading-none uppercase">{method.label}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Trust Warning Badge */}
                                <div className="rounded-xl bg-slate-950 p-4 text-[10px] font-body text-slate-350 leading-relaxed flex items-start gap-2.5">
                                    <BadgeInfo size={14} className="text-[#00C26E] shrink-0 mt-0.5" />
                                    <div>
                                        <strong>Vetted Approval Process:</strong> All advertisements are manually reviewed before publishing to maintain marketplace quality and wholesaler trust. Publishing takes 1-2 hours after auditing.
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    disabled={launching}
                                    onClick={handlePaymentSubmit}
                                    className="w-full py-3 bg-[#00C26E] hover:bg-[#009E58] text-slate-950 font-body font-black text-[10.5px] uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
                                >
                                    {launching ? 'Processing Sourcing Plan...' : 'Pay & Launch Promotion'} <ArrowUpRight size={13} className="stroke-[3]" />
                                </button>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.01)] space-y-6 animate-in fade-in duration-300">
                                <div className="py-8 text-center space-y-5">
                                    <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600 shadow-md animate-bounce">
                                        <CheckCircle2 size={28} className="stroke-[2.5]" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-heading text-lg font-black text-slate-900 tracking-tight">
                                            Payment Submitted Successfully!
                                        </h3>
                                        <span className="font-body text-[9.5px] text-slate-400 font-bold uppercase tracking-widest block">
                                            Campaign ID: GP-{Math.floor(Math.random() * 9000) + 1000}
                                        </span>
                                    </div>
                                </div>

                                {/* ADMIN APPROVAL STATE PROGRESS TRACKER */}
                                <div className="rounded-2xl border border-slate-150 bg-slate-50 p-5 space-y-4">
                                    <span className="font-heading font-black text-slate-800 text-xs block tracking-tight mb-2">Campaign Verification Status</span>
                                    
                                    <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 z-10">
                                        {[
                                            { label: 'Payment Completed', desc: `Settled via ${paymentMethod.toUpperCase()}`, completed: true },
                                            { label: 'Campaign Registered', desc: 'Dispatched to pending review queues', completed: true },
                                            { label: 'Under Review by Admin', desc: 'Verifying factory assets & Sialkot export profile', active: true },
                                            { label: 'Going Live Soon', desc: 'Visible directly inside Wholesaler marketplace deals' }
                                        ].map((t, idx) => (
                                            <div key={idx} className="flex items-start gap-4 pl-1">
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border text-[9px] font-heading font-black transition-all ${
                                                    t.completed 
                                                        ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                                                        : t.active 
                                                            ? 'bg-blue-500 text-white border-blue-500 animate-pulse'
                                                            : 'bg-white text-slate-400 border-slate-200'
                                                }`}>
                                                    {t.completed ? '✓' : idx + 1}
                                                </div>
                                                <div className="min-w-0">
                                                    <span className={`font-heading font-black text-[11px] block ${t.completed ? 'text-slate-800' : t.active ? 'text-blue-600' : 'text-slate-400'}`}>
                                                        {t.label}
                                                    </span>
                                                    <span className="font-body text-[9.5px] text-slate-450 block mt-0.5 leading-none">
                                                        {t.desc}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex items-start gap-3">
                                    <span className="text-base mt-0.5">⏳</span>
                                    <div className="space-y-1">
                                        <span className="font-heading font-black text-slate-900 text-xs block">Estimated approval time: 1-2 hours</span>
                                        <span className="font-body text-[10.5px] text-slate-550 leading-relaxed block">
                                            Platform administrators are currently vetting Sialkot region active listings. Sourcing campaigns secure manual review before publishing to maximize global trade trust.
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => { setStep(1); }}
                                    className="w-full py-2.5 bg-slate-900 hover:bg-[#00C26E] hover:text-slate-950 text-white font-body font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                                >
                                    Done & Create Another Campaign
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Live Mobile Mockup Preview (5 Cols) */}
                    <div className="lg:col-span-5 relative lg:sticky lg:top-28">
                        <div className="bg-slate-950 rounded-[32px] p-3.5 border-4 border-slate-900 shadow-2xl relative overflow-hidden flex flex-col">
                            {/* Camera notch sim */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-900 rounded-b-xl z-30 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                            </div>
                            
                            <div className="bg-slate-900 rounded-[22px] p-5 space-y-4 min-h-[300px] flex flex-col justify-between">
                                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mt-2">
                                    <span className="font-mono text-[8px] text-slate-500 uppercase tracking-widest font-bold">Wholesaler Live Mockup</span>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[7px] font-black uppercase">
                                        active preview
                                    </span>
                                </div>

                                {selectedType === 'hero' && (
                                    <div className="bg-gradient-to-br from-slate-950 via-[#0B2C1A] to-slate-950 rounded-2xl p-5 border border-slate-850 relative overflow-hidden min-h-[170px] flex flex-col justify-between">
                                        <div>
                                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono text-[7px] font-bold uppercase tracking-wider">
                                                <Sparkles size={6} /> PROMOTED EXPORTER
                                            </div>
                                            <h4 className="font-heading font-black text-white text-base tracking-tight mt-1.5 leading-none">
                                                {campaignForm.productName || 'Handcrafted English Willow Bats'}
                                            </h4>
                                            <p className="font-body text-[10.5px] text-slate-350 leading-relaxed mt-1.5">
                                                {campaignForm.tagline || 'Premium bats made directly in Sialkot factories.'}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/80">
                                            <div className="text-[8px] font-body text-slate-455 font-bold uppercase">MOQ: 50 units</div>
                                            <button className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-950 font-body font-black text-[8px] uppercase tracking-wider rounded-lg transition-all">
                                                {campaignForm.ctaText || 'Request Quote'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {selectedType === 'featured' && (
                                    <div className="bg-gradient-to-r from-slate-950 to-slate-900 rounded-2xl p-4 border border-slate-800 flex flex-col justify-between min-h-[160px] relative overflow-hidden">
                                        <div className="absolute top-3 right-3 text-emerald-500">
                                            <Sparkles size={16} className="animate-pulse" />
                                        </div>
                                        <div>
                                            <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[7px] font-bold uppercase tracking-wider">
                                                VERIFIED FEATURED EXPORTER
                                            </span>
                                            <h4 className="font-heading font-black text-white text-xs tracking-tight mt-2 leading-none">
                                                {campaignForm.name || 'Daska Bat Mills'}
                                            </h4>
                                            <p className="font-body text-[10px] text-slate-400 leading-normal mt-1.5">
                                                {campaignForm.tagline || 'Leading cricket manufacturing exporters.'}
                                            </p>
                                        </div>
                                        <div className="flex justify-between items-center border-t border-slate-800/80 pt-2.5 mt-2">
                                            <span className="text-[8px] font-body text-slate-400 font-bold uppercase">Sialkot Region</span>
                                            <span className="text-[#00C26E] text-[9px] font-bold">⭐ 4.9 Supplier</span>
                                        </div>
                                    </div>
                                )}

                                {selectedType === 'grid' && (
                                    <div className="bg-white rounded-2xl border border-slate-250 p-4 shadow-sm flex flex-col justify-between min-h-[170px] relative">
                                        <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-emerald-650 text-white font-mono text-[7px] font-black uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                                            <Sparkles size={6} /> SPONSORED
                                        </span>
                                        <div className="h-16 bg-slate-50 border-b border-slate-100 rounded-lg flex items-center justify-center text-3xl">
                                            🏏
                                        </div>
                                        <div className="mt-2.5">
                                            <h4 className="font-heading font-black text-slate-850 text-xs leading-none line-clamp-1">
                                                {campaignForm.productName || 'Professional English Willow'}
                                            </h4>
                                            <p className="font-body text-[9px] text-slate-400 mt-1 uppercase font-bold leading-none">
                                                🏭 {campaignForm.name || 'Daska Bat Mills'}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between border-t border-slate-100 mt-2.5 pt-2">
                                            <span className="font-heading font-black text-slate-900 text-xs">{formatPKR(14500)}</span>
                                            <span className="font-body text-[9px] text-slate-400 font-bold">MOQ: 50</span>
                                        </div>
                                    </div>
                                )}

                                {selectedType === 'search' && (
                                    <div className="bg-white border border-slate-205 p-4 rounded-xl flex items-start gap-3 relative overflow-hidden min-h-[100px]">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                                            <Search size={14} className="stroke-[2.5]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-mono text-[7px] font-black uppercase tracking-wider">
                                                TOP SEARCH MATCH
                                            </span>
                                            <h4 className="font-heading font-black text-slate-850 text-xs tracking-tight mt-1.5 leading-none">
                                                {campaignForm.name || 'Daska English Willow Factory'}
                                            </h4>
                                            <p className="font-body text-[10px] text-slate-500 leading-relaxed mt-1 line-clamp-1">
                                                {campaignForm.tagline || 'Leading cricket bat suppliers.'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="rounded-xl bg-slate-950 p-3.5 text-[9px] font-body text-slate-400 leading-normal flex items-start gap-2 border border-slate-850">
                                    <BadgeInfo size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                                    <div>
                                        <strong>Frictionless Promotion Setup:</strong> Adjust form details in step 2. The live layout on the mobile simulator instantly reflects modifications.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SIMPLE MINIMAL ACTIVE PROMOTIONS CUSTOM LEDGER CARD-TABLE HYBRID */}
                <div id="active-promos-ledger" className="w-full">
                    <div className="bg-white border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.01)] rounded-3xl overflow-hidden">
                        
                        {/* Table Header Details */}
                        <div className="px-6 py-5 border-b border-slate-100">
                            <h3 className="font-heading font-black text-slate-900 text-base tracking-tight flex items-center gap-2">
                                <Sparkles className="text-[#00C26E]" size={16} /> Your Active Campaigns
                            </h3>
                            <p className="font-body text-slate-450 font-bold text-[9px] uppercase tracking-widest leading-none mt-1">
                                Vetted active promotional spaces on the GearUp wholesaler marketplace
                            </p>
                        </div>

                        {promotions.length === 0 ? (
                            <div className="p-12 text-center space-y-3">
                                <span className="text-4xl">📦</span>
                                <h4 className="font-heading font-black text-slate-800 text-sm">No Active Campaigns</h4>
                                <p className="font-body text-xs text-slate-400 max-w-[280px] mx-auto">
                                    Promote your factory to start receiving targeted trade inquiries from bulk buyers.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {promotions.map((promo) => {
                                    const isExpanded = expandedPromoId === promo.id;
                                    return (
                                        <div key={promo.id} className="transition-all">
                                            {/* Row Header wrapper with left border glows */}
                                            <div 
                                                onClick={() => toggleRow(promo.id)}
                                                className="group relative hover:bg-slate-50/50 p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all"
                                            >
                                                {/* Left animated emerald accent bar on hover */}
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00C26E] rounded-r-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                
                                                {/* Promotion Title & Image Thumbnail */}
                                                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${
                                                        promo.name.toLowerCase().includes('bat') 
                                                            ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                                                            : promo.name.toLowerCase().includes('ball') 
                                                                ? 'bg-blue-50 border-blue-100 text-blue-600' 
                                                                : 'bg-purple-50 border-purple-100 text-purple-600'
                                                    }`}>
                                                        <span className="text-base">
                                                            {promo.name.toLowerCase().includes('bat') ? '🏏' : promo.name.toLowerCase().includes('ball') ? '🔴' : '📦'}
                                                        </span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="font-heading font-black text-slate-855 text-xs sm:text-sm block tracking-tight truncate">
                                                            {promo.name}
                                                        </span>
                                                        <span className="font-body text-[9.5px] text-slate-400 font-bold uppercase tracking-wider block mt-1">
                                                            {promo.placement} • {promo.duration || '30 Days'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Metrics Columns */}
                                                <div className="flex items-center gap-6 sm:gap-10 shrink-0 flex-wrap">
                                                    {/* Campaign status indicator */}
                                                    <div className="min-w-[100px]">
                                                        {promo.status === 'Live' ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 font-mono text-[8px] font-black uppercase tracking-wider">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-[#00C26E] animate-pulse"></span>
                                                                Live
                                                            </span>
                                                        ) : promo.status === 'Pending Approval' ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 font-mono text-[8px] font-black uppercase tracking-wider animate-pulse">
                                                                Under Review
                                                            </span>
                                                        ) : promo.status === 'Expired' ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-500 font-mono text-[8px] font-black uppercase tracking-wider">
                                                                Expired
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-600 font-mono text-[8px] font-black uppercase tracking-wider">
                                                                Draft
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Views metric */}
                                                    <div className="min-w-[80px]">
                                                        <span className="font-heading font-black text-slate-850 text-xs sm:text-sm block leading-none">
                                                            {promo.views.toLocaleString()}
                                                        </span>
                                                        <span className="font-body text-[9px] text-emerald-600 font-black tracking-wide block mt-1 uppercase">
                                                            ↗ {promo.viewsGrowth || '+12%'} Views
                                                        </span>
                                                    </div>

                                                    {/* Inquiries metric */}
                                                    <div className="min-w-[90px]">
                                                        <span className="font-heading font-black text-[#00C26E] text-xs sm:text-sm block leading-none">
                                                            {promo.inquiries.toLocaleString()}
                                                        </span>
                                                        <span className="font-body text-[9px] text-purple-600 font-black tracking-wide block mt-1 uppercase">
                                                            {promo.inquiries > 50 ? '🔥 High interest' : '⚡ Stable Demand'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Ghost Buttons Action Bar */}
                                                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                                                    <button 
                                                        type="button" 
                                                        onClick={(e) => { e.stopPropagation(); toggleRow(promo.id); }}
                                                        className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-all"
                                                        title="Analytics Details"
                                                    >
                                                        <BarChart3 size={12} />
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        onClick={(e) => { e.stopPropagation(); alert('Loading campaign editor details...'); }}
                                                        className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-all"
                                                        title="Edit Campaign"
                                                    >
                                                        <Pencil size={11} />
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        onClick={(e) => handleDeletePromo(promo.id, e)}
                                                        className="w-7 h-7 rounded-lg border border-red-100 hover:bg-red-50 text-red-500 flex items-center justify-center transition-all"
                                                        title="Delete Campaign"
                                                    >
                                                        <Trash2 size={11} />
                                                    </button>
                                                    <div className="text-slate-400 ml-1">
                                                        {isExpanded ? <ChevronUp size={14} className="stroke-[2.5]" /> : <ChevronDown size={14} className="stroke-[2.5]" />}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expandable detail drawer */}
                                            {isExpanded && (
                                                <div className="bg-slate-50/80 border-t border-slate-100 p-5 space-y-4 font-body text-xs text-slate-600 animate-in slide-in-from-top duration-300">
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                                        <div>
                                                            <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Target Sourcing Sector</span>
                                                            <span className="font-heading font-black text-slate-800 text-xs uppercase">
                                                                {promo.category || 'Cricket Equipment'} Keyword Queries
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Wholesaler Click Trigger</span>
                                                            <span className="font-heading font-black text-[#00C26E] text-xs uppercase">
                                                                "{promo.ctaText || 'Request Quote'}" Action Link
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Campaign Term Duration</span>
                                                            <span className="font-heading font-black text-slate-800 text-xs">
                                                                {promo.duration || '30 Active Days'} Remaining
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Insight Suggestions Banner */}
                                                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex items-start gap-3">
                                                        <span className="text-base mt-0.5">💡</span>
                                                        <div>
                                                            <span className="font-heading font-black text-slate-900 text-xs block">Sialkot Export Pro-Tip:</span>
                                                            <span className="font-body text-[10.5px] text-slate-550 leading-relaxed block mt-0.5">
                                                                Homepage Banners and Exporter Spotlight spots secure **3x higher bulk wholesaler response rates** and direct B2B catalog inquiries compared to standard keyword search listings.
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Minimal Elegant Glass Footer */}
                <div className="pt-8 border-t border-slate-200/60 mt-16 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-400 text-xs font-body font-bold">
                    <div className="flex items-center gap-2">
                        <Megaphone className="text-[#00C26E]" size={14} />
                        <span className="text-slate-650 uppercase tracking-widest font-black text-[9.5px]">GearUp Promotion Center</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <button type="button" onClick={() => alert('Vetting guidelines...')} className="hover:text-[#00C26E] transition-colors uppercase tracking-wider text-[9px]">Sourcing Vetting</button>
                        <button type="button" onClick={() => alert('Promotional policies...')} className="hover:text-[#00C26E] transition-colors uppercase tracking-wider text-[9px]">Platform Policies</button>
                        <button type="button" onClick={() => alert('Help desk support...')} className="hover:text-[#00C26E] transition-colors uppercase tracking-wider text-[9px]">Support Desk</button>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">
                        © 2026 GearUp. Pakistani Export Discovery Channels.
                    </div>
                </div>

            </div>
        </div>
    );
}
