"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import PublicLayout from '../../components/shared/PublicLayout';
import { Calendar, ArrowRight, Search, Clock } from 'lucide-react';

const Blog = () => {
    const [activeCategory, setActiveCategory] = useState('All');

    const categories = ['All', 'Industry Insights', 'Market Trends', 'Procurement', 'Manufacturing'];

    const articles = [
        {
            id: 1,
            title: 'Pakistan Cricket Manufacturing: Export Growth and Market Opportunities',
            excerpt: 'Analyzing the growth trajectory of Pakistan\'s cricket equipment exports and emerging market opportunities for manufacturers.',
            category: 'Industry Insights',
            date: '2024-01-15',
            readTime: '5 min read',
            image: '🏏'
        },
        {
            id: 2,
            title: 'B2B E-Commerce Trends Shaping Sports Goods Trade in 2024',
            excerpt: 'How digital transformation is reshaping bulk trade in sports manufacturing, from procurement to delivery.',
            category: 'Market Trends',
            date: '2024-01-10',
            readTime: '7 min read',
            image: '📈'
        },
        {
            id: 3,
            title: 'Optimizing MOQ: Finding the Right Balance for Bulk Orders',
            excerpt: 'Strategic insights on minimum order quantities and how to optimize procurement for cost efficiency.',
            category: 'Procurement',
            date: '2024-01-05',
            readTime: '6 min read',
            image: '📦'
        },
        {
            id: 4,
            title: 'Export Compliance for Sports Equipment: A Manufacturer\'s Guide',
            excerpt: 'Understanding certification requirements, export documentation, and compliance standards for international trade.',
            category: 'Manufacturing',
            date: '2023-12-28',
            readTime: '8 min read',
            image: '🌍'
        },
        {
            id: 5,
            title: 'Supply Chain Resilience in Sports Manufacturing',
            excerpt: 'Building resilient supply chains in the post-pandemic era: lessons from Pakistan\'s sports goods industry.',
            category: 'Industry Insights',
            date: '2023-12-20',
            readTime: '6 min read',
            image: '🔗'
        },
        {
            id: 6,
            title: 'The Future of Football Equipment Manufacturing in Pakistan',
            excerpt: 'Exploring innovation and growth opportunities in Pakistan\'s football equipment manufacturing sector.',
            category: 'Market Trends',
            date: '2023-12-15',
            readTime: '5 min read',
            image: '⚽'
        }
    ];

    const filteredArticles = activeCategory === 'All'
        ? articles
        : articles.filter(article => article.category === activeCategory);

    return (
        <PublicLayout>
            <div className="min-h-screen bg-neutral-50 pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="text-center mb-16 max-w-3xl mx-auto">
                        <h1 className="font-heading text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tighter">GearUp Journal</h1>
                        <p className="font-body text-xl text-slate-600 leading-relaxed font-medium">
                            Expert analysis, market intelligence, and forward-looking strategies for the modern sports goods ecosystem.
                        </p>
                    </div>

                    {/* Featured Post Placeholder / Search Bar */}
                    <div className="mb-16">
                        <div className="relative max-w-2xl mx-auto">
                            <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
                                type="text"
                                placeholder="Search articles, strategies, reports..."
                                className="w-full py-5 bg-white border border-slate-200 rounded-[2rem] shadow-xl shadow-slate-200/50 focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 outline-none transition-all font-body text-lg pl-6 pr-14"
                            />
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div className="flex justify-center gap-3 mb-16 flex-wrap">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`px-8 py-3.5 rounded-2xl font-body font-bold transition-all text-sm tracking-wide ${activeCategory === category
                                        ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 scale-105'
                                        : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {/* Articles Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {filteredArticles.map((article) => (
                            <Link
                                key={article.id}
                                href={`/blog/${article.id}`}
                                className="group bg-white rounded-[2rem] border border-slate-100 overflow-hidden hover:border-emerald-500 hover:shadow-2xl transition-all duration-500 shadow-lg flex flex-col h-full"
                            >
                                {/* Image Placeholder */}
                                <div className="h-56 bg-gradient-to-br from-slate-50 to-slate-100 border-b border-slate-50 flex items-center justify-center text-8xl group-hover:scale-105 transition-transform duration-700 select-none">
                                    {article.image}
                                </div>

                                <div className="p-8 flex flex-col flex-1">
                                    <div className="flex items-center justify-between mb-6">
                                        <span className="px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg font-body text-[10px] font-bold uppercase tracking-[0.1em] border border-emerald-100">
                                            {article.category}
                                        </span>
                                        <div className="flex items-center gap-2 text-slate-400 font-body text-xs font-bold uppercase tracking-widest">
                                            <Clock size={14} />
                                            {article.readTime}
                                        </div>
                                    </div>

                                    <h3 className="font-heading text-2xl font-bold text-slate-900 mb-4 group-hover:text-emerald-600 transition-colors line-clamp-2 leading-tight">
                                        {article.title}
                                    </h3>

                                    <p className="font-body text-slate-500 mb-8 leading-relaxed line-clamp-3 text-base">
                                        {article.excerpt}
                                    </p>

                                    <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-50">
                                        <div className="flex items-center gap-2.5 text-slate-400">
                                            <Calendar size={16} className="text-emerald-500" />
                                            <span className="font-body text-xs font-bold uppercase tracking-widest">
                                                {new Date(article.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-900 font-body font-bold text-xs uppercase tracking-[0.2em] group-hover:text-emerald-600 group-hover:translate-x-1 transition-all">
                                            Read Article <ArrowRight size={16} />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {filteredArticles.length === 0 && (
                        <div className="text-center py-24 bg-white rounded-[3rem] border border-slate-100 shadow-inner">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search size={32} className="text-slate-200" />
                            </div>
                            <h3 className="font-heading text-2xl font-bold text-slate-900 mb-2">No matches found</h3>
                            <p className="font-body text-slate-600">Consider adjusting your filters to find relevant insights.</p>
                        </div>
                    )}

                    {/* Newsletter / CTA */}
                    <div className="mt-24 p-12 lg:p-16 bg-emerald-600 rounded-[3rem] text-white relative overflow-hidden shadow-2xl shadow-emerald-600/20">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -mr-48 -mt-48"></div>
                        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
                            <div className="lg:flex-1 text-center lg:text-left">
                                <h2 className="font-heading text-4xl lg:text-5xl font-black mb-4 tracking-tighter italic">Stay Ahead of the Market</h2>
                                <p className="font-body text-lg text-emerald-50 leading-relaxed font-medium">Join 5,000+ trade professionals receiving our weekly industry analysis and market reports.</p>
                            </div>
                            <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-4">
                                <input
                                    type="email"
                                    placeholder="Enter your work email"
                                    className="px-8 py-5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-emerald-100 outline-none focus:ring-4 focus:ring-white/10 transition-all font-body font-bold text-lg min-w-[300px]"
                                />
                                <button className="px-10 py-5 bg-white text-emerald-600 rounded-2xl font-body font-bold text-lg hover:bg-emerald-50 transition-all shadow-xl active:scale-95">
                                    Subscribe
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
};

export default Blog;
