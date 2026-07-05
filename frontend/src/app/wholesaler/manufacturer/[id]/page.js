"use client";

import { getApiBaseUrl } from '@/lib/api';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    CheckCircle,
    MapPin,
    Star,
    MessageSquare,
    Package,
    ShoppingCart,
    ArrowLeft,
    Clock,
    AlertCircle,
    Building2,
    Calendar,
    LayoutGrid,
    Target,
    Shield
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PLATFORM_MOQ } from '@/utils/moq';
import { normalizeLoadedPackSize } from '@/lib/bulkPackaging';
import { resolveProductImageUrl } from '@/lib/marketplaceData';

const ManufacturerProfilePage = () => {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuth();

    const [selectedCategory, setSelectedCategory] = useState('all');
    const [manufacturer, setManufacturer] = useState(null);
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);

            const headers = {};
            if (typeof window !== 'undefined') {
                const token = localStorage.getItem('token');
                if (token) {
                    headers.Authorization = `Bearer ${token}`;
                }
            }

            // Parallel fetch; Authorization lets the API hide own listings when a manufacturer views their profile.
            const [mRes, pRes] = await Promise.all([
                fetch(`${getApiBaseUrl()}/api/auth/user/${id}`),
                fetch(`${getApiBaseUrl()}/api/products?manufacturer=${id}`, { headers })
            ]);

            const [mData, pData] = await Promise.all([mRes.json(), pRes.json()]);

            if (mData.success && mData.data) {
                const m = mData.data;
                setManufacturer({
                    id: m._id,
                    name: m.name || 'Unknown Manufacturer',
                    verified: m.businessDetails?.isVerified || false,
                    location: m.businessDetails?.city || 'Pakistan',
                    specialization: m.businessDetails?.specialization || ['High-End Sports Goods'],
                    rating: m.rating || 4.8,
                    totalReviews: m.totalReviews || 124,
                    yearsOperating: m.businessDetails?.yearsInOperation || 15,
                    description: m.businessDetails?.description || 'Strategic manufacturing partner specializing in advanced athletic equipment. Utilizing modern fabrication techniques with legacy craftsmanship.',
                    certifications: m.businessDetails?.certifications || ['ISO 9001:2015', 'SEDEX Compliant', 'WFSGI Member']
                });
            } else {
                setError('Manufacturer not found');
            }

            if (pData.success && pData.data) {
                setAllProducts(pData.data.map(p => ({
                    id: p?._id,
                    name: p?.name || 'Product',
                    image: resolveProductImageUrl(p?.images?.[0] || null),
                    price: p?.price || 0,
                    stock: p?.stock || 0,
                    moq: p?.minimumOrderQuantity || 1,
                    bulkUnit: p?.bulkUnit || 'Dozen',
                    packSize: normalizeLoadedPackSize(p?.bulkUnit || 'Dozen', p?.packSize) || 12,
                    category: (p?.category || 'sports').toLowerCase(),
                    rating: p?.rating || 4.5,
                    deliveryTime: '15-20 Days'
                })));
            }
        } catch (err) {
            setError('Uplink disruption: Manufacturer dossier retrieval failed.');
        } finally {
            setLoading(false);
        }
    }, [id, user?.id]);

    useEffect(() => {
        if (id) fetchData();
    }, [id, fetchData]);

    const categories = [
        { id: 'all', label: 'Complete Manifest', count: allProducts.length },
        { id: 'cricket', label: 'Cricket Vertical', count: allProducts.filter(p => p.category === 'cricket').length },
        { id: 'football', label: 'Football Vertical', count: allProducts.filter(p => p.category === 'football').length },
        { id: 'protective gear', label: 'Protective Gear', count: allProducts.filter(p => p.category === 'protective gear').length }
    ].filter(c => c.count > 0 || c.id === 'all');

    const filteredProducts = selectedCategory === 'all'
        ? allProducts
        : allProducts.filter(p => p.category === selectedCategory);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-slate-200 border-b-emerald-600 rounded-full animate-spin mx-auto mb-6"></div>
                    <p className="font-body font-bold text-slate-400 uppercase tracking-widest text-xs">Accessing Manufacturer Dossier...</p>
                </div>
            </div>
        );
    }

    if (error || !manufacturer) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center bg-white p-12 rounded-[3rem] border border-slate-100 shadow-2xl max-w-md">
                    <AlertCircle className="mx-auto text-red-500 mb-6" size={60} />
                    <h2 className="font-heading text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-4">Registry Null</h2>
                    <p className="font-body text-slate-400 font-medium mb-8 leading-relaxed italic">{error || 'Source entity not registered in current sector.'}</p>
                    <button onClick={() => router.back()} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-body font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl">Abort Interface</button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-20">
            {/* Navigation */}
            <button
                onClick={() => router.back()}
                className="group flex items-center gap-3 font-body font-black text-[10px] uppercase tracking-[0.3em] text-slate-400 hover:text-slate-900 transition-all"
            >
                <ArrowLeft size={16} className="group-hover:-translate-x-2 transition-transform" /> Back to Matrix
            </button>

            {/* Manufacturer Hero Card */}
            <div className="bg-slate-900 rounded-[3rem] p-10 lg:p-14 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full"></div>

                <div className="relative z-10 grid lg:grid-cols-12 gap-12 items-center">
                    <div className="lg:col-span-8 space-y-8">
                        <div className="flex flex-wrap items-center gap-4">
                            {manufacturer.verified && (
                                <div className="px-5 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl font-body font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                                    <CheckCircle size={14} /> Global Certified Source
                                </div>
                            )}
                            <div className="px-5 py-2 bg-white/5 border border-white/10 text-white/60 rounded-2xl font-body font-black text-[10px] uppercase tracking-widest flex items-center gap-2 italic">
                                <Calendar size={14} /> Est. {new Date().getFullYear() - manufacturer.yearsOperating}
                            </div>
                        </div>

                        <h1 className="font-heading text-6xl font-black tracking-tighter uppercase italic leading-none text-white">{manufacturer.name}</h1>

                        <div className="flex flex-wrap items-center gap-8 text-white/40 font-body font-black text-[10px] uppercase tracking-[0.2em]">
                            <span className="flex items-center gap-2"><MapPin size={16} className="text-emerald-500" /> {manufacturer.location}</span>
                            <span className="flex items-center gap-2"><LayoutGrid size={16} className="text-emerald-500" /> {allProducts.length} Assets Registered</span>
                            <span className="flex items-center gap-2 text-emerald-400"><Star size={16} className="fill-emerald-400" /> {manufacturer.rating} ({manufacturer.totalReviews} Audits)</span>
                        </div>

                        <p className="font-body text-slate-400 text-lg font-medium leading-relaxed max-w-3xl border-l border-white/10 pl-8">
                            {manufacturer.description}
                        </p>

                        <div className="flex flex-wrap gap-3 mt-8">
                            {manufacturer.specialization.map((spec, i) => (
                                <span key={i} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl font-body font-bold text-[10px] uppercase tracking-widest text-slate-300">
                                    {spec}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-4 flex flex-col gap-4">
                        <button
                            onClick={() => alert('Secure comms initialized')}
                            className="w-full py-5 bg-white text-slate-900 rounded-[2rem] font-body font-black text-xs uppercase tracking-widest italic hover:bg-emerald-600 hover:text-white transition-all shadow-2xl flex items-center justify-center gap-3 group"
                        >
                            <MessageSquare size={18} className="group-hover:rotate-12 transition-transform" /> Direct Command Uplink
                        </button>
                        <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-4">
                            <div className="font-body text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                                <Shield size={14} className="text-emerald-400" /> Compliance Status
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {manufacturer.certifications.map((cert, i) => (
                                    <span key={i} className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-tight italic">
                                        {cert}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Matrix Control */}
            <div className="flex flex-col lg:flex-row gap-8 items-start">
                <div className="w-full lg:w-72 space-y-4 shrink-0">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/50">
                        <h3 className="font-heading font-black text-slate-900 uppercase italic tracking-tighter mb-8 flex items-center gap-2 border-b border-slate-50 pb-4">
                            <Target size={18} className="text-emerald-600" /> Sector Filter
                        </h3>
                        <div className="space-y-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`w-full text-left px-5 py-3 rounded-2xl font-body font-black text-[10px] uppercase tracking-widest transition-all flex justify-between items-center ${selectedCategory === cat.id
                                            ? 'bg-slate-900 text-white shadow-xl translate-x-2'
                                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                        }`}
                                >
                                    {cat.label} <span>{cat.count}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-emerald-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-emerald-500/20">
                        <h4 className="font-heading font-black text-lg uppercase italic tracking-tighter mb-4">Bulk Constraint</h4>
                        <p className="font-body text-xs font-medium text-emerald-50 leading-relaxed mb-6 opacity-80 italic">
                            All assets from this origin require a minimum deployment volume of {PLATFORM_MOQ} units per manifest.
                        </p>
                        <Package size={40} className="text-white opacity-20" />
                    </div>
                </div>

                <div className="flex-1 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {filteredProducts.map((asset) => (
                            <div key={asset.id} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all group flex flex-col">
                                <div className="h-56 bg-slate-50 overflow-hidden relative">
                                    {asset.image ? (
                                        <img src={asset.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-200"><Package size={60} /></div>
                                    )}
                                    <div className="absolute top-6 right-6 px-4 py-1.5 bg-slate-900 text-white rounded-xl font-heading font-black text-[10px] uppercase italic tracking-widest italic shadow-xl">
                                        {asset.category}
                                    </div>
                                </div>
                                <div className="p-8 flex-1 flex flex-col">
                                    <h3 className="font-heading text-xl font-black text-slate-900 italic uppercase italic tracking-tighter group-hover:text-emerald-600 transition-colors mb-2">{asset.name}</h3>
                                    <div className="flex items-center gap-4 text-emerald-600 font-body font-black text-[10px] uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">
                                        <Star size={14} className="fill-emerald-600" /> {asset.rating} Performance Rating
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 mb-8">
                                        <div>
                                            <div className="font-body text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Valuation</div>
                                            <div className="font-heading font-black text-slate-900 text-xl tracking-tighter italic">PKR {asset.price.toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div className="font-body text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Deployment</div>
                                            <div className="font-heading font-black text-slate-900 text-xl tracking-tighter italic">{asset.deliveryTime}</div>
                                        </div>
                                    </div>

                                    <div className="mt-auto flex gap-3">
                                        <Link
                                            href={`/wholesaler/marketplace/product/${asset.id}`}
                                            className="flex-1 py-4 bg-slate-50 text-slate-900 rounded-2xl font-body font-black text-[10px] uppercase tracking-widest italic hover:bg-slate-900 hover:text-white transition-all text-center flex items-center justify-center gap-2"
                                        >
                                            Inspect Specs
                                        </Link>
                                        <button
                                            onClick={() => router.push(`/wholesaler/cart?add=${asset.id}&qty=${PLATFORM_MOQ}`)}
                                            className="px-5 py-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center"
                                        >
                                            <ShoppingCart size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManufacturerProfilePage;
