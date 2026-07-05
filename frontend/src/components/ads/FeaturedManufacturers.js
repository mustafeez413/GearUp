"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Shield, ArrowRight, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import UserAvatar from '@/components/ui/UserAvatar';
import {
    fetchMarketplaceManufacturers,
    fetchMarketplaceProducts,
    buildManufacturerProductIndex,
    mapManufacturerToFeaturedCard,
    PRODUCT_PLACEHOLDER,
} from '@/lib/marketplaceData';

const FeaturedManufacturers = ({ onSupplierClick }) => {
    const sliderRef = useRef(null);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                const [manufacturers, products] = await Promise.all([
                    fetchMarketplaceManufacturers({ verified: true, role: 'manufacturer' }),
                    fetchMarketplaceProducts(),
                ]);
                const productIndex = buildManufacturerProductIndex(products);
                const cards = manufacturers
                    .map((mfg) => mapManufacturerToFeaturedCard(mfg, productIndex.get(String(mfg._id)) || []))
                    .filter((card) => card.productCount > 0);
                if (mounted) setSuppliers(cards);
            } catch {
                if (mounted) setSuppliers([]);
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);

    const slideLeft = () => {
        if (sliderRef.current) {
            sliderRef.current.scrollBy({ left: -320, behavior: 'smooth' });
        }
    };

    const slideRight = () => {
        if (sliderRef.current) {
            sliderRef.current.scrollBy({ left: 320, behavior: 'smooth' });
        }
    };

    return (
        <div className="space-y-4 select-none relative group/slider">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-heading text-lg font-black text-slate-900 tracking-tight leading-none flex items-center gap-2">
                        <Shield size={16} className="text-[#00C26E]" /> Verified B2B Manufacturers
                    </h2>
                    <p className="font-body text-xs text-slate-400 font-bold uppercase tracking-wider mt-1.5 leading-none">
                        Premium vetted sports exporters in Sialkot, Peshawar & Gujranwala
                    </p>
                </div>

                <div className="flex items-center gap-1.5 opacity-60 group-hover/slider:opacity-100 transition-opacity">
                    <button
                        type="button"
                        onClick={slideLeft}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all active:scale-90"
                    >
                        <ChevronLeft size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={slideRight}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all active:scale-90"
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
                    Loading verified manufacturers…
                </div>
            ) : !suppliers.length ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
                    No verified manufacturers with active listings yet
                </div>
            ) : (
                <div
                    ref={sliderRef}
                    className="flex gap-5 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory"
                    style={{ scrollSnapType: 'x mandatory' }}
                >
                    {suppliers.map((supp) => (
                        <Link
                            key={supp.id}
                            href={`/wholesaler/manufacturer/${supp.id}`}
                            onClick={() => onSupplierClick && onSupplierClick(supp)}
                            className="w-[280px] shrink-0 bg-white rounded-2xl border border-slate-200/60 p-5 shadow-[0_2px_15px_rgba(0,0,0,0.015)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:-translate-y-1.5 transition-all duration-300 cursor-pointer snap-start relative group overflow-hidden border-t-4"
                            style={{ borderTopColor: supp.verified ? '#00C26E' : '#94A3B8' }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-50/10 via-transparent to-[#00C26E]/1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                            <div className="flex items-center justify-between mb-3">
                                <span className="px-2 py-0.5 rounded bg-slate-900/5 text-slate-800 font-mono text-[8px] font-black uppercase tracking-wider">
                                    {supp.tag}
                                </span>
                                {supp.verified && (
                                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-[#E8F8F0] border border-[#D1F2DE]/50 text-[#00C26E] text-[8px] font-black uppercase tracking-wider">
                                        <CheckCircle size={8} className="stroke-[2.5]" /> VETTED
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-3 mb-2">
                                <UserAvatar name={supp.name} src={supp.avatar} size="sm" rounded="xl" />
                                <div className="min-w-0">
                                    <h3 className="font-heading font-black text-slate-800 text-sm group-hover:text-[#00C26E] transition-colors leading-tight line-clamp-1">
                                        {supp.name}
                                    </h3>
                                    <p className="font-body text-[10px] text-slate-400 font-bold uppercase mt-1 leading-none">
                                        📍 {supp.city}, Pakistan
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 bg-slate-50 border border-slate-100 rounded-xl p-3 my-4">
                                <div>
                                    <span className="font-body text-[8px] text-slate-400 font-black uppercase tracking-widest leading-none block">MOQ Requirement</span>
                                    <span className="font-heading text-xs font-black text-slate-800 mt-1 block">{supp.moq}</span>
                                </div>
                                <div>
                                    <span className="font-body text-[8px] text-slate-400 font-black uppercase tracking-widest leading-none block">Product Count</span>
                                    <span className="font-heading text-xs font-black text-slate-800 mt-1 block">{supp.productCount}</span>
                                </div>
                            </div>

                            <p className="font-body text-[9px] text-slate-400 font-bold uppercase mb-4 -mt-2">
                                Joined {supp.joinedDate}
                            </p>

                            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100">
                                {supp.images.map((img, i) => (
                                    <div key={i} className="h-12 bg-slate-50 border border-slate-100/80 rounded-lg overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.01)] hover:scale-105 transition-transform duration-200">
                                        <img
                                            src={img}
                                            alt={`${supp.name} product ${i + 1}`}
                                            className="w-full h-full object-contain p-1"
                                            onError={(e) => { e.currentTarget.src = PRODUCT_PLACEHOLDER; }}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-between mt-4 text-[10px] font-body font-black uppercase tracking-wider text-slate-400 group-hover:text-[#00C26E] transition-colors pt-1">
                                <span>Sourcing Profile</span>
                                <ArrowRight size={10} className="transform group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FeaturedManufacturers;
