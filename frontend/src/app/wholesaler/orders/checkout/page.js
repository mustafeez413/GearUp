"use client";

import { getApiBaseUrl } from '@/lib/api';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    CreditCard,
    ShieldCheck,
    Truck,
    CheckCircle,
    ArrowRight,
    AlertCircle,
    Building2,
    Package,
    ArrowLeft,
    Zap,
    Lock,
    Upload,
    Loader2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getAllPakistanCities, isRecognizedCity } from '@/lib/pakistanLocations';

const PAKISTAN_CITIES = getAllPakistanCities();

// Helper Levenshtein distance for typos correction
const getLevenshteinDistance = (a, b) => {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
};

// Searchable City Input with fuzzy Levenshtein suggestions
const SearchableCityInput = ({ value, onChange, errorState }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState(value || '');
    const containerRef = React.useRef(null);

    useEffect(() => {
        setSearch(value || '');
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredCities = useMemo(() => {
        if (!search) return PAKISTAN_CITIES;
        return PAKISTAN_CITIES.filter(city => 
            city.toLowerCase().includes(search.toLowerCase())
        );
    }, [search]);

    const typoSuggestion = useMemo(() => {
        if (!search || PAKISTAN_CITIES.some(c => c.toLowerCase() === search.toLowerCase())) {
            return null;
        }
        let bestMatch = null;
        let minDistance = 999;
        
        PAKISTAN_CITIES.forEach(city => {
            const dist = getLevenshteinDistance(search.toLowerCase(), city.toLowerCase());
            if (dist < minDistance && dist <= 3) {
                minDistance = dist;
                bestMatch = city;
            }
        });
        return bestMatch;
    }, [search]);

    return (
        <div className="relative" ref={containerRef}>
            <input
                required
                type="text"
                value={search}
                onFocus={() => setIsOpen(true)}
                onChange={(e) => {
                    setSearch(e.target.value);
                    onChange(e.target.value);
                    setIsOpen(true);
                }}
                className={`w-full bg-[#F8FAFC] border rounded-[16px] px-5 py-3.5 font-sans font-[600] text-[14px] text-[#0F172A] focus:border-[#00A878] focus:ring-4 focus:ring-[#00A878]/10 outline-none transition-all text-sm ${
                    errorState ? 'border-red-300 ring-red-50 focus:border-red-500' : 'border-[#E5E7EB] focus:border-[#00A878]'
                }`}
                placeholder="Type city (e.g. Sialkot, Lahore)"
            />
            {isOpen && filteredCities.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto scrollbar-thin">
                    {filteredCities.map(city => (
                        <button
                            key={city}
                            type="button"
                            onClick={() => {
                                onChange(city);
                                setSearch(city);
                                setIsOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all"
                        >
                            🇵🇰 {city}
                        </button>
                    ))}
                </div>
            )}
            {typoSuggestion && (
                <div className="mt-1.5 text-[10px] font-sans font-[800] text-[#00A878] uppercase tracking-wider flex items-center gap-1.5 animate-pulse select-none">
                    <span>Did you mean:</span>
                    <button
                        type="button"
                        onClick={() => {
                            onChange(typoSuggestion);
                            setSearch(typoSuggestion);
                        }}
                        className="underline hover:text-emerald-700 font-black cursor-pointer bg-transparent border-0 p-0"
                    >
                        {typoSuggestion}?
                    </button>
                </div>
            )}
        </div>
    );
};

const WholesalerCheckoutPage = () => {
    const router = useRouter();
    const { user } = useAuth();

    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [platformSettings, setPlatformSettings] = useState(null);
    const [paymentProof, setPaymentProof] = useState(null);
    const [uploaded, setUploaded] = useState(false);
    const [saveAddressChecked, setSaveAddressChecked] = useState(true);
    const [paymentMode, setPaymentMode] = useState('platform_wallet');
    const [walletBalance, setWalletBalance] = useState(null);
    
    // Drag & drop upload state
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploadError, setUploadError] = useState(null);

    const [formData, setFormData] = useState({
        shippingAddress: '',
        city: '',
        area: '',
        postalCode: '',
        contactNumber: '',
        altContactNumber: '',
        paymentMethod: 'gateway',
        notes: '',
        deliveryNotes: ''
    });

    const [savedCards, setSavedCards] = useState([]);
    const [selectedCardId, setSelectedCardId] = useState('');
    const [cardData, setCardData] = useState({
        cardholderName: '',
        cardNumber: '',
        expiryDate: '',
        cvc: '',
        saveCard: true
    });

    // Load saved cards dynamically
    useEffect(() => {
        if (user) {
            const userId = (user.id || user._id)?.toString();
            const saved = localStorage.getItem(`gearup_saved_cards_${userId}`);
            if (saved) {
                const parsed = JSON.parse(saved);
                setSavedCards(parsed);
                if (parsed.length > 0) {
                    setSelectedCardId(parsed[0].id);
                } else {
                    setSelectedCardId('new');
                }
            } else {
                // Seed a mock card for premium interactive demonstration of B2B payment flow
                const seeded = [
                    {
                        id: 'seeded-card-1',
                        cardholderName: user.name || 'Company Account',
                        cardNumberHidden: '•••• •••• •••• 4242',
                        brand: 'Visa',
                        expiryDate: '12/28'
                    }
                ];
                setSavedCards(seeded);
                setSelectedCardId('seeded-card-1');
            }
        }
    }, [user]);

    // Populate user profile address or load local storage saved address
    useEffect(() => {
        const savedCart = localStorage.getItem('wholesaler_cart');
        if (savedCart) {
            setCartItems(JSON.parse(savedCart));
        } else {
            router.replace('/wholesaler/cart');
        }

        // Try load saved address
        const savedAddress = localStorage.getItem('saved_checkout_address');
        if (savedAddress) {
            const parsed = JSON.parse(savedAddress);
            setFormData(prev => ({
                ...prev,
                shippingAddress: parsed.shippingAddress || '',
                city: parsed.city || '',
                area: parsed.area || '',
                postalCode: parsed.postalCode || '',
                contactNumber: parsed.contactNumber || '',
                altContactNumber: parsed.altContactNumber || ''
            }));
        } else if (user) {
            setFormData(prev => ({
                ...prev,
                shippingAddress: user.businessDetails?.address || '',
                city: user.businessDetails?.city || '',
                contactNumber: user.businessDetails?.phone || ''
            }));
        }

        const fetchWallet = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const res = await fetch(`${getApiBaseUrl()}/api/wallet/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    setWalletBalance(data.data.balance ?? 0);
                }
            } catch {
                setWalletBalance(0);
            }
        };
        fetchWallet();

        // Fetch platform settings for payment details
        const fetchSettings = async () => {
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    const res = await fetch(`${getApiBaseUrl()}/api/auth/settings`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                        cache: 'no-store'
                    });
                    const data = await res.json();
                    if (data.success && data.data) {
                        setPlatformSettings(data.data);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch platform settings', err);
            }
        };
        fetchSettings();

        setLoading(false);
    }, [user, router]);

    const totalAmount = cartItems.reduce((sum, item) => {
        const rate = 0.001; // 0.1% platform fee
        const total = (item.price * (1 + rate)) * item.quantity;
        return sum + total;
    }, 0);

    // Dynamic clean phone number validation
    const handlePhoneChange = (e) => {
        const val = e.target.value;
        const cleaned = val.replace(/[^\d+-]/g, '');
        setFormData(prev => ({ ...prev, contactNumber: cleaned }));
    };

    const validatePhone = (phone) => {
        if (!phone) return false;
        const plain = phone.replace(/[\s-]/g, '');
        return /^(03\d{9})$|^(\+923\d{9})$/.test(plain);
    };

    const validateCity = (inputCity) => {
        return isRecognizedCity(inputCity);
    };

    const processFile = (file) => {
        setUploadError(null);
        if (file.size > 5 * 1024 * 1024) {
            setUploadError("File size exceeds 5MB limit.");
            return;
        }
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            setUploadError("Only PDF, JPG, and PNG are supported.");
            return;
        }
        setPaymentProof(file);
        setUploaded(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) processFile(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateCity(formData.city)) {
            setError(`'${formData.city}' is not a recognized city. Please select from the suggestion list.`);
            return;
        }

        if (!validatePhone(formData.contactNumber)) {
            setError('Please enter a valid Pakistan mobile number starting with 03 or +923 (e.g. 03001234567).');
            return;
        }

        const useWallet = paymentMode === 'platform_wallet';

        if (!useWallet) {
            if (!paymentProof) {
                setError('Please upload a copy of your bank deposit or transfer slip to proceed.');
                return;
            }
            if (!formData.transactionId) {
                setError('Please enter the Transaction ID.');
                return;
            }
        } else if (walletBalance !== null && totalAmount > walletBalance) {
            setError(`Insufficient dummy wallet balance. You need PKR ${totalAmount.toLocaleString()} but have PKR ${walletBalance.toLocaleString()}.`);
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            
            let paymentProofPath = '';
            if (!useWallet && paymentProof) {
                const fileData = new FormData();
                fileData.append('file', paymentProof);
                const uploadRes = await fetch(`${getApiBaseUrl()}/api/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: fileData
                });
                const uploadData = await uploadRes.json();
                if (uploadData.success) {
                    paymentProofPath = uploadData.filePath;
                }
            }

            // Save address check
            if (saveAddressChecked) {
                localStorage.setItem('saved_checkout_address', JSON.stringify({
                    shippingAddress: formData.shippingAddress,
                    city: formData.city,
                    area: formData.area,
                    postalCode: formData.postalCode,
                    contactNumber: formData.contactNumber,
                    altContactNumber: formData.altContactNumber
                }));
            }

            // Merge details for backward compatibility
            const concatenatedAddress = `${formData.shippingAddress}${formData.area ? ', Area: ' + formData.area : ''}${formData.postalCode ? ', Postal: ' + formData.postalCode : ''}`;
            const combinedNotes = `${formData.notes}${formData.deliveryNotes ? ' | Loading instructions: ' + formData.deliveryNotes : ''}`;

            const response = await fetch(`${getApiBaseUrl()}/api/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    items: cartItems.map(item => ({
                        product: item.productId,
                        quantity: item.quantity,
                        price: item.price
                    })),
                    shippingAddress: {
                        address: concatenatedAddress,
                        city: formData.city,
                        phone: formData.contactNumber
                    },
                    paymentMethod: useWallet ? 'platform_wallet' : 'escrow_transfer',
                    transactionReference: useWallet ? `WALLET-${Date.now()}` : formData.transactionId,
                    notes: combinedNotes,
                    paymentProof: paymentProofPath || undefined
                })
            });

            const data = await response.json();
            if (data.success) {
                localStorage.removeItem('wholesaler_cart');
                try {
                    const walletRes = await fetch(`${getApiBaseUrl()}/api/wallet/me`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const walletData = await walletRes.json();
                    if (walletData.success) {
                        setWalletBalance(walletData.data.balance ?? 0);
                    }
                } catch {
                    /* ignore */
                }
                setSuccess(true);
                setTimeout(() => {
                    router.push('/wholesaler/orders');
                }, 3000);
            } else {
                setError(data.error || 'Order could not be placed.');
            }
        } catch (err) {
            setError('Connection failure. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return null;

    if (success) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center p-6 bg-[#F8FAFC]/30">
                <div className="max-w-md w-full min-w-[320px] sm:min-w-[420px] shrink-0 bg-white rounded-3xl border border-slate-100 p-8 text-center shadow-md relative overflow-hidden transition-all duration-300">
                    
                    {/* Decorative backdrop glow */}
                    <div className="absolute -top-12 -left-12 w-24 h-24 bg-emerald-50 rounded-full blur-xl opacity-60"></div>
                    <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-blue-50 rounded-full blur-xl opacity-60"></div>

                    {/* Success Icon block */}
                    <div className="w-16 h-16 bg-emerald-50 text-[#00A878] rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-emerald-100/50 mb-6">
                        <CheckCircle size={32} />
                    </div>

                    {/* Content Header */}
                    <div className="space-y-2 mb-8">
                        <h2 className="font-sans text-[20px] font-[800] text-[#0F172A] tracking-tight leading-normal">
                            Order Placed Successfully
                        </h2>
                        <p className="font-sans text-[#64748B] font-[600] text-[12px] leading-relaxed max-w-xs mx-auto">
                            Your wholesale order has been placed successfully.
                        </p>
                    </div>

                    {/* Action CTAs */}
                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-center mb-6">
                        <button
                            onClick={() => router.push('/wholesaler/orders')}
                            className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-sans font-[700] text-[12px] uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
                        >
                            View Orders
                        </button>
                        <button
                            onClick={() => router.push('/wholesaler/marketplace')}
                            className="w-full sm:w-auto px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-150 rounded-xl font-sans font-[700] text-[12px] uppercase tracking-wider transition-all cursor-pointer"
                        >
                            Continue Shopping
                        </button>
                    </div>

                    {/* Redirect timer block */}
                    <div className="pt-4 border-t border-slate-50 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Redirecting to orders...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-16">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
                <div>
                    <h1 className="font-sans text-[30px] font-[800] text-[#0F172A] tracking-tight leading-none">Checkout</h1>
                    <p className="font-sans text-[15px] font-[500] text-[#64748B] mt-1">Complete your wholesale procurement.</p>
                </div>
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-[#E5E7EB] hover:border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded-[14px] font-sans font-[700] text-[12px] uppercase tracking-wider shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-all w-fit"
                >
                    <ArrowLeft size={12} /> Back to Cart
                </button>
            </div>

            <form onSubmit={handleSubmit} className="grid lg:grid-cols-12 gap-8 items-start mt-4">
                {/* Left Forms column - 7 cols */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Delivery Form */}
                    <div className="bg-[#FFFFFF] rounded-[24px] border border-[#E5E7EB] p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] space-y-6">
                        <h3 className="font-sans text-[18px] font-[800] text-[#0F172A] tracking-tight flex items-center gap-3 border-b border-[#E5E7EB] pb-4">
                            <Truck className="text-[#00A878]" size={20} /> Shipping &amp; Logistics Details
                        </h3>

                        <div className="space-y-4">
                            {/* Row 1: Shipping Address & City */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="font-sans text-[11px] font-[700] text-[#64748B] uppercase tracking-widest ml-1">Shipping Address <span className="text-[#EF4444]">*</span></label>
                                    <textarea
                                        required
                                        rows={3}
                                        value={formData.shippingAddress}
                                        onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                                        className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-[16px] px-5 py-3.5 font-sans font-[600] text-[14px] text-[#0F172A] focus:border-[#00A878] focus:ring-4 focus:ring-[#00A878]/10 outline-none transition-all text-sm resize-none"
                                        placeholder="Enter full street address, shop number, or warehouse details"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="font-sans text-[11px] font-[700] text-[#64748B] uppercase tracking-widest ml-1">City <span className="text-[#EF4444]">*</span></label>
                                    <SearchableCityInput
                                        value={formData.city}
                                        onChange={(val) => setFormData({ ...formData, city: val })}
                                        errorState={formData.city && !validateCity(formData.city)}
                                    />
                                </div>
                            </div>

                            {/* Row 2: Area / Sector / Town & Postal Code */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="font-sans text-[11px] font-[700] text-[#64748B] uppercase tracking-widest ml-1">Area / Sector / Town <span className="text-[#EF4444]">*</span></label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.area}
                                        onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                                        className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-[16px] px-5 py-3.5 font-sans font-[600] text-[14px] text-[#0F172A] focus:border-[#00A878] focus:ring-4 focus:ring-[#00A878]/10 outline-none transition-all text-sm"
                                        placeholder="e.g. DHA, Gulberg, Industrial Area"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="font-sans text-[11px] font-[700] text-[#64748B] uppercase tracking-widest ml-1">Postal Code (Optional)</label>
                                    <input
                                        type="text"
                                        value={formData.postalCode}
                                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value.replace(/\D/g, '') })}
                                        className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-[16px] px-5 py-3.5 font-sans font-[600] text-[14px] text-[#0F172A] focus:border-[#00A878] focus:ring-4 focus:ring-[#00A878]/10 outline-none transition-all text-sm"
                                        placeholder="e.g. 51310"
                                    />
                                </div>
                            </div>

                            {/* Row 3: Contact Number & Alternative Phone */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="font-sans text-[11px] font-[700] text-[#64748B] uppercase tracking-widest ml-1">Contact Number <span className="text-[#EF4444]">*</span></label>
                                    <input
                                        required
                                        type="tel"
                                        value={formData.contactNumber}
                                        onChange={handlePhoneChange}
                                        className={`w-full bg-[#F8FAFC] border rounded-[16px] px-5 py-3.5 font-sans font-[600] text-[14px] text-[#0F172A] focus:border-[#00A878] focus:ring-4 focus:ring-[#00A878]/10 outline-none transition-all text-sm ${
                                            formData.contactNumber && !validatePhone(formData.contactNumber) ? 'border-red-300 ring-red-50 focus:border-red-500' : 'border-[#E5E7EB] focus:border-[#00A878]'
                                        }`}
                                        placeholder="e.g. 0300-1234567 or +923001234567"
                                    />
                                    {formData.contactNumber && !validatePhone(formData.contactNumber) && (
                                        <p className="text-[9px] font-sans font-[700] text-[#EF4444] uppercase tracking-wider mt-1 leading-none">
                                            Enter valid Pakistan mobile number (e.g. 03001234567)
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="font-sans text-[11px] font-[700] text-[#64748B] uppercase tracking-widest ml-1">Alternative Number (Optional)</label>
                                    <input
                                        type="tel"
                                        value={formData.altContactNumber}
                                        onChange={(e) => setFormData({ ...formData, altContactNumber: e.target.value.replace(/[^\d+-]/g, '') })}
                                        className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-[16px] px-5 py-3.5 font-sans font-[600] text-[14px] text-[#0F172A] focus:border-[#00A878] focus:ring-4 focus:ring-[#00A878]/10 outline-none transition-all text-sm"
                                        placeholder="e.g. 0321-7654321"
                                    />
                                </div>
                            </div>

                            {/* Row 4: Delivery Notes */}
                            <div className="space-y-2">
                                <label className="font-sans text-[11px] font-[700] text-[#64748B] uppercase tracking-widest ml-1">Delivery Notes / Loading instructions (Optional)</label>
                                <textarea
                                    rows={2}
                                    value={formData.deliveryNotes}
                                    onChange={(e) => setFormData({ ...formData, deliveryNotes: e.target.value })}
                                    className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-[16px] px-5 py-3.5 font-sans font-[600] text-[14px] text-[#0F172A] focus:border-[#00A878] focus:ring-4 focus:ring-[#00A878]/10 outline-none transition-all text-sm resize-none"
                                    placeholder="e.g. Warehouse hours, call before delivery, loading dock timing, landmarks"
                                />
                            </div>

                            {/* Row 5: Save Address Checkbox */}
                            <label className="flex items-center gap-3 cursor-pointer group mt-2 select-none">
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${saveAddressChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 group-hover:border-slate-400'}`}>
                                    {saveAddressChecked && <CheckCircle size={14} className="stroke-[3]" />}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={saveAddressChecked}
                                    onChange={(e) => setSaveAddressChecked(e.target.checked)}
                                />
                                <span className="font-sans text-[12px] text-[#475569] font-[700] uppercase tracking-wider">
                                    Save this address for future orders
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Payment Method Selector */}
                    <div className="bg-[#FFFFFF] rounded-[24px] border border-[#E5E7EB] p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] space-y-6">
                        <h3 className="font-sans text-[18px] font-[800] text-[#0F172A] tracking-tight flex items-center gap-3 border-b border-[#E5E7EB] pb-4">
                            <CreditCard className="text-[#00A878]" size={20} /> Payment Method
                        </h3>

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setPaymentMode('platform_wallet')}
                                className={`px-4 py-2 rounded-[14px] font-sans font-[700] text-[12px] uppercase tracking-wider border transition-all ${
                                    paymentMode === 'platform_wallet'
                                        ? 'bg-[#00A878] text-[#FFFFFF] border-[#00A878] shadow-[0_4px_12px_rgba(0,168,120,0.2)]'
                                        : 'bg-[#F8FAFC] text-[#64748B] border-[#E5E7EB] hover:border-[#CBD5E1]'
                                }`}
                            >
                                Dummy Wallet
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentMode('escrow_transfer')}
                                className={`px-4 py-2 rounded-[14px] font-sans font-[700] text-[12px] uppercase tracking-wider border transition-all ${
                                    paymentMode === 'escrow_transfer'
                                        ? 'bg-[#0F172A] text-[#FFFFFF] border-[#0F172A]'
                                        : 'bg-[#F8FAFC] text-[#64748B] border-[#E5E7EB] hover:border-[#CBD5E1]'
                                }`}
                            >
                                Bank Transfer
                            </button>
                        </div>

                        {paymentMode === 'platform_wallet' && (
                            <div className="bg-gradient-to-br from-[#071A35] to-[#1e3a5f] rounded-[20px] p-5 border border-[#FFFFFF]/10 text-[#FFFFFF] shadow-[0_8px_24px_rgba(7,26,53,0.15)] space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-sans text-[11px] font-[700] uppercase tracking-[0.1em] text-[#FFFFFF]/50">Prototype wallet balance</span>
                                    <Lock size={14} className="text-[#00A878]" />
                                </div>
                                <div className="font-sans text-[28px] font-[800] tracking-tight text-[#00A878]">
                                    PKR {typeof walletBalance === 'number' ? walletBalance.toLocaleString() : '…'}
                                </div>
                                <p className="font-sans text-[12px] text-[#FFFFFF]/60 leading-relaxed font-[500]">
                                    No real payment gateway. On confirm, funds are deducted instantly and held in escrow per seller until you confirm delivery.
                                </p>
                            </div>
                        )}

                        {paymentMode === 'escrow_transfer' && (
                        <div className="bg-[#F8FAFC] rounded-[20px] p-5 border border-[#E5E7EB] space-y-4">
                            <h4 className="font-sans font-[800] text-[14px] text-[#0F172A] uppercase tracking-wider">Admin Verified Payment Process</h4>
                            <p className="font-sans text-[13px] text-[#475569] leading-relaxed font-[500]">
                                Please transfer the total order amount to one of the official GearUp payment accounts below.
                                <br /><br />
                                After completing the payment:<br />
                                1. Upload your payment proof.<br />
                                2. Enter your transaction ID.<br />
                                3. Submit for verification.<br /><br />
                                The GearUp Administrator will review and verify your payment before order processing begins.
                            </p>
                            <div className="grid sm:grid-cols-3 gap-3">
                                <div className="bg-[#FFFFFF] p-4 rounded-[16px] border border-[#E5E7EB] shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                                    <h5 className="font-sans font-[700] text-[11px] text-[#64748B] uppercase tracking-widest mb-1 flex items-center gap-1.5"><Building2 size={12}/> Bank Transfer</h5>
                                    <div className="font-sans text-[13px] font-[700] text-[#0F172A]">{platformSettings?.platformBankDetails?.bankName || 'Loading...'}</div>
                                    <div className="font-sans text-[12px] font-[500] text-[#475569]">A/C: {platformSettings?.platformBankDetails?.accountNumber || 'Loading...'}</div>
                                    <div className="font-sans text-[12px] font-[500] text-[#475569] mt-1">Title: {platformSettings?.platformBankDetails?.accountTitle || 'Loading...'}</div>
                                </div>
                                <div className="bg-[#FFFFFF] p-4 rounded-[16px] border border-[#E5E7EB] shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                                    <h5 className="font-sans font-[700] text-[11px] text-[#64748B] uppercase tracking-widest mb-1 flex items-center gap-1.5"><Zap size={12}/> JazzCash</h5>
                                    <div className="font-sans text-[13px] font-[700] text-[#0F172A]">{platformSettings?.platformMobileMoney?.jazzCashNumber || 'Loading...'}</div>
                                    <div className="font-sans text-[12px] font-[500] text-[#475569] mt-1">Title: {platformSettings?.platformBankDetails?.accountTitle || 'Loading...'}</div>
                                </div>
                                <div className="bg-[#FFFFFF] p-4 rounded-[16px] border border-[#E5E7EB] shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                                    <h5 className="font-sans font-[700] text-[11px] text-[#64748B] uppercase tracking-widest mb-1 flex items-center gap-1.5"><Zap size={12}/> Easypaisa</h5>
                                    <div className="font-sans text-[13px] font-[700] text-[#0F172A]">{platformSettings?.platformMobileMoney?.easypaisaNumber || 'Loading...'}</div>
                                    <div className="font-sans text-[12px] font-[500] text-[#475569] mt-1">Title: {platformSettings?.platformBankDetails?.accountTitle || 'Loading...'}</div>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-emerald-100/50">
                                <div className="space-y-2">
                                    <label className="font-sans text-[11px] font-[700] text-[#64748B] uppercase tracking-widest inline-block mb-1.5 ml-1">Transaction ID <span className="text-[#EF4444]">*</span></label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.transactionId || ''}
                                        onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                                        className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-[16px] px-5 py-3.5 font-sans font-[600] text-[14px] text-[#0F172A] focus:border-[#00A878] focus:ring-4 focus:ring-[#00A878]/10 outline-none transition-all text-sm"
                                        placeholder="e.g. TID123456789"
                                    />
                                </div>
                            </div>
                        </div>
                        )}
                    </div>

                    {/* Bank Transfer Receipt Upload */}
                    {paymentMode === 'escrow_transfer' && (
                    <div className="bg-[#FFFFFF] rounded-[24px] border border-[#E5E7EB] p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] space-y-6 animate-fadeIn">
                        <h3 className="font-sans text-[18px] font-[800] text-[#0F172A] tracking-tight flex items-center gap-3 border-b border-[#E5E7EB] pb-4">
                            <Upload className="text-[#00A878]" size={20} /> Payment Receipt Verification
                        </h3>
                        
                        <div className="space-y-4">
                            <p className="font-sans text-[12px] text-[#94A3B8] uppercase tracking-widest leading-relaxed">
                                Upload a PDF, JPG, or PNG copy of your payment proof (Max 5MB) to initiate order fulfillment. Your proof will ONLY be sent to Admin.
                            </p>
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                                    uploaded ? 'border-emerald-500 bg-emerald-50/20' : 
                                    isDragOver ? 'border-emerald-500 bg-slate-50' : 'border-slate-200 hover:border-emerald-500 hover:bg-slate-50'
                                }`}
                            >
                                <input
                                    type="file"
                                    id="paymentProof"
                                    onChange={handleFileChange}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className="hidden"
                                />
                                <label htmlFor="paymentProof" className="cursor-pointer block w-full h-full">
                                    {uploaded ? (
                                        <div className="flex flex-col items-center justify-center">
                                            <CheckCircle className="text-[#00A878] mb-2" size={32} />
                                            <span className="font-sans text-[12px] text-[#065F46] font-[700]">{paymentProof?.name}</span>
                                            <span className="text-[9px] font-sans text-[#94A3B8] uppercase tracking-widest mt-1">Click to change file</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center">
                                            <Upload className="text-slate-300 mb-2" size={32} />
                                            <span className="font-sans text-[12px] text-[#64748B] font-[700] uppercase tracking-wider block">Drag &amp; Drop receipt here</span>
                                            <span className="text-[9px] font-sans text-[#94A3B8] uppercase tracking-widest mt-1">or Click to select file</span>
                                        </div>
                                    )}
                                </label>
                            </div>
                            {uploadError && (
                                <p className="text-[10px] font-sans font-[800] text-[#EF4444] uppercase tracking-widest animate-pulse flex items-center gap-1.5">
                                    <AlertCircle size={12} /> {uploadError}
                                </p>
                            )}
                        </div>
                    </div>
                    )}

                </div>

                {/* Right Summary Column - 5 cols */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Sticky Summary Card */}
                    <div className="bg-gradient-to-br from-[#071A35] to-[#00A878] rounded-[24px] p-6 text-[#FFFFFF] shadow-[0_16px_40px_rgba(0,168,120,0.2)] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-[#FFFFFF]/10 blur-[80px] -mr-24 -mt-24 rounded-full"></div>

                        <h2 className="font-sans text-[18px] font-[800] tracking-tight mb-6 text-[#FFFFFF] flex items-center gap-2">
                            <Zap size={20} /> Order Summary
                        </h2>

                        <div className="space-y-4 mb-6 max-h-[220px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                            {cartItems.map((item, i) => (
                                <div key={i} className="flex justify-between items-start gap-4 pb-4 border-b border-white/5 last:border-0 last:pb-0">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-sans font-[700] text-[#FFFFFF] text-[14px] truncate">{item.name}</div>
                                        <p className="font-sans text-[11px] font-[600] text-[#FFFFFF]/70 uppercase tracking-widest mt-0.5">{item.quantity} {item.bulkUnit === 'Dozen' ? 'Dozens' : 'Packs'} × PKR {item.price.toLocaleString()}</p>
                                    </div>
                                    <div className="font-sans font-[700] text-[#FFFFFF] text-[14px] whitespace-nowrap">PKR {(item.price * item.quantity).toLocaleString()}</div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-6 border-t border-white/10 space-y-6">
                            <div className="flex justify-between items-center pb-4 border-b border-white/5">
                                <span className="text-[10px] font-sans font-[800] text-[#FFFFFF]/30 uppercase tracking-wider">Estimated Delivery</span>
                                <span className="text-[10px] font-sans font-[800] text-[#00A878] uppercase tracking-wider">3-5 Business Days</span>
                            </div>

                            <div>
                                <div className="font-sans text-[11px] font-[600] text-[#FFFFFF]/80 uppercase tracking-widest mb-1">Total Payable Amount</div>
                                <div className="font-sans text-[32px] font-[800] text-[#FFFFFF] tracking-tight leading-none">PKR {totalAmount.toLocaleString()}</div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full h-[56px] bg-[#FFFFFF] text-[#071A35] hover:bg-[#F8FAFC] shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:-translate-y-1 rounded-[14px] font-sans font-[800] text-[13px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" /> Processing order...
                                    </>
                                ) : (
                                    <>
                                        {paymentMode === 'platform_wallet' ? 'Confirm Payment' : 'Confirm & Place Order'} <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
                                    </>
                                )}
                            </button>

                            {error && (
                                <div className="p-4 bg-red-400/10 border border-red-400/20 rounded-xl flex items-center gap-3 text-[#F87171] font-sans font-[700] text-[10px] uppercase tracking-widest leading-relaxed">
                                    <AlertCircle size={16} className="shrink-0" /> {error}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Trust Block */}
                    <div className="bg-[#FFFFFF] rounded-[24px] border border-[#E5E7EB] p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-emerald-50 text-[#00A878] rounded-xl flex items-center justify-center">
                                <ShieldCheck size={20} />
                            </div>
                            <h4 className="font-sans text-[14px] font-[800] text-[#0F172A] uppercase tracking-tight">Marketplace Buyer Protection</h4>
                        </div>
                        <ul className="space-y-2.5">
                            {[
                                'Secure payment verification logs',
                                'Official digital invoice generation',
                                'Direct manufacturer support system',
                                'Real-time logistics milestone tracking'
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-2.5 font-sans text-[11px] font-[700] text-[#64748B] uppercase tracking-widest">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0"></div> {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default WholesalerCheckoutPage;
