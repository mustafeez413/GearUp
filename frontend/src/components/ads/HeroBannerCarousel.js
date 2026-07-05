"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Shield, Sparkles, ChevronLeft, ChevronRight, ArrowRight, PhoneCall, FileText, Package } from 'lucide-react';
import Link from 'next/link';
import { fetchHeroCarouselSlides, PRODUCT_PLACEHOLDER } from '@/lib/marketplaceData';

const HeroBannerCarousel = ({ onContactClick, onQuoteRequestClick }) => {
    const [slides, setSlides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const autoPlayRef = useRef();

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                const data = await fetchHeroCarouselSlides();
                if (mounted) {
                    setSlides(data);
                    setActiveIndex(0);
                }
            } catch {
                if (mounted) setSlides([]);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);

    const nextSlide = useCallback(() => {
        setActiveIndex((prev) => (slides.length ? (prev === slides.length - 1 ? 0 : prev + 1) : 0));
    }, [slides.length]);

    const prevSlide = () => {
        setActiveIndex((prev) => (slides.length ? (prev === 0 ? slides.length - 1 : prev - 1) : 0));
    };

    useEffect(() => {
        autoPlayRef.current = nextSlide;
    });

    useEffect(() => {
        if (isHovered || slides.length <= 1) return;
        const interval = setInterval(() => {
            autoPlayRef.current();
        }, 5000);
        return () => clearInterval(interval);
    }, [isHovered, slides.length]);

    const handleDotClick = (index) => {
        setActiveIndex(index);
    };

    if (loading) {
        return (
            <div className="relative w-full overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl min-h-[300px] sm:min-h-[340px] flex items-center justify-center">
                <p className="font-body text-xs text-slate-400 font-bold uppercase tracking-widest">Loading promoted partners…</p>
            </div>
        );
    }

    if (!slides.length) {
        return (
            <div className="relative w-full overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl min-h-[300px] sm:min-h-[340px] flex items-center justify-center px-8 text-center">
                <div>
                    <Package size={28} className="text-slate-600 mx-auto mb-3" />
                    <p className="font-heading text-sm font-black text-slate-300">No active promoted campaigns</p>
                    <p className="font-body text-xs text-slate-500 mt-2 max-w-md">
                        Sponsored homepage listings will appear here when manufacturers launch active advertisement campaigns.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="relative w-full overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl select-none group min-h-[300px] sm:min-h-[340px] flex items-stretch"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="absolute inset-0 bg-radial-gradient from-transparent via-slate-950 to-slate-950 opacity-90 z-0"></div>

            <div className="relative flex-1 flex items-stretch">
                {slides.map((slide, index) => {
                    const isActive = index === activeIndex;
                    return (
                        <div
                            key={slide.id}
                            className={`absolute inset-0 w-full h-full bg-gradient-to-br ${slide.gradient} flex items-center transition-all duration-700 ease-in-out px-8 sm:px-12 py-8 ${
                                isActive ? 'opacity-100 translate-x-0 z-10 scale-100' : 'opacity-0 translate-x-8 -z-10 scale-95 pointer-events-none'
                            }`}
                        >
                            <div className="absolute right-[5%] bottom-0 top-0 flex items-center justify-center pointer-events-none select-none">
                                <div className="w-[140px] h-[140px] sm:w-[180px] sm:h-[180px] rounded-2xl overflow-hidden opacity-20 filter blur-[1px] transform rotate-12 border border-white/10 bg-slate-900/40">
                                    <img
                                        src={slide.productImage || PRODUCT_PLACEHOLDER}
                                        alt={slide.tagline}
                                        className="w-full h-full object-contain p-4"
                                        onError={(e) => { e.currentTarget.src = PRODUCT_PLACEHOLDER; }}
                                    />
                                </div>
                            </div>

                            <div className="w-full max-w-[65%] z-20 flex flex-col justify-between h-full space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[9px] font-bold uppercase tracking-wider shadow-sm shadow-emerald-500/5">
                                            <Sparkles size={8} className="animate-spin" /> PROMOTED PARTNER
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-body">
                                            {slide.promoFeature}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2.5">
                                        <h2 className="font-heading text-xl sm:text-2xl font-black text-white tracking-tight leading-none">
                                            {slide.manufacturer}
                                        </h2>
                                        {slide.verified && (
                                            <span className="p-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-400" title="Verified B2B Business">
                                                <Shield size={10} className="stroke-[2.5]" />
                                            </span>
                                        )}
                                    </div>

                                    <p className="font-body text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-[480px]">
                                        {slide.tagline}
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 py-2 border-t border-slate-800/80">
                                    <div>
                                        <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Production MOQ</div>
                                        <div className="font-heading font-black text-slate-200 text-xs">{slide.moq}</div>
                                    </div>
                                    <div className="w-px h-6 bg-slate-800"></div>
                                    <div>
                                        <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Verification</div>
                                        <div className="font-heading font-black text-[#00C26E] text-xs">
                                            {slide.verified ? 'New Verified Supplier' : 'B2B Supplier'}
                                        </div>
                                    </div>
                                    <div className="w-px h-6 bg-slate-800"></div>
                                    <div>
                                        <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Main Category</div>
                                        <div className="font-heading font-black text-slate-200 text-xs uppercase tracking-wider">{slide.industry}</div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 pt-2">
                                    <Link
                                        href={slide.link || '/wholesaler/marketplace'}
                                        onClick={() => {
                                            if (slide.categoryFilter && slide.categoryFilter !== 'all') {
                                                window.dispatchEvent(new CustomEvent('ad-category-filter', { detail: slide.categoryFilter }));
                                            }
                                        }}
                                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#00C26E] hover:bg-[#009E58] text-slate-950 font-body font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-95"
                                    >
                                        View Products <ArrowRight size={11} className="stroke-[3]" />
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => onContactClick && onContactClick(slide)}
                                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-body font-black text-[10px] uppercase tracking-wider rounded-xl transition-all active:scale-95"
                                    >
                                        <PhoneCall size={11} /> Contact Factory
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onQuoteRequestClick && onQuoteRequestClick(slide)}
                                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-950/40 backdrop-blur-md border border-white/5 hover:border-white/10 hover:bg-slate-900/50 text-slate-400 hover:text-slate-200 font-body font-black text-[10px] uppercase tracking-wider rounded-xl transition-all active:scale-95"
                                    >
                                        <FileText size={11} /> Request Quote
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {slides.length > 1 && (
                <>
                    <button
                        type="button"
                        onClick={prevSlide}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/60 border border-slate-800 hover:border-slate-600 hover:bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center z-20 transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                    >
                        <ChevronLeft size={16} />
                    </button>

                    <button
                        type="button"
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/60 border border-slate-800 hover:border-slate-600 hover:bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center z-20 transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                    >
                        <ChevronRight size={16} />
                    </button>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
                        {slides.map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => handleDotClick(i)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                    i === activeIndex ? 'w-6 bg-[#00C26E]' : 'w-1.5 bg-slate-700 hover:bg-slate-500'
                                }`}
                            ></button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default HeroBannerCarousel;
