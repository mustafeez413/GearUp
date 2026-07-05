"use client";

import React, { useState, useEffect } from 'react';
import { BrainCircuit, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import {
    fetchMarketplaceManufacturers,
    fetchMarketplaceProducts,
    fetchSponsoredManufacturerIds,
    buildMarketplaceRecommendations,
} from '@/lib/marketplaceData';

const RecommendationSystem = ({ selectedCategory = 'all', onSelectSupplier }) => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                const [manufacturers, products, sponsoredIds] = await Promise.all([
                    fetchMarketplaceManufacturers({ role: 'manufacturer' }),
                    fetchMarketplaceProducts(),
                    fetchSponsoredManufacturerIds(),
                ]);
                const recommendations = buildMarketplaceRecommendations(
                    manufacturers,
                    products,
                    sponsoredIds,
                    selectedCategory
                );
                if (mounted) setMatches(recommendations);
            } catch {
                if (mounted) setMatches([]);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [selectedCategory]);

    return (
        <div className="bg-gradient-to-br from-[#0F2232] via-[#091723] to-[#0A1A28] border border-[#162D42] rounded-3xl p-6 shadow-2xl relative overflow-hidden select-none">
            <div className="absolute right-0 top-0 w-64 h-64 bg-[#00C26E]/5 rounded-full filter blur-[60px] pointer-events-none"></div>

            <div className="flex flex-wrap items-center justify-between gap-4 mb-5 border-b border-slate-800/80 pb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/10 shrink-0">
                        <BrainCircuit size={16} className="animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-heading font-black text-white text-sm tracking-tight leading-none">
                                AI Sourcing Recommendations
                            </h3>
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[8px] font-bold uppercase tracking-wider">
                                SMART MATCH
                            </span>
                        </div>
                        <p className="font-body text-[10px] text-slate-400 font-bold uppercase mt-1 leading-none tracking-wide">
                            Dynamic manufacturer matches optimized for your trade footprint
                        </p>
                    </div>
                </div>

                <div className="text-[10px] font-mono text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-800/30 px-3 py-1 rounded-full shrink-0">
                    Target Category: <span className="uppercase font-bold">{selectedCategory}</span>
                </div>
            </div>

            <div className="space-y-4 relative z-10">
                {loading ? (
                    <div className="p-6 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        Calculating live matches…
                    </div>
                ) : !matches.length ? (
                    <div className="p-6 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        No recommendations for this category yet
                    </div>
                ) : (
                    matches.map((item) => (
                        <Link
                            key={item.id}
                            href={`/wholesaler/manufacturer/${item.id}`}
                            onClick={() => onSelectSupplier && onSelectSupplier(item)}
                            className="p-4 bg-slate-900/40 border border-slate-800 hover:border-[#1E3E58] hover:bg-slate-900/60 rounded-2xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 transition-all cursor-pointer group block"
                        >
                            <div className="flex items-center gap-4.5">
                                <div className="w-12 h-12 rounded-xl bg-emerald-950/20 border border-emerald-500/10 flex flex-col items-center justify-center shrink-0">
                                    <span className="font-body text-[7px] text-emerald-500 font-black uppercase tracking-wider">Match</span>
                                    <span className="font-heading text-xs font-black text-emerald-400 leading-none mt-0.5">{item.matchScore}</span>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-heading font-black text-slate-200 text-xs tracking-tight group-hover:text-[#00C26E] transition-colors leading-none">
                                            {item.name}
                                        </h4>
                                        {item.verified && <ShieldCheck size={11} className="text-emerald-500" />}
                                    </div>
                                    <p className="font-body text-[10px] text-slate-400 font-semibold mt-1">
                                        📍 {item.location} • Exporter of <span className="text-slate-350">{item.specialized}</span>
                                    </p>
                                    <p className="font-body text-[9px] text-[#00C26E] font-medium mt-1 leading-none italic">
                                        💡 {item.reason}
                                    </p>
                                </div>
                            </div>

                            <span className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 group-hover:border-[#00C26E] group-hover:bg-[#00C26E] text-slate-400 group-hover:text-slate-950 font-body font-black text-[9px] uppercase tracking-wider rounded-xl transition-all flex items-center gap-1 shrink-0">
                                Open Profile <ArrowRight size={10} className="transform group-hover:translate-x-0.5 transition-transform" />
                            </span>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
};

export default RecommendationSystem;
