"use client";

import { getApiBaseUrl } from '@/lib/api';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { validateMOQ, PLATFORM_MOQ, formatMoqDisplay } from '@/utils/moq';
import { normalizeLoadedPackSize } from '@/lib/bulkPackaging';
import { calculateCommission, getCommissionRate } from '@/utils/commission';
import {
    ArrowLeft,
    CheckCircle,
    MapPin,
    Package,
    Clock,
    TrendingUp,
    MessageSquare,
    Building2,
    Award,
    AlertCircle,
    ShoppingCart,
    Zap,
    ShieldCheck,
    ChevronRight,
    Info,
    Layers
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { resolveProductImageUrl, PRODUCT_PLACEHOLDER } from '@/lib/marketplaceData';

const ProductDetailsPage = () => {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [quantity, setQuantity] = useState(PLATFORM_MOQ);
    const [moqError, setMoqError] = useState(null);
    const [selectedImage, setSelectedImage] = useState(0);

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [chatOpening, setChatOpening] = useState(false);

    const fetchProduct = useCallback(async () => {
        try {
            setLoading(true);
            const headers = {};
            if (typeof window !== 'undefined') {
                const token = localStorage.getItem('token');
                if (token) {
                    headers.Authorization = `Bearer ${token}`;
                }
            }
            const response = await fetch(`${getApiBaseUrl()}/api/products/${id}`, { headers });
            const data = await response.json();
            if (data.success) {
                const p = data.data;
                const sellerId = p.seller?._id ?? p.seller;
                const mappedProduct = {
                    id: p._id,
                    name: p.name,
                    category: p.category || 'Cricket',
                    images: p.images?.length > 0
                        ? p.images.map((img) => resolveProductImageUrl(img))
                        : [resolveProductImageUrl(null)],
                    sellerId,
                    seller: {
                        name: p.seller?.name || 'Unknown Seller',
                        verified: p.seller?.businessDetails?.isVerified || false,
                        location: p.seller?.businessDetails?.city || 'Pakistan',
                        yearsOperating: p.seller?.businessDetails?.yearsInOperation || 0,
                        specialization: p.seller?.businessDetails?.specialization?.join(', ') || 'Sports Equipment',
                        certifications: p.seller?.businessDetails?.certifications || ['ISO 9001', 'SEDEX Compliant'],
                        profileId: sellerId
                    },
                    trade: {
                        moq: p.minimumOrderQuantity || 1,
                        price: p.pricePerBulkUnit || 0,
                        packSize: normalizeLoadedPackSize(p.bulkUnit || 'Dozen', p.packSize) || 12,
                        bulkUnit: p.bulkUnit || 'Dozen',
                        productionTimeline: p.productionTimeline || '15-21 business days',
                        monthlyCapacity: p.monthlyCapacity || '1,000+ units',
                        exportReady: p.exportReady !== undefined ? p.exportReady : true,
                        capacityIndicator: p.capacityIndicator || 'high',
                        stock: p.stock || 0
                    },
                    specifications: p.specifications || {
                        material: 'Premium Grade English Willow',
                        weight: '1150 - 1250 grams',
                        grip: 'Chevron Performance',
                        handle: 'Semi-Oval Sarawak Cane',
                        finish: 'Laser Engraved Branding',
                        standards: 'ICC Regulation Compliant'
                    },
                    description: p.description || 'Professional grade equipment designed for high-performance athletic environments.'
                };
                setProduct(mappedProduct);
                setQuantity(mappedProduct.trade.moq);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Error loading product details.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    const openSellerChat = async () => {
        if (!user?.role || (user.role !== 'wholesaler' && user.role !== 'manufacturer') || !product?.id) return;
        try {
            setChatOpening(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${getApiBaseUrl()}/api/chats/open`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ productId: product.id })
            });
            const data = await res.json();
            if (data.success && data.data?._id) {
                const chatRoute = user.role === 'manufacturer' ? '/manufacturer/chats' : '/wholesaler/chats';
                router.push(`${chatRoute}/${data.data._id}`);
            } else {
                alert(data.error || 'Could not open chat');
            }
        } catch (e) {
            alert('Could not open chat');
        } finally {
            setChatOpening(false);
        }
    };

    useEffect(() => {
        if (id) fetchProduct();
    }, [id, fetchProduct]);

    const getCurrentPrice = () => {
        return product?.trade.price || 0;
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-slate-200 border-b-emerald-600 rounded-full animate-spin mx-auto mb-6"></div>
                    <p className="font-body font-bold text-slate-400 uppercase tracking-widest text-xs">Loading Product...</p>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center bg-white p-12 rounded-[3rem] border border-slate-100 shadow-2xl max-w-md">
                    <AlertCircle className="mx-auto text-red-500 mb-6" size={60} />
                    <h2 className="font-heading text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-4">Error</h2>
                    <p className="font-body text-slate-400 font-medium mb-8 leading-relaxed italic">{error || 'Product not found.'}</p>
                    <button onClick={() => router.back()} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-body font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl">Go Back</button>
                </div>
            </div>
        );
    }

    const moqDisplay = formatMoqDisplay(product.trade.moq, product.trade.bulkUnit, product.trade.packSize);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
            {/* Breadcrumbs / Back */}
            <button
                onClick={() => router.back()}
                className="group flex items-center gap-2 font-sans font-[800] text-[12px] uppercase tracking-widest text-[#64748B] hover:text-[#00A878] transition-colors w-fit"
            >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Marketplace
            </button>

            <div className="grid lg:grid-cols-12 gap-8 items-start">
                
                {/* LEFT COLUMN: Deep Product Knowledge */}
                <div className="lg:col-span-7 space-y-8">
                    {/* Product Gallery */}
                    <div className="space-y-4">
                        <div className="bg-[#FFFFFF] rounded-[24px] p-6 border border-[#E5E7EB] shadow-[0_8px_24px_rgba(15,23,42,0.04)] overflow-hidden aspect-[4/3] sm:aspect-square group relative flex items-center justify-center">
                            {product.images[selectedImage] ? (
                                <img
                                    src={product.images[selectedImage]}
                                    alt={product.name}
                                    className="w-full h-full object-contain rounded-[16px] group-hover:scale-[1.05] transition-transform duration-700 ease-out"
                                    onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = PRODUCT_PLACEHOLDER;
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full bg-[#F8FAFC] flex items-center justify-center text-[#94A3B8] rounded-[16px]">
                                    <Package size={80} strokeWidth={1} />
                                </div>
                            )}
                        </div>
                        
                        {/* Thumbnails */}
                        {product.images.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                {product.images.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedImage(i)}
                                        className={`relative w-20 h-20 rounded-[16px] border-2 transition-all duration-300 overflow-hidden flex-shrink-0 ${
                                            selectedImage === i 
                                                ? 'border-[#00A878] shadow-md ring-4 ring-[#00A878]/10' 
                                                : 'border-transparent bg-[#FFFFFF] border-[#E5E7EB] hover:border-[#CBD5E1] opacity-70 hover:opacity-100'
                                        }`}
                                    >
                                        {img ? (
                                            <img src={img} className="w-full h-full object-cover" alt={`Thumbnail ${i}`} onError={(e) => {
                                                e.currentTarget.onerror = null;
                                                e.currentTarget.src = PRODUCT_PLACEHOLDER;
                                            }} />
                                        ) : (
                                            <div className="w-full h-full bg-[#F8FAFC] flex items-center justify-center text-[#94A3B8]">
                                                <Package size={20} />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Description Card */}
                    <div className="bg-[#FFFFFF] rounded-[24px] p-8 border border-[#E5E7EB] shadow-[0_4px_16px_rgba(15,23,42,0.03)]">
                        <h3 className="font-sans text-[20px] font-[800] text-[#0F172A] tracking-tight mb-5">Product Description</h3>
                        <p className="font-sans text-[15px] font-[500] text-[#475569] leading-relaxed whitespace-pre-line">
                            {product.description}
                        </p>
                    </div>

                    {/* Key Features */}
                    <div className="bg-[#FFFFFF] rounded-[24px] p-8 border border-[#E5E7EB] shadow-[0_4px_16px_rgba(15,23,42,0.03)]">
                        <h3 className="font-sans text-[20px] font-[800] text-[#0F172A] tracking-tight mb-5">Key Features</h3>
                        <div className="grid sm:grid-cols-2 gap-5">
                            {[
                                'Premium Quality Assurance',
                                'Bulk Purchase Optimized',
                                product.trade.exportReady ? 'Export Ready Packaging' : 'Domestic Ready',
                                'Professional Grade Materials',
                                'Durable Construction',
                                'Manufacturer Direct Pricing'
                            ].map((feature, i) => (
                                <div key={i} className="flex items-center gap-3 font-sans text-[14px] font-[600] text-[#475569]">
                                    <div className="w-6 h-6 rounded-full bg-[#00A878]/10 flex items-center justify-center shrink-0">
                                        <CheckCircle size={14} className="text-[#00A878]" />
                                    </div>
                                    {feature}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Product Specifications */}
                    <div className="bg-[#FFFFFF] rounded-[24px] p-8 border border-[#E5E7EB] shadow-[0_4px_16px_rgba(15,23,42,0.03)]">
                        <h3 className="font-sans text-[20px] font-[800] text-[#0F172A] tracking-tight mb-6">Product Specifications</h3>
                        <div className="grid sm:grid-cols-2 gap-x-12 gap-y-0 divide-y sm:divide-y-0 divide-[#F1F5F9]">
                            {Object.entries(product.specifications).map(([key, value], i) => (
                                <div key={i} className="flex flex-col py-3.5 sm:border-b border-[#F1F5F9] group">
                                    <span className="font-sans text-[11px] font-[800] text-[#94A3B8] uppercase tracking-widest mb-1">{key}</span>
                                    <span className="font-sans text-[15px] font-[600] text-[#0F172A]">{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Packaging & Shipping */}
                    <div className="grid sm:grid-cols-2 gap-8">
                        <div className="bg-[#FFFFFF] rounded-[24px] p-8 border border-[#E5E7EB] shadow-[0_4px_16px_rgba(15,23,42,0.03)] flex flex-col">
                            <h3 className="font-sans text-[18px] font-[800] text-[#0F172A] tracking-tight mb-5 flex items-center gap-2">
                                <Package size={20} className="text-[#00A878]" /> Packaging Details
                            </h3>
                            <ul className="space-y-4 flex-1">
                                <li className="flex justify-between items-center font-sans border-b border-[#F8FAFC] pb-3">
                                    <span className="text-[13px] font-[600] text-[#64748B]">Units Per Pack</span>
                                    <span className="text-[14px] font-[800] text-[#0F172A]">{product.trade.packSize}</span>
                                </li>
                                <li className="flex justify-between items-center font-sans border-b border-[#F8FAFC] pb-3">
                                    <span className="text-[13px] font-[600] text-[#64748B]">Bulk Unit</span>
                                    <span className="text-[14px] font-[800] text-[#0F172A]">{product.trade.bulkUnit}</span>
                                </li>
                                <li className="flex justify-between items-center font-sans">
                                    <span className="text-[13px] font-[600] text-[#64748B]">Packaging Type</span>
                                    <span className="text-[14px] font-[800] text-[#0F172A]">Export Carton</span>
                                </li>
                            </ul>
                        </div>
                        <div className="bg-[#FFFFFF] rounded-[24px] p-8 border border-[#E5E7EB] shadow-[0_4px_16px_rgba(15,23,42,0.03)] flex flex-col">
                            <h3 className="font-sans text-[18px] font-[800] text-[#0F172A] tracking-tight mb-5 flex items-center gap-2">
                                <MapPin size={20} className="text-[#3B82F6]" /> Shipping Info
                            </h3>
                            <ul className="space-y-4 flex-1">
                                <li className="flex justify-between items-center font-sans border-b border-[#F8FAFC] pb-3">
                                    <span className="text-[13px] font-[600] text-[#64748B]">Origin</span>
                                    <span className="text-[14px] font-[800] text-[#0F172A]">{product.seller.location}</span>
                                </li>
                                <li className="flex justify-between items-center font-sans border-b border-[#F8FAFC] pb-3">
                                    <span className="text-[13px] font-[600] text-[#64748B]">Export Ready</span>
                                    <span className="text-[14px] font-[800] text-[#0F172A]">{product.trade.exportReady ? 'Yes' : 'No'}</span>
                                </li>
                                <li className="flex justify-between items-center font-sans">
                                    <span className="text-[13px] font-[600] text-[#64748B]">Monthly Capacity</span>
                                    <span className="text-[14px] font-[800] text-[#0F172A]">{product.trade.monthlyCapacity}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Conversion & Control */}
                <div className="lg:col-span-5 space-y-6 sticky top-6">
                    {/* Product Title Area & Seller */}
                    <div className="bg-[#FFFFFF] rounded-[24px] p-6 sm:p-8 border border-[#E5E7EB] shadow-[0_4px_16px_rgba(15,23,42,0.03)]">
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            <div className="px-3 py-1 bg-[#F8FAFC] text-[#475569] rounded-lg font-sans font-[800] text-[10px] uppercase tracking-widest border border-[#E5E7EB]">
                                {product.category}
                            </div>
                            {product.seller.verified && (
                                <div className="px-3 py-1 bg-[#00A878]/10 text-[#00A878] rounded-lg font-sans font-[800] text-[10px] uppercase tracking-widest flex items-center gap-1.5 border border-[#00A878]/20">
                                    <ShieldCheck size={14} /> Verified Seller
                                </div>
                            )}
                        </div>
                        
                        <h1 className="font-sans text-[26px] sm:text-[32px] font-[800] text-[#0F172A] tracking-tight leading-tight mb-2">
                            {product.name}
                        </h1>
                        
                        <Link
                            href={`/wholesaler/manufacturer/${product.seller.profileId}`}
                            className="inline-flex items-center gap-1.5 font-sans font-[700] text-[14px] text-[#3B82F6] hover:text-[#2563EB] transition-colors mb-8"
                        >
                            <Building2 size={16} /> {product.seller.name} <ChevronRight size={14} />
                        </Link>

                        {/* Highlights Matrix */}
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Min. Order', val: moqDisplay.primary, secondary: moqDisplay.secondary, icon: Package, color: 'text-[#00A878]', bg: 'bg-[#00A878]/10' },
                                { label: 'In Stock', val: `${product.trade.stock} ${product.trade.bulkUnit}s`, icon: Layers, color: 'text-[#3B82F6]', bg: 'bg-[#3B82F6]/10' },
                                { label: 'Lead Time', val: product.trade.productionTimeline, icon: Clock, color: 'text-[#8B5CF6]', bg: 'bg-[#8B5CF6]/10' },
                                { label: 'Response', val: '< 1 Hour', icon: Zap, color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10' }
                            ].map((item, i) => (
                                <div key={i} className="bg-[#F8FAFC] p-4 rounded-[16px] border border-[#E5E7EB] flex flex-col items-start gap-3 hover:shadow-[0_4px_12px_rgba(15,23,42,0.03)] transition-all">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${item.bg} ${item.color}`}>
                                        <item.icon size={16} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <div className="font-sans text-[10px] font-[800] text-[#64748B] uppercase tracking-widest mb-1">{item.label}</div>
                                        <div className="font-sans text-[14px] font-[800] text-[#0F172A] leading-none">{item.val}</div>
                                        {item.secondary && (
                                            <div className="font-sans text-[11px] font-[600] text-[#64748B] mt-1">{item.secondary}</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Purchase Card */}
                    <div className="bg-[#FFFFFF] rounded-[24px] p-6 sm:p-8 border border-[#E5E7EB] shadow-[0_8px_32px_rgba(15,23,42,0.06)] relative overflow-hidden">
                        <div className="space-y-6 relative z-10">
                            <div className="flex justify-between items-end pb-6 border-b border-[#F1F5F9]">
                                <div>
                                    <span className="block font-sans text-[11px] font-[800] text-[#64748B] uppercase tracking-widest mb-1.5">Price Per {product.trade.bulkUnit}</span>
                                    <span className="font-sans text-[32px] font-[900] text-[#0F172A] tracking-tight leading-none">
                                        <span className="text-[#00A878] text-[20px] mr-1.5">PKR</span>
                                        {getCurrentPrice().toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="font-sans text-[13px] font-[800] text-[#0F172A] flex justify-between items-center">
                                    <span>Order Quantity</span>
                                    <span className="text-[#64748B] font-[600] text-[12px] bg-[#F1F5F9] px-2 py-1 rounded-md">{moqDisplay.compact} MOQ</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min={product.trade.moq}
                                        max={product.trade.stock}
                                        value={quantity}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value) || product.trade.moq;
                                            setQuantity(Math.max(product.trade.moq, Math.min(val, product.trade.stock)));
                                        }}
                                        className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-[16px] px-5 py-4 font-sans text-[20px] font-[800] text-[#0F172A] focus:ring-4 focus:ring-[#00A878]/15 focus:border-[#00A878] outline-none transition-all shadow-inner"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                                        <button onClick={() => setQuantity(Math.min(quantity + 1, product.trade.stock))} className="text-[#64748B] hover:text-[#00A878] transition-colors p-1 bg-[#FFFFFF] border border-[#E5E7EB] rounded-md hover:shadow-sm">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                                        </button>
                                        <button onClick={() => setQuantity(Math.max(quantity - 1, product.trade.moq))} className="text-[#64748B] hover:text-[#00A878] transition-colors p-1 bg-[#FFFFFF] border border-[#E5E7EB] rounded-md hover:shadow-sm">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="bg-[#F8FAFC] rounded-[16px] p-5 flex justify-between items-center border border-[#E5E7EB]">
                                    <span className="font-sans text-[13px] font-[700] text-[#64748B]">Estimated Total</span>
                                    <span className="font-sans text-[22px] font-[900] text-[#0F172A]">
                                        PKR {(getCurrentPrice() * quantity).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <div className="pt-2 flex flex-col gap-3">
                                {(!user || product?.sellerId !== (user?.id || user?._id)) ? (
                                    <button
                                        type="button"
                                        onClick={() => router.push(`/wholesaler/cart?add=${product.id}&qty=${quantity}`)}
                                        className="w-full py-4 bg-gradient-to-r from-[#00A878] to-[#009268] hover:from-[#009268] hover:to-[#007D58] text-[#FFFFFF] rounded-[16px] font-sans font-[800] text-[14px] uppercase tracking-widest transition-all shadow-[0_8px_24px_rgba(0,168,120,0.25)] hover:shadow-[0_12px_32px_rgba(0,168,120,0.35)] hover:-translate-y-1 flex items-center justify-center gap-2 group"
                                    >
                                        <ShoppingCart size={18} className="group-hover:rotate-12 transition-transform" /> Add to Cart
                                    </button>
                                ) : (
                                    <div className="w-full py-4 bg-[#F8FAFC] text-[#64748B] border border-[#E5E7EB] rounded-[16px] font-sans font-[800] text-[13px] uppercase tracking-widest text-center select-none">
                                        Your Own Product
                                    </div>
                                )}
                                {user && product?.sellerId !== (user?.id || user?._id) && (
                                    <button
                                        type="button"
                                        disabled={chatOpening}
                                        onClick={openSellerChat}
                                        className="w-full py-3.5 bg-[#FFFFFF] border-2 border-[#E5E7EB] text-[#0F172A] rounded-[16px] font-sans font-[800] text-[13px] uppercase tracking-widest hover:border-[#0F172A] hover:bg-[#F8FAFC] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {chatOpening ? <div className="w-4 h-4 border-[2.5px] border-[#0F172A]/30 border-t-[#0F172A] rounded-full animate-spin"></div> : <MessageSquare size={16} />}
                                        Contact Supplier
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ProductDetailsPage;
