"use client";

import { getApiBaseUrl } from '@/lib/api';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Search,
    Filter,
    MapPin,
    CheckCircle,
    Package,
    ShoppingCart,
    MessageCircle,
    Clock,
    AlertCircle,
    ChevronDown,
    X,
    FilterX,
    TrendingUp,
    Shield,
    Sparkles
} from 'lucide-react';
import PageShell from '@/components/dashboard/PageShell';
import PageHeader from '@/components/dashboard/PageHeader';
import { useAuth } from '@/context/AuthContext';
import SponsoredProducts from '@/components/ads/SponsoredProducts';
import { AD_SYSTEM_ENABLED } from '@/lib/advertisingConfig';
import { fetchSponsoredProducts, mapSponsoredItem } from '@/lib/advertisingApi';
import {
    fetchMarketplaceCategories,
    formatCategoryLabel,
    normalizeCategoryValue,
    resolveProductImageUrl,
} from '@/lib/marketplaceData';
import { formatMoqDisplay } from '@/utils/moq';
import { normalizeLoadedPackSize } from '@/lib/bulkPackaging';

const isAdvertisementSystemEnabled = AD_SYSTEM_ENABLED;

// Pakistan comprehensive location list
const PAKISTAN_LOCATIONS = [
    { id: 'sialkot', name: 'Sialkot', region: 'Punjab', type: 'Industrial Hub', popular: true },
    { id: 'lahore', name: 'Lahore', region: 'Punjab', type: 'Major City', popular: true },
    { id: 'karachi', name: 'Karachi', region: 'Sindh', type: 'Major City', popular: true },

    // Punjab
    { id: 'gujranwala', name: 'Gujranwala', region: 'Punjab', type: 'Industrial Hub' },
    { id: 'faisalabad', name: 'Faisalabad', region: 'Punjab', type: 'Industrial Hub' },
    { id: 'multan', name: 'Multan', region: 'Punjab', type: 'Major City' },
    { id: 'gujrat', name: 'Gujrat', region: 'Punjab', type: 'Industrial Hub' },
    { id: 'wazirabad', name: 'Wazirabad', region: 'Punjab', type: 'Manufacturing Town' },
    { id: 'sahiwal', name: 'Sahiwal', region: 'Punjab', type: 'City' },
    { id: 'bahawalpur', name: 'Bahawalpur', region: 'Punjab', type: 'City' },
    { id: 'rawalpindi', name: 'Rawalpindi', region: 'Punjab', type: 'Major City' },
    { id: 'sialkot-cantt', name: 'Sialkot Cantt', region: 'Punjab', type: 'Town' },
    { id: 'daska', name: 'Daska', region: 'Punjab', type: 'Manufacturing Town' },
    { id: 'sambrial', name: 'Sambrial', region: 'Punjab', type: 'Town' },

    // Sindh
    { id: 'hyderabad', name: 'Hyderabad', region: 'Sindh', type: 'Major City' },
    { id: 'sukkur', name: 'Sukkur', region: 'Sindh', type: 'City' },
    { id: 'larkana', name: 'Larkana', region: 'Sindh', type: 'City' },
    { id: 'mirpurkhas', name: 'Mirpur Khas', region: 'Sindh', type: 'City' },

    // KPK
    { id: 'peshawar', name: 'Peshawar', region: 'KPK', type: 'Major City' },
    { id: 'mardan', name: 'Mardan', region: 'KPK', type: 'City' },
    { id: 'abbottabad', name: 'Abbottabad', region: 'KPK', type: 'City' },
    { id: 'swat', name: 'Swat', region: 'KPK', type: 'Region' },

    // Balochistan
    { id: 'quetta', name: 'Quetta', region: 'Balochistan', type: 'Major City' },
    { id: 'gwadar', name: 'Gwadar', region: 'Balochistan', type: 'Industrial Hub' },

    // Islamabad
    { id: 'islamabad', name: 'Islamabad', region: 'Federal', type: 'Capital City' },

    // Gilgit Baltistan / AJK
    { id: 'gilgit', name: 'Gilgit', region: 'Gilgit Baltistan', type: 'Region' },
    { id: 'muzaffarabad', name: 'Muzaffarabad', region: 'AJK', type: 'Region' },
    { id: 'mirpur-ajk', name: 'Mirpur (AJK)', region: 'AJK', type: 'Region' }
];

// Reusable Searchable Dropdown for Pakistan Regions
const SearchableLocationDropdown = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = React.useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredLocations = useMemo(() => {
        if (!search) return PAKISTAN_LOCATIONS;
        return PAKISTAN_LOCATIONS.filter(loc => 
            loc.name.toLowerCase().includes(search.toLowerCase()) ||
            loc.region.toLowerCase().includes(search.toLowerCase()) ||
            (loc.type && loc.type.toLowerCase().includes(search.toLowerCase()))
        );
    }, [search]);

    const groupedLocations = useMemo(() => {
        const groups = {};
        filteredLocations.forEach(loc => {
            if (!groups[loc.region]) {
                groups[loc.region] = [];
            }
            groups[loc.region].push(loc);
        });
        return groups;
    }, [filteredLocations]);

    const selectedLocName = useMemo(() => {
        if (value === 'all') return 'All Pakistan';
        const found = PAKISTAN_LOCATIONS.find(loc => loc.id === value);
        return found ? found.name : value;
    }, [value]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="h-[56px] px-4 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] font-sans font-[700] text-[12px] uppercase tracking-wider text-[#0F172A] outline-none hover:border-[#94A3B8] transition-all flex items-center gap-2 select-none shadow-[0_2px_4px_rgba(15,23,42,0.02)]"
            >
                <MapPin size={16} className="text-[#94A3B8] shrink-0" />
                <span className="truncate max-w-[120px]">Loc: {selectedLocName}</span>
                <ChevronDown size={14} className={`transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute left-0 mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-xl w-72 max-h-[340px] overflow-hidden flex flex-col animate-scale-up">
                    <div className="p-3 border-b border-slate-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                placeholder="Search cities, towns..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-xs font-body text-slate-900 font-bold placeholder-slate-400"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-3 scrollbar-thin">
                        {!search && (
                            <div className="space-y-6.5">
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Popular Hubs</div>
                                <div className="flex flex-wrap gap-1 px-2">
                                    {PAKISTAN_LOCATIONS.filter(l => l.popular).map(loc => (
                                        <button
                                            key={loc.id}
                                            type="button"
                                            onClick={() => {
                                                onChange(loc.id);
                                                setIsOpen(false);
                                                setSearch('');
                                            }}
                                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 border border-emerald-100"
                                        >
                                            ⭐ {loc.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-6">
                            <button
                                type="button"
                                onClick={() => {
                                    onChange('all');
                                    setIsOpen(false);
                                    setSearch('');
                                }}
                                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold font-body transition-all flex items-center justify-between ${
                                    value === 'all' ? 'bg-slate-950 text-white' : 'hover:bg-slate-50 text-slate-700'
                                }`}
                            >
                                <span>🇵🇰 All Pakistan</span>
                                {value === 'all' && <CheckCircle size={12} className="text-emerald-400" />}
                            </button>

                            {Object.entries(groupedLocations).map(([region, locs]) => (
                                <div key={region} className="space-y-6">
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 pt-1 border-t border-slate-50">{region}</div>
                                    {locs.map(loc => (
                                        <button
                                            key={loc.id}
                                            type="button"
                                            onClick={() => {
                                                onChange(loc.id);
                                                setIsOpen(false);
                                                setSearch('');
                                            }}
                                            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold font-body transition-all flex items-center justify-between ${
                                                value === loc.id ? 'bg-slate-950 text-white' : 'hover:bg-slate-50 text-slate-700'
                                            }`}
                                        >
                                            <span className="flex items-center gap-1.5">
                                                <span>{loc.name}</span>
                                                <span className="text-[9px] font-medium text-slate-400">({loc.type})</span>
                                            </span>
                                            {value === loc.id && <CheckCircle size={12} className="text-emerald-400" />}
                                        </button>
                                    ))}
                                </div>
                            ))}

                            {filteredLocations.length === 0 && (
                                <div className="text-center py-4 text-slate-400 text-xs font-bold">No locations matched</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const MarketplacePage = ({ isDashboard = true }) => {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [filters, setFilters] = useState({
        industry: 'all',
        moq: 'all',
        location: 'all',
        verifiedOnly: false,
        searchQuery: '',
        sellerType: 'all',
    });

    const [sortBy, setSortBy] = useState('newest');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [chatOpeningId, setChatOpeningId] = useState(null);
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [sponsoredAds, setSponsoredAds] = useState([]);
    const [sponsoredProductIds, setSponsoredProductIds] = useState(new Set());

    useEffect(() => {
        fetchMarketplaceCategories()
            .then((categories) => {
                const filtered = categories.filter(c => {
                    const lc = String(c || '').toLowerCase();
                    return !lc.includes('apparel') && !lc.includes('accessories');
                });
                setCategoryOptions(filtered);
            })
            .catch(() => setCategoryOptions([]));
    }, []);

    useEffect(() => {
        if (!isAdvertisementSystemEnabled) return;
        const params = {
            category: filters.industry,
            keyword: filters.searchQuery || '',
            limit: 12,
            placement: 'sponsored_product'
        };
        fetchSponsoredProducts(params)
            .then((res) => {
                const ads = (res.data || []).map(mapSponsoredItem);
                setSponsoredAds(ads);
                const ids = new Set(ads.map((item) => String(item.id)));
                setSponsoredProductIds(ids);
            })
            .catch(() => {
                setSponsoredAds([]);
                setSponsoredProductIds(new Set());
            });
    }, [filters.industry, filters.searchQuery]);

    const fetchProducts = useCallback(async () => {
        if (authLoading) return;
        try {
            setLoading(true);
            const headers = {};
            let token = null;
            if (typeof window !== 'undefined') {
                token = localStorage.getItem('token');
                if (token) {
                    headers.Authorization = `Bearer ${token}`;
                }
            }
            if (user?.role === 'manufacturer' && !token) {
                setProducts([]);
                setError('Sign in again to browse the marketplace.');
                return;
            }
            const response = await fetch(`${getApiBaseUrl()}/api/products`, { headers });
            const data = await response.json();
            if (data.success) {
                setError(null);
                const viewerId = String(user?.id || user?._id || '');
                const mappedProducts = data.data
                    .map((p) => {
                        const seller = p.manufacturer || p.seller;
                        const sellerId = seller?._id ?? seller;
                        return {
                            id: p._id,
                            name: p.name,
                            image: resolveProductImageUrl(p.images?.[0] || p.image),
                            supplier: seller?.name || 'Unknown Seller',
                            sellerId,
                            location: seller?.businessDetails?.city || 'Pakistan',
                            moq: p.minimumOrderQuantity || 1,
                            price: p.pricePerBulkUnit || 0,
                            bulkUnit: p.bulkUnit || 'Dozen',
                            packSize: normalizeLoadedPackSize(p.bulkUnit || 'Dozen', p.packSize) || 12,
                            stock: p.stock || 0,
                            industry: (p.category || 'sports').toLowerCase(),
                            verified: seller?.businessDetails?.isVerified || seller?.verificationStatus === 'approved' || seller?.verificationStatus === 'verified' || false,
                            sellerRole: seller?.role || 'manufacturer'
                        };
                    })
                    .filter((product) => !viewerId || String(product.sellerId || '') !== viewerId);
                setProducts(mappedProducts);
            }
        } catch (err) {
            setError('Failed to connect to marketplace. Retrying...');
        } finally {
            setLoading(false);
        }
    }, [user?.id, user?.role, authLoading]);

    useEffect(() => {
        const handleAdCategory = (e) => {
            if (e.detail) {
                handleFilterChange('industry', e.detail);
            }
        };
        window.addEventListener('ad-category-filter', handleAdCategory);
        return () => window.removeEventListener('ad-category-filter', handleAdCategory);
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleAddToCart = (product) => {
        router.push(`/wholesaler/cart?add=${product.id}&qty=${product.moq}`);
    };

    const handleChatWithSeller = async (product) => {
        if (!user?.role || (user.role !== 'manufacturer' && user.role !== 'wholesaler')) return;
        try {
            setChatOpeningId(product.id);
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
            setChatOpeningId(null);
        }
    };

    const currentUserId = useMemo(
        () => String(user?.id || user?._id || ''),
        [user?.id, user?._id]
    );

    const applyProductFilters = useCallback((items) => {
        return items.filter((product) => {
            if (filters.industry !== 'all' && product.industry !== filters.industry) return false;
            if (filters.location !== 'all' && !product.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
            if (filters.verifiedOnly && !product.verified) return false;
            if (filters.moq !== 'all') {
                const moqValue = parseInt(filters.moq, 10);
                if (product.moq > moqValue) return false;
            }
            if (
                filters.searchQuery &&
                !product.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) &&
                !product.supplier.toLowerCase().includes(filters.searchQuery.toLowerCase())
            ) {
                return false;
            }
            if (filters.sellerType !== 'all' && product.sellerRole !== filters.sellerType) return false;
            return true;
        });
    }, [filters]);

    const sortProductList = useCallback((items, excludeSponsored = true) => {
        let list = [...items];
        if (excludeSponsored && isAdvertisementSystemEnabled && sponsoredProductIds.size) {
            list = list.filter((p) => !sponsoredProductIds.has(String(p.id)));
        }
        if (sortBy === 'price_low') {
            list.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'price_high') {
            list.sort((a, b) => b.price - a.price);
        } else if (sortBy === 'verified') {
            list.sort((a, b) => (b.verified ? 1 : 0) - (a.verified ? 1 : 0));
        } else {
            list.sort((a, b) => b.id.localeCompare(a.id));
        }
        return list;
    }, [sortBy, sponsoredProductIds]);

    const sortedProducts = useMemo(() => {
        const list = sortProductList(applyProductFilters(products));
        if (sponsoredAds.length > 0) {
            const merged = [];
            let adIndex = 0;
            // Always put the first sponsored ad at the very top of the marketplace
            if (sponsoredAds.length > 0) {
                merged.push(sponsoredAds[adIndex]);
                adIndex++;
            }
            for (let i = 0; i < list.length; i++) {
                merged.push(list[i]);
                // Inject subsequent ads every 4th spot
                if (i > 0 && i % 4 === 0 && adIndex < sponsoredAds.length) {
                    merged.push(sponsoredAds[adIndex]);
                    adIndex++;
                }
            }
            while (adIndex < sponsoredAds.length) {
                merged.push(sponsoredAds[adIndex]);
                adIndex++;
            }
            return merged;
        }
        return list;
    }, [products, applyProductFilters, sortProductList, sponsoredAds]);

    const totalProducts = products.length;
    const verifiedSuppliersCount = new Set(products.filter(p => p.verified).map(p => p.supplier)).size;
    const activeCategoriesCount = new Set(products.map(p => p.industry)).size;

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#E2E8F0] border-b-[#00A878] rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="font-body font-bold text-[#64748B] uppercase tracking-widest text-xs">Loading Marketplace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-16">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="font-heading text-3xl font-black text-[#0F172A] tracking-tight">Marketplace</h1>
                    <p className="text-slate-500 font-medium text-sm mt-1 max-w-xl leading-relaxed">
                        Source premium sports equipment directly from verified manufacturing partners. Discover, negotiate, and order in bulk with absolute confidence.
                    </p>
                </div>
                
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 bg-[#F8FAFC] px-4 py-2.5 rounded-xl border border-[#E5E7EB] shadow-sm">
                        <Package size={16} className="text-[#00A878]" />
                        <span className="font-bold text-[#0F172A] text-sm">{totalProducts || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-[#F8FAFC] px-4 py-2.5 rounded-xl border border-[#E5E7EB] shadow-sm">
                        <Shield size={16} className="text-[#00A878]" />
                        <span className="font-bold text-[#0F172A] text-sm">{verifiedSuppliersCount || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2.5 bg-[#E8FFF5] px-4 py-2.5 rounded-xl border border-[#00A878]/20 text-[#00A878] shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-[#00A878] animate-pulse"></div>
                        <span className="font-bold text-sm tracking-wide">Live Market</span>
                    </div>
                </div>
            </div>

            {/* Combined Search + Filters Row */}
            <div className="filter-bar-enterprise flex flex-wrap items-center gap-4">
                {/* Search Field */}
                <div className="relative flex-1 min-w-[240px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={20} />
                    <input
                        type="text"
                        placeholder="Search premium products or suppliers..."
                        value={filters.searchQuery}
                        onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                        className="search-enterprise"
                    />
                </div>

                {/* Category Dropdown */}
                <select
                    value={filters.industry}
                    onChange={(e) => handleFilterChange('industry', e.target.value)}
                    className="h-[56px] px-4 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] font-sans font-[700] text-[12px] uppercase tracking-wider text-[#0F172A] outline-none hover:border-[#94A3B8] transition-all appearance-none cursor-pointer shadow-[0_2px_4px_rgba(15,23,42,0.02)] focus:border-[#00A878] focus:ring-[4px] focus:ring-[#00A878]/10"
                >
                    <option value="all">All Categories</option>
                    {categoryOptions.map((category) => (
                        <option key={category} value={normalizeCategoryValue(category)}>
                            {formatCategoryLabel(category)}
                        </option>
                    ))}
                </select>

                {/* Seller Type Dropdown */}
                <select
                    value={filters.sellerType}
                    onChange={(e) => handleFilterChange('sellerType', e.target.value)}
                    className="h-[56px] px-4 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] font-sans font-[700] text-[12px] uppercase tracking-wider text-[#0F172A] outline-none hover:border-[#94A3B8] transition-all appearance-none cursor-pointer shadow-[0_2px_4px_rgba(15,23,42,0.02)] focus:border-[#00A878] focus:ring-[4px] focus:ring-[#00A878]/10"
                >
                    <option value="all">Seller Type: All</option>
                    <option value="manufacturer">Manufacturer</option>
                    <option value="wholesaler">Wholesaler</option>
                </select>

                {/* Highly Scalable Searchable Location Dropdown */}
                <SearchableLocationDropdown
                    value={filters.location}
                    onChange={(val) => handleFilterChange('location', val)}
                />

                {/* Verified Switch Toggle */}
                <label className="flex items-center gap-3 h-[56px] px-4 border border-[#E5E7EB] rounded-[14px] bg-[#FFFFFF] shadow-[0_2px_4px_rgba(15,23,42,0.02)] hover:border-[#94A3B8] cursor-pointer group transition-all">
                    <div className={`w-8 h-4.5 rounded-full p-0.5 transition-all duration-300 ${filters.verifiedOnly ? 'bg-[#00A878]' : 'bg-[#E2E8F0]'}`}>
                        <div className={`w-3.5 h-3.5 bg-[#FFFFFF] rounded-full transition-transform duration-300 shadow-sm ${filters.verifiedOnly ? 'translate-x-3.5' : 'translate-x-0'}`}></div>
                    </div>
                    <input
                        type="checkbox"
                        className="hidden"
                        checked={filters.verifiedOnly}
                        onChange={(e) => handleFilterChange('verifiedOnly', e.target.checked)}
                    />
                    <span className="font-sans font-[700] text-[11px] uppercase tracking-widest text-[#64748B] flex items-center gap-1.5 select-none transition-colors group-hover:text-[#0F172A]">
                        <Shield className={filters.verifiedOnly ? 'text-[#00A878]' : 'text-[#94A3B8]'} size={16} /> Verified Only
                    </span>
                </label>

                {/* Sort Dropdown */}
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="h-[56px] px-4 bg-[#FFFFFF] border border-[#E5E7EB] rounded-[14px] font-sans font-[700] text-[12px] uppercase tracking-wider text-[#0F172A] outline-none hover:border-[#94A3B8] transition-all appearance-none cursor-pointer shadow-[0_2px_4px_rgba(15,23,42,0.02)] focus:border-[#00A878] focus:ring-[4px] focus:ring-[#00A878]/10 ml-auto lg:ml-0"
                >
                    <option value="newest">Sort: Newest</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="verified">Sort: Verified First</option>
                </select>

                {/* Reset button */}
                {(filters.industry !== 'all' || filters.location !== 'all' || filters.verifiedOnly || filters.searchQuery || filters.sellerType !== 'all' || sortBy !== 'newest') && (
                    <button
                        onClick={() => {
                            setFilters({ industry: 'all', moq: 'all', location: 'all', verifiedOnly: false, searchQuery: '', sellerType: 'all' });
                            setSortBy('newest');
                        }}
                        className="flex items-center gap-1.5 h-[56px] px-4 bg-[#FEF2F2] text-[#EF4444] rounded-[14px] font-sans font-[700] text-[11px] uppercase tracking-widest hover:bg-[#EF4444] hover:text-[#FFFFFF] transition-all ml-auto md:ml-0 shadow-sm hover:shadow-md"
                    >
                        <FilterX size={16} /> Reset
                    </button>
                )}
            </div>

            {/* Quick Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {[{ id: 'all', label: 'All Categories' }, ...categoryOptions.map((category) => ({
                    id: normalizeCategoryValue(category),
                    label: formatCategoryLabel(category),
                }))].map((cat) => {
                    const isActive = filters.industry === cat.id;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => handleFilterChange('industry', cat.id)}
                            className={`px-5 py-2 rounded-full text-[12px] font-[700] font-sans transition-all whitespace-nowrap uppercase tracking-widest ${
                                isActive
                                    ? 'bg-[#00A878] text-white shadow-[0_8px_18px_rgba(0,168,120,0.25)]'
                                    : 'bg-[#F8FAFC] text-[#64748B] border border-[#E5E7EB] hover:bg-[#E5E7EB] hover:text-[#0F172A]'
                            }`}
                        >
                            {cat.label}
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedProducts.map((product) => (
                    <div key={product.id} className={`product-card-enterprise h-full group relative overflow-hidden transition-all duration-300 ${product.sponsored ? 'border-[1.5px] border-amber-400/60 shadow-[0_0_20px_rgba(251,191,36,0.15)] hover:shadow-[0_0_30px_rgba(251,191,36,0.3)] hover:-translate-y-1 bg-gradient-to-b from-amber-50/30 to-white' : ''}`}>
                        {/* Subtle background glow for sponsored */}
                        {product.sponsored && (
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent pointer-events-none z-0" />
                        )}

                        {/* Fixed Visual Asset System */}
                        <div className={`product-image-wrapper border-b p-4 relative z-10 ${product.sponsored ? 'border-amber-200/50' : 'border-[#E5E7EB]'}`}>
                            {product.image ? (
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-contain mix-blend-multiply drop-shadow-sm group-hover:scale-105 transition-transform duration-500"
                                    onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = resolveProductImageUrl(null);
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[#94A3B8]">
                                    <Package size={48} className="stroke-[1.5]" />
                                </div>
                            )}

                            {/* Trust Badges */}
                            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                                {product.verified ? (
                                    <div className="px-2.5 py-1 bg-[#00A878] text-[#FFFFFF] rounded-full text-[10px] font-[700] uppercase tracking-widest flex items-center gap-1 shadow-sm">
                                        <CheckCircle size={12} /> Verified
                                    </div>
                                ) : (
                                    <div className="px-2.5 py-1 bg-[#64748B] text-[#FFFFFF] rounded-full text-[10px] font-[700] uppercase tracking-widest shadow-sm">
                                        {product.sellerRole === 'wholesaler' ? 'Wholesaler' : 'Manufacturer'}
                                    </div>
                                )}
                            </div>

                            <div className="absolute top-3 right-3 z-10 flex gap-2">
                                {product.sponsored && (
                                    <div className="px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_4px_10px_rgba(245,158,11,0.3)] flex items-center gap-1 border border-amber-400/50">
                                        <Sparkles size={12} className="text-amber-100" />
                                        Sponsored
                                    </div>
                                )}
                                <div className={`px-2.5 py-1 backdrop-blur-sm rounded-full text-[10px] font-[700] uppercase tracking-widest shadow-sm ${product.sponsored ? 'bg-amber-100/90 text-amber-900 border border-amber-200' : 'bg-[#FFFFFF]/95 text-[#0F172A] border border-[#E5E7EB]'}`}>
                                    {product.industry}
                                </div>
                            </div>
                        </div>

                        {/* Data Points */}
                        <div className="p-5 flex-1 flex flex-col justify-between relative z-10">
                            <div>
                                <h3 className={`font-sans text-[16px] font-[700] transition-colors line-clamp-2 min-h-[48px] mb-3 leading-snug ${product.sponsored ? 'text-amber-950 group-hover:text-amber-600' : 'text-[#0F172A] group-hover:text-[#00A878]'}`} title={product.name}>
                                    {product.name}
                                </h3>
                                <div className="flex flex-col gap-2 text-[#64748B] font-sans font-[500] text-[12px]">
                                    <span className="flex items-center gap-2 truncate text-[#0F172A]">
                                        <Package size={14} className="text-[#94A3B8] shrink-0" /> {product.supplier}
                                    </span>
                                    <span className="flex items-center gap-2 whitespace-nowrap">
                                        <MapPin size={14} className="text-[#94A3B8] shrink-0" /> {product.location}
                                    </span>
                                </div>
                            </div>

                            {/* Price / MOQ splitting divider grid */}
                            <div className={`grid grid-cols-2 gap-4 py-4 border-y my-5 shrink-0 ${product.sponsored ? 'border-amber-100/60' : 'border-[#F1F5F9]'}`}>
                                <div>
                                    <div className={`font-sans text-[10px] font-[700] uppercase tracking-widest mb-1 ${product.sponsored ? 'text-amber-700/70' : 'text-[#94A3B8]'}`}>Price Per {product.bulkUnit}</div>
                                    <div className={`font-sans font-[800] text-[18px] ${product.sponsored ? 'text-amber-600' : 'text-[#00A878]'}`}>PKR {product.price.toLocaleString()}</div>
                                </div>
                                <div>
                                    <div className="font-sans text-[10px] font-[700] text-[#94A3B8] uppercase tracking-widest mb-1">Min Order</div>
                                    {(() => {
                                        const moqLabel = formatMoqDisplay(product.moq, product.bulkUnit, product.packSize);
                                        return (
                                            <>
                                                <div className="font-sans font-[800] text-[#0F172A] text-[15px] mt-0.5">{moqLabel.primary}</div>
                                                {moqLabel.secondary && (
                                                    <div className="font-sans text-[11px] font-[600] text-[#64748B] mt-0.5">{moqLabel.secondary}</div>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Interactive triggers */}
                            <div className="space-y-3 shrink-0">
                                <div className="flex gap-2">
                                    {(!user || String(product?.sellerId || '') !== currentUserId) ? (
                                        <button
                                            type="button"
                                            onClick={() => handleAddToCart(product)}
                                            className="flex-1 flex items-center justify-center gap-2 h-[44px] bg-[#00A878] hover:bg-[#0DBB85] text-[#FFFFFF] rounded-[12px] font-sans font-[700] text-[12px] uppercase tracking-widest transition-all shadow-[0_8px_20px_rgba(0,168,120,0.25)] hover:-translate-y-0.5"
                                        >
                                            <ShoppingCart size={16} /> Add to cart
                                        </button>
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center h-[44px] bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0] rounded-[12px] font-sans font-[700] text-[12px] uppercase tracking-widest select-none">
                                            Your Product
                                        </div>
                                    )}
                                    {user && String(product?.sellerId || '') !== currentUserId && (
                                        <button
                                            type="button"
                                            disabled={chatOpeningId === product.id}
                                            onClick={() => handleChatWithSeller(product)}
                                            title="Chat with seller"
                                            className="h-[44px] w-[44px] flex items-center justify-center border border-[#E5E7EB] text-[#0F172A] rounded-[12px] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] transition-all disabled:opacity-50 shrink-0 shadow-sm bg-[#FFFFFF]"
                                        >
                                            <MessageCircle size={18} />
                                        </button>
                                    )}
                                </div>
                                <Link
                                    href={`/wholesaler/marketplace/product/${product.id}`}
                                    className="flex items-center justify-center h-[40px] w-full border border-[#E5E7EB] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] rounded-[12px] font-sans font-[700] text-[11px] uppercase tracking-widest text-[#64748B] hover:text-[#0F172A] transition-all"
                                >
                                    View Details
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}

                {sortedProducts.length === 0 && (
                    <div className="col-span-full empty-state-enterprise">
                        <div className="icon-circle">
                            <FilterX size={32} />
                        </div>
                        <h3>
                            {products.length === 0 ? 'No marketplace products available' : 'No matches found'}
                        </h3>
                        <p>
                            {products.length === 0
                                ? 'There are no products from other suppliers right now. Check back later.'
                                : 'Adjust your search queries or category filters to find the equipment needed.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MarketplacePage;
