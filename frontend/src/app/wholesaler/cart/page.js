"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { getApiBaseUrl } from '@/lib/api';
import { resolveProductImageUrl } from '@/lib/marketplaceData';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ShoppingCart,
    Trash2,
    Package,
    ArrowRight,
    AlertCircle,
    Building2,
    ChevronLeft,
    ShieldCheck,
    Truck,
    Info,
    ArrowLeft,
    Layers
} from 'lucide-react';

import useReadOnlyMode from '@/hooks/useReadOnlyMode';

const WholesalerCartPage = () => {
    const router = useRouter();
    const { isReadOnlyMode, guardAction } = useReadOnlyMode();
    const searchParams = useSearchParams();

    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const [commissionPolicy, setCommissionPolicy] = useState({
        commissionEnabled: true,
        platformFeePercentage: 3,
        commissionChargedTo: 'manufacturer'
    });

    useEffect(() => {
        const loadCommissionPolicy = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const res = await fetch(`${getApiBaseUrl()}/api/transactions/commission-policy`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const json = await res.json();
                if (json.success && json.data) {
                    setCommissionPolicy(json.data);
                }
            } catch {
                /* keep defaults */
            }
        };
        loadCommissionPolicy();
    }, []);

    // Initialize cart from localStorage
    useEffect(() => {
        const savedCart = localStorage.getItem('wholesaler_cart');
        if (savedCart) {
            let items = JSON.parse(savedCart);
            // Migrate any 'Pack' to 'Dozen'
            let migrated = false;
            items = items.map(item => {
                if (item.bulkUnit === 'Pack') {
                    migrated = true;
                    return { ...item, bulkUnit: 'Dozen' };
                }
                return item;
            });
            if (migrated) {
                localStorage.setItem('wholesaler_cart', JSON.stringify(items));
            }
            setCartItems(items);
        }
        setLoading(false);
    }, []);

    // Handle adding from URL query
    useEffect(() => {
        const productId = searchParams.get('add');
        const qty = parseInt(searchParams.get('qty')) || 1;

        if (productId && !loading) {
            const addItem = async () => {
                try {
                    const headers = {};
                    if (typeof window !== 'undefined') {
                        const token = localStorage.getItem('token');
                        if (token) {
                            headers.Authorization = `Bearer ${token}`;
                        }
                    }
                    const res = await fetch(`${getApiBaseUrl()}/api/products/${productId}`, { headers });
                    const data = await res.json();
                    if (data.success) {
                        const product = data.data;
                        const newItem = {
                            id: product._id,
                            productId: product._id,
                            name: product.name,
                            image: resolveProductImageUrl(product.images?.[0] || product.image),
                            manufacturer: product.seller?.businessDetails?.businessName
                                ? `${product.seller.businessDetails.businessName} (${product.seller.name})`
                                : (product.seller?.name || 'Unknown Supplier'),
                            manufacturerId: product.seller?._id || product.seller,
                            price: product.pricePerBulkUnit || 0,
                            category: product.category || 'cricket',
                            quantity: qty,
                            stock: product.stock || 0,
                            moq: product.minimumOrderQuantity || 1,
                            bulkUnit: product.bulkUnit || 'Dozen',
                            packSize: product.packSize || 1
                        };

                        setCartItems(prev => {
                            const existing = prev.find(i => i.productId === productId);
                            let newCart;
                            if (existing) {
                                newCart = prev.map(i => i.productId === productId ? {
                                    ...i,
                                    quantity: Math.max(i.quantity + qty, product.minimumOrderQuantity || 1),
                                    image: resolveProductImageUrl(product.images?.[0] || product.image) || i.image,
                                    price: product.pricePerBulkUnit || i.price,
                                    bulkUnit: product.bulkUnit || i.bulkUnit,
                                    moq: product.minimumOrderQuantity || i.moq,
                                } : i);
                            } else {
                                newCart = [...prev, newItem];
                            }
                            localStorage.setItem('wholesaler_cart', JSON.stringify(newCart));
                            return newCart;
                        });
                        router.replace('/wholesaler/cart');
                    }
                } catch (err) {
                    console.error('Failed to add item to cart.');
                }
            };
            addItem();
        }
    }, [searchParams, loading, router]);

    // Sync to localStorage
    useEffect(() => {
        if (!loading) {
            localStorage.setItem('wholesaler_cart', JSON.stringify(cartItems));
        }
    }, [cartItems, loading]);

    const updateQuantity = (itemId, newQuantity) => {
        const item = cartItems.find(i => i.id === itemId);
        if (!item) return;

        if (newQuantity < item.moq) {
            setErrors(prev => ({ ...prev, [itemId]: `Minimum order quantity is ${item.moq}` }));
            return;
        }

        if (newQuantity > item.stock) {
            setErrors(prev => ({ ...prev, [itemId]: `Only ${item.stock} in stock` }));
            return;
        }

        setErrors(prev => {
            const next = { ...prev };
            delete next[itemId];
            return next;
        });

        setCartItems(prev => prev.map(item => item.id === itemId ? { ...item, quantity: newQuantity } : item));
    };

    const removeItem = (itemId) => {
        setCartItems(prev => prev.filter(item => item.id !== itemId));
        setErrors(prev => {
            const next = { ...prev };
            delete next[itemId];
            return next;
        });
    };

    const totals = useMemo(() => {
        let totalBase = 0;
        let totalCommission = 0;
        let totalAmount = 0;
        const commissionRate = commissionPolicy.commissionEnabled
            ? (Number(commissionPolicy.platformFeePercentage) || 0) / 100
            : 0;
        const buyerPaysCommission =
            commissionPolicy.commissionEnabled && commissionPolicy.commissionChargedTo === 'wholesaler';

        cartItems.forEach(item => {
            const subtotal = item.price * item.quantity;
            const commission = subtotal * commissionRate;
            totalBase += subtotal;
            totalCommission += commission;
            totalAmount += buyerPaysCommission ? subtotal + commission : subtotal;
        });

        return {
            totalBase,
            totalCommission,
            totalAmount,
            itemCount: cartItems.length,
            buyerPaysCommission,
            commissionEnabled: commissionPolicy.commissionEnabled,
            commissionRate: commissionPolicy.platformFeePercentage
        };
    }, [cartItems, commissionPolicy]);

    const hasErrors = Object.keys(errors).length > 0 || cartItems.length === 0;

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-slate-200 border-b-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="font-body font-bold text-slate-400 uppercase tracking-widest text-xs">Loading Cart...</p>
                </div>
            </div>
        );
    }

    const getSupplierDetails = (manufacturerString) => {
        if (!manufacturerString) return { company: 'Verified Supplier', person: '' };
        const match = manufacturerString.match(/^(.*?)\s*\((.*?)\)$/);
        if (match) {
            return { company: match[1], person: match[2] };
        }
        return { company: manufacturerString, person: '' };
    };

    const formatPrice = (price) => {
        return price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    };

    return (
        <div className="space-y-8 pb-10 min-h-[calc(100vh-160px)]">
            {/* Header with Continue Shopping outline button */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="font-heading text-3xl font-black text-[#0F172A] tracking-tight">Your Cart</h1>
                    <p className="text-slate-500 font-medium text-sm mt-1 max-w-xl leading-relaxed">
                        Review your wholesale order before checkout.
                    </p>
                </div>
                <div className="flex justify-center sm:justify-end">
                    <Link
                        href="/wholesaler/marketplace"
                        className="flex items-center gap-2 px-5 h-[44px] bg-[#FFFFFF] border border-[#E5E7EB] hover:border-[#CBD5E1] text-[#0F172A] hover:bg-[#F8FAFC] rounded-[14px] font-[700] text-[14px] transition-all shadow-[0_2px_8px_rgba(15,23,42,0.04)] hover:-translate-y-0.5"
                    >
                        <ArrowLeft size={18} /> Continue Shopping
                    </Link>
                </div>
            </div>

            {cartItems.length === 0 ? (
                <div className="empty-state-enterprise max-w-2xl mx-auto mt-10">
                    <div className="icon-circle">
                        <ShoppingCart size={32} />
                    </div>
                    <h3>Your Cart is Empty</h3>
                    <p>
                        You haven't added any premium sports equipment for procurement yet.
                    </p>
                    <Link href="/wholesaler/marketplace" className="inline-flex items-center gap-2 h-[52px] px-8 bg-[#00A878] hover:bg-[#0DBB85] text-[#FFFFFF] rounded-[14px] font-sans font-[700] text-[14px] uppercase tracking-widest transition-all shadow-[0_8px_20px_rgba(0,168,120,0.25)] hover:-translate-y-1">
                        Browse Marketplace <ArrowRight size={16} />
                    </Link>
                </div>
            ) : (
                <div className="grid lg:grid-cols-12 gap-8 items-start">
                    {/* Left Panel: Cart Items list - 8 cols */}
                    <div className="lg:col-span-8 space-y-4">
                        {cartItems.map((item) => {
                            const subtotal = item.price * item.quantity;
                            const commissionRate = totals.commissionEnabled
                                ? (Number(totals.commissionRate) || 0) / 100
                                : 0;
                            const itemCommission = subtotal * commissionRate;
                            const totalWithFee = totals.buyerPaysCommission ? subtotal + itemCommission : subtotal;
                            const supplier = getSupplierDetails(item.manufacturer);
                            const stockStatus = item.stock <= 0 ? 'out' : item.stock <= 10 ? 'low' : 'in';

                            return (

                                <div key={item.id} className="bg-[#FFFFFF] rounded-[24px] border border-[#E5E7EB] p-5 hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)] hover:-translate-y-[2px] transition-all duration-300 group">
                                    <div className="flex flex-row gap-6 items-center">

                                        {/* LEFT: Product Image */}
                                        <div className="w-[130px] h-[130px] bg-[#F8FAFC] rounded-[16px] overflow-hidden shrink-0 flex items-center justify-center p-3 border border-[#E5E7EB]/60">
                                            {item.image ? (
                                                <img
                                                    src={item.image}
                                                    className="w-full h-full object-cover rounded-[10px] group-hover:scale-110 transition-transform duration-500"
                                                    alt={item.name}
                                                    onError={(e) => {
                                                        e.currentTarget.onerror = null;
                                                        e.currentTarget.src = resolveProductImageUrl(null);
                                                    }}
                                                />
                                            ) : (
                                                <Package size={36} className="text-[#94A3B8]" strokeWidth={1.5} />
                                            )}
                                        </div>

                                        {/* CENTER: Product Information */}
                                        <div className="flex-1 min-w-0 py-1">
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <span className="font-sans text-[12px] font-[600] text-[#475569] tracking-wide">
                                                    {supplier.company}
                                                </span>
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#00A878]/10 text-[#00A878] rounded-full font-sans font-[700] text-[9px] uppercase tracking-wider border border-[#00A878]/20">
                                                    <ShieldCheck size={10} /> Verified
                                                </span>
                                                <span className="font-sans text-[11px] font-[500] text-[#94A3B8]">
                                                    • Pakistan
                                                </span>
                                            </div>
                                            <h3 className="font-sans text-[22px] font-[800] text-[#0F172A] leading-tight line-clamp-2 mb-2 capitalize tracking-[-0.02em]">
                                                {item.name}
                                            </h3>
                                            <div className="flex items-center flex-wrap gap-3">
                                                <div className="flex items-baseline gap-1.5">
                                                    <span className="font-sans text-[22px] font-[800] text-[#0F172A] tracking-tight leading-none">
                                                        PKR {formatPrice(item.price)}
                                                    </span>
                                                    <span className="text-[11px] font-[600] text-[#94A3B8] tracking-wider uppercase">/ {item.bulkUnit}</span>
                                                </div>
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-sans font-[700] uppercase tracking-wider border ${
                                                    stockStatus === 'out' ? 'bg-[#FEF2F2] text-[#EF4444] border-[#FECACA]' :
                                                    stockStatus === 'low' ? 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]' :
                                                    'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                                        stockStatus === 'out' ? 'bg-[#EF4444]' :
                                                        stockStatus === 'low' ? 'bg-[#D97706]' :
                                                        'bg-[#059669] animate-pulse'
                                                    }`}></span>
                                                    {stockStatus === 'out' ? 'Out of Stock' : stockStatus === 'low' ? 'Low Stock' : 'In Stock'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* DIVIDER */}
                                        <div className="hidden sm:block w-px self-stretch bg-[#E5E7EB] mx-1"></div>

                                        {/* RIGHT: Subtotal + Controls */}
                                        <div className="flex flex-col items-end gap-3 shrink-0 min-w-[170px] pl-4">
                                            <div className="text-right">
                                                <div className="font-sans text-[10px] font-[700] text-[#94A3B8] uppercase tracking-[0.12em] mb-1">Subtotal</div>
                                                <div className="font-sans text-[24px] font-[800] text-[#0F172A] tracking-tight leading-none">PKR {formatPrice(totalWithFee)}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center border border-[#E5E7EB] rounded-[12px] overflow-hidden bg-[#FFFFFF] h-[38px] transition-all hover:border-[#00A878]/40 hover:shadow-[0_0_0_3px_rgba(0,168,120,0.06)]">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        disabled={item.quantity <= item.moq}
                                                        className="w-10 h-full text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-[16px] font-[500] flex items-center justify-center border-r border-[#E5E7EB]"
                                                    >
                                                        −
                                                    </button>
                                                    <span className="w-11 text-center font-sans text-[14px] font-[700] text-[#0F172A] select-none">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        disabled={item.quantity >= item.stock}
                                                        className="w-10 h-full text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-[16px] font-[500] flex items-center justify-center border-l border-[#E5E7EB]"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(item.id)}
                                                    className="flex items-center justify-center gap-1.5 h-[38px] px-3.5 bg-[#FFFFFF] border border-[#E5E7EB] text-[#EF4444] rounded-[12px] hover:bg-[#FEF2F2] hover:border-[#FECACA] hover:shadow-[0_0_0_3px_rgba(239,68,68,0.06)] transition-all font-sans text-[11px] font-[700] uppercase tracking-wider"
                                                    title="Remove item"
                                                >
                                                    <Trash2 size={14} /> Remove
                                                </button>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Right Panel: Sticky Order Summary & Shipping Details - 4 cols */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-8 space-y-6">
                            {/* Sticky Order Summary Card */}
                            <div className="wallet-card-enterprise relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFFFFF]/10 blur-[80px] -mr-32 -mt-32 rounded-full pointer-events-none"></div>

                                <h2 className="font-sans text-[18px] font-[800] tracking-tight mb-6 flex items-center gap-2">
                                    <ShoppingCart size={20} /> Order Summary
                                </h2>

                                <div className="space-y-5">
                                    <div className="flex justify-between items-center text-[#FFFFFF]/80 font-sans font-[600] text-[12px] uppercase tracking-widest pb-4 border-b border-[#FFFFFF]/10">
                                        <span>Product Subtotal</span>
                                        <span className="text-[#FFFFFF] font-[800] text-[14px]">PKR {formatPrice(totals.totalBase)}</span>
                                    </div>

                                    {totals.buyerPaysCommission && totals.totalCommission > 0 && (
                                        <div className="flex justify-between items-center text-[#FFFFFF]/80 font-sans font-[600] text-[12px] uppercase tracking-widest">
                                            <span>Platform fee ({totals.commissionRate}%)</span>
                                            <span className="text-[#FFFFFF] font-[800] text-[14px]">PKR {formatPrice(totals.totalCommission)}</span>
                                        </div>
                                    )}

                                    {!totals.commissionEnabled && (
                                        <p className="text-[11px] text-[#FFFFFF]/70 font-medium">No platform commission on this order.</p>
                                    )}

                                    <div className="pt-1">
                                        <div className="font-sans text-[11px] font-[600] text-[#FFFFFF]/80 uppercase tracking-widest mb-2">Total Payable Amount</div>
                                        <div className="font-sans text-[32px] font-[800] text-[#FFFFFF] tracking-tight leading-none">
                                            PKR {formatPrice(totals.totalAmount)}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        if (!guardAction()) return;
                                        router.push('/wholesaler/orders/checkout');
                                    }}
                                    disabled={hasErrors || isReadOnlyMode}
                                    className={`mt-8 w-full h-[56px] rounded-[14px] font-sans font-[800] text-[13px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 group relative overflow-hidden ${hasErrors || isReadOnlyMode
                                        ? 'bg-[#FFFFFF]/10 text-[#FFFFFF]/50 cursor-not-allowed backdrop-blur-sm'
                                        : 'bg-[#FFFFFF] text-[#071A35] hover:bg-[#F8FAFC] shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:-translate-y-1'
                                        }`}
                                >
                                    Proceed to Checkout <ArrowRight size={16} className={hasErrors ? '' : 'group-hover:translate-x-1.5 transition-transform'} />
                                </button>

                                {hasErrors && (
                                    <p className="mt-4 text-center text-[11px] font-sans font-[700] text-[#EF4444] uppercase tracking-widest bg-[#FFFFFF]/95 py-2.5 rounded-[12px] shadow-sm">
                                        Please fix cart errors to proceed
                                    </p>
                                )}
                            </div>

                            {/* Consolidated Shipping Info Card */}
                            <div className="bg-[#FFFFFF] rounded-[24px] border border-[#E5E7EB] p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-[#F8FAFC] text-[#00A878] rounded-[14px] border border-[#E5E7EB] flex items-center justify-center shrink-0">
                                        <Truck size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-sans text-[14px] font-[800] text-[#0F172A] uppercase tracking-tight">Logistics & Delivery</h4>
                                        <p className="font-sans text-[11px] font-[600] text-[#64748B] uppercase tracking-widest mt-0.5">Est. Lead Time: 7-10 Days</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-[#F8FAFC] rounded-[16px] border border-[#E5E7EB]">
                                    <div className="flex items-center gap-2 text-[#0F172A] font-sans font-[700] text-[11px] uppercase tracking-widest">
                                        <ShieldCheck size={16} className="text-[#00A878]" /> Buyer Protection Secured
                                    </div>
                                    <p className="mt-2 font-sans text-[12px] text-[#64748B] leading-relaxed font-[500]">
                                        Orders are held securely in escrow pending shipping and manufacturer confirmation.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WholesalerCartPage;
