"use client";

import { getApiBaseUrl } from '@/lib/api';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Search,
    MapPin,
    CheckCircle,
    Star,
    MessageCircle,
    Building2,
    ShieldCheck,
    ArrowRight,
    Users,
    Filter,
    FilterX,
    Award,
    Clock,
    Zap,
    ExternalLink,
    ChevronDown
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

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
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-body font-bold text-xs uppercase tracking-wider text-slate-600 outline-none hover:bg-slate-100 transition-all flex items-center gap-2 select-none"
            >
                <MapPin size={12} className="text-emerald-500 shrink-0" />
                <span className="truncate max-w-[120px]">Loc: {selectedLocName}</span>
                <ChevronDown size={12} className={`transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute left-0 mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-xl w-72 max-h-[340px] overflow-hidden flex flex-col animate-scale-up">
                    <div className="p-3 border-b border-slate-100">
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                placeholder="Search cities, towns..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-3 pr-9 w-full py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-xs font-body text-slate-900 font-bold placeholder-slate-400"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-3 scrollbar-thin">
                        {!search && (
                            <div className="space-y-1.5">
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

                        <div className="space-y-2">
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
                                <div key={region} className="space-y-1">
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

const WholesalerManufacturersPage = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [manufacturers, setManufacturers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [locationFilter, setLocationFilter] = useState('all');
    const [verifiedFilter, setVerifiedFilter] = useState(false);
    const [chatLoadingId, setChatLoadingId] = useState(null);

    const fetchManufacturers = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${getApiBaseUrl()}/api/auth/manufacturers`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setManufacturers(data.data || []);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to fetch suppliers database.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchManufacturers();
    }, [fetchManufacturers]);

    // Intelligent Chat Opener matching seller with active products
    const handleChatWithSeller = async (manufacturerId) => {
        try {
            setChatLoadingId(manufacturerId);
            const token = localStorage.getItem('token');
            
            // Fetch active products
            const prodRes = await fetch(`${getApiBaseUrl()}/api/products`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const prodData = await prodRes.json();
            if (!prodData.success) {
                alert('Could not start chat with this supplier.');
                return;
            }

            // Find an active product owned by this manufacturer
            const manufacturerProduct = prodData.data.find(p => {
                const sId = p.seller?._id ?? p.seller;
                return sId === manufacturerId;
            });

            if (!manufacturerProduct) {
                alert('This supplier does not have any active product listings to initiate a trade discussion.');
                return;
            }

            // Open chat using the product ID
            const res = await fetch(`${getApiBaseUrl()}/api/chats/open`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ productId: manufacturerProduct._id })
            });
            const data = await res.json();
            if (data.success && data.data?._id) {
                router.push(`/wholesaler/chats/${data.data._id}`);
            } else {
                alert(data.error || 'Could not open chat with this supplier.');
            }
        } catch (e) {
            alert('Could not open chat with this supplier.');
        } finally {
            setChatLoadingId(null);
        }
    };

    const filteredManufacturers = useMemo(() => {
        return manufacturers.filter(m => {
            const matchesSearch = 
                m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (m.businessDetails?.businessName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (m.businessDetails?.city || '').toLowerCase().includes(searchQuery.toLowerCase());
            
            if (!matchesSearch) return false;

            if (locationFilter !== 'all') {
                const city = (m.businessDetails?.city || '').toLowerCase();
                if (!city.includes(locationFilter.toLowerCase())) return false;
            }

            if (verifiedFilter && !m.businessDetails?.isVerified) return false;

            return true;
        });
    }, [manufacturers, searchQuery, locationFilter, verifiedFilter]);

    const featuredSuppliers = useMemo(() => {
        return manufacturers.filter(m => m.businessDetails?.isVerified).slice(0, 3);
    }, [manufacturers]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-slate-200 border-b-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="font-body font-bold text-slate-400 uppercase tracking-widest text-xs">Loading Suppliers Directory...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-16">
            {/* Header Section */}
            <div className="pb-4 border-b border-slate-100">
                <h1 className="font-heading text-3xl font-black text-slate-900 tracking-tight leading-none">
                    Verified Suppliers
                </h1>
                <p className="font-body text-slate-500 font-medium text-sm mt-1">
                    Browse verified manufacturers and wholesale suppliers.
                </p>
            </div>

            {/* Compact Search & Filters Row */}
            <div className="flex flex-wrap items-center gap-3 p-3 bg-white border border-slate-200/60 rounded-2xl shadow-sm">
                {/* Search field */}
                <div className="relative flex-1 min-w-[240px]">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search by supplier name or city..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-4 pr-10 w-full py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 text-sm font-body text-slate-950 font-bold placeholder-slate-400"
                    />
                </div>

                {/* Highly Scalable Searchable Location Dropdown */}
                <SearchableLocationDropdown
                    value={locationFilter}
                    onChange={(val) => setLocationFilter(val)}
                />

                {/* Verified Switch Toggle */}
                <label className="flex items-center gap-2.5 px-3 cursor-pointer group">
                    <div className={`w-8 h-5 rounded-full p-0.5 transition-all duration-300 ${verifiedFilter ? 'bg-emerald-600' : 'bg-slate-200'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${verifiedFilter ? 'translate-x-3' : 'translate-x-0'}`}></div>
                    </div>
                    <input
                        type="checkbox"
                        className="hidden"
                        checked={verifiedFilter}
                        onChange={(e) => setVerifiedFilter(e.target.checked)}
                    />
                    <span className="font-body font-black text-[10px] uppercase tracking-wider text-slate-700 flex items-center gap-1.5 select-none">
                        <ShieldCheck className={verifiedFilter ? 'text-emerald-500' : 'text-slate-400'} size={12} /> Verified Only
                    </span>
                </label>

                {/* Reset button */}
                {(searchQuery || locationFilter !== 'all' || verifiedFilter) && (
                    <button
                        onClick={() => {
                            setSearchQuery('');
                            setLocationFilter('all');
                            setVerifiedFilter(false);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-500 rounded-xl font-body font-black text-[10px] uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all ml-auto md:ml-0"
                    >
                        <FilterX size={12} /> Reset
                    </button>
                )}
            </div>

            {/* Featured / Top Rated Suppliers horizontal bar */}
            {featuredSuppliers.length > 0 && !searchQuery && locationFilter === 'all' && !verifiedFilter && (
                <div className="space-y-3">
                    <div className="font-heading text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Award className="text-emerald-500" size={16} /> Featured Sourcing Partners
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {featuredSuppliers.map((supplier) => (
                            <div key={supplier._id} className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] rounded-full"></div>
                                <div className="flex justify-between items-start mb-3 relative z-10">
                                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-white font-bold font-heading">
                                        {supplier.businessDetails?.businessName?.slice(0, 2).toUpperCase() || supplier.name.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                                        <CheckCircle size={10} /> Top Rated
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    <h4 className="font-heading text-sm font-black tracking-tight truncate">
                                        {supplier.businessDetails?.businessName || supplier.name}
                                    </h4>
                                    <div className="flex items-center gap-2 text-[10px] font-body font-bold text-slate-400 mt-1">
                                        <MapPin size={10} className="text-emerald-400" /> {supplier.businessDetails?.city || 'Pakistan'}
                                    </div>
                                </div>
                                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between relative z-10">
                                    <span className="text-[9px] font-body font-black uppercase tracking-wider text-slate-500">Fast Response &lt; 24h</span>
                                    <Link
                                        href={`/wholesaler/manufacturer/${supplier._id}`}
                                        className="text-[9px] font-body font-black uppercase tracking-wider text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                                    >
                                        Sourcing Page <ExternalLink size={10} />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Supplier Directory Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredManufacturers.map((manufacturer) => (
                    <div key={manufacturer._id} className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full">
                        <div className="p-5 flex-1 flex flex-col justify-between">
                            {/* Card Header Info */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    {/* Icon / Avatar with initial colors */}
                                    <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-heading font-black text-lg transition-transform group-hover:rotate-3 shadow-md">
                                        {manufacturer.businessDetails?.businessName?.slice(0, 2).toUpperCase() || manufacturer.name.slice(0, 2).toUpperCase()}
                                    </div>
                                    {manufacturer.businessDetails?.isVerified ? (
                                        <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                                            <ShieldCheck size={10} /> Verified Supplier
                                        </div>
                                    ) : (
                                        <div className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                                            Active Seller
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <h3 className="font-heading text-lg font-black text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1 tracking-tight">
                                        {manufacturer.businessDetails?.businessName || manufacturer.name}
                                    </h3>
                                    <div className="flex items-center gap-3 text-slate-400 font-body font-bold text-xs tracking-tight">
                                        <span className="flex items-center gap-1">
                                            <MapPin size={12} className="text-emerald-500 shrink-0" /> {manufacturer.businessDetails?.city || 'Pakistan'}
                                        </span>
                                        <span className="flex items-center gap-1 whitespace-nowrap">
                                            <Star size={12} className="text-emerald-500 fill-emerald-500 shrink-0" /> 4.9 (48 Inquiries)
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed specs */}
                            <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 my-4 shrink-0">
                                <div>
                                    <div className="font-body text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Capacity Potential</div>
                                    <div className="font-heading font-black text-slate-900 text-sm tracking-tight">{manufacturer.businessDetails?.productionCapacity || '2,500+'} Units/Mo</div>
                                </div>
                                <div>
                                    <div className="font-body text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Response Time</div>
                                    <div className="font-heading font-black text-slate-900 text-sm tracking-tight text-emerald-600 uppercase flex items-center gap-1">
                                        <Clock size={12} /> &lt;24 hrs
                                    </div>
                                </div>
                            </div>

                            {/* Action Row */}
                            <div className="space-y-3 shrink-0">
                                <div className="flex gap-2">
                                    <Link
                                        href={`/wholesaler/manufacturer/${manufacturer._id}`}
                                        className="w-full flex items-center justify-center gap-1 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-body font-black text-[10px] uppercase tracking-wider transition-all shadow-sm text-center"
                                    >
                                        Inspect Profile <ArrowRight size={12} />
                                    </Link>
                                    <button
                                        type="button"
                                        disabled={chatLoadingId === manufacturer._id}
                                        onClick={() => handleChatWithSeller(manufacturer._id)}
                                        title="Start Chat with Supplier"
                                        className="px-3.5 py-2.5 border border-slate-200 text-emerald-600 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all disabled:opacity-50 shrink-0 flex items-center justify-center"
                                    >
                                        <MessageCircle size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredManufacturers.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-slate-200/60 shadow-sm">
                        <Building2 className="mx-auto text-slate-200 mb-6" size={64} />
                        <h3 className="font-heading text-2xl font-black text-slate-900 tracking-tight uppercase italic">
                            No Suppliers Found
                        </h3>
                        <p className="font-body text-slate-400 max-w-[420px] mx-auto mt-2 font-medium uppercase text-[10px] tracking-wider leading-relaxed">
                            Try adjusting your search queries or city filters to discover active sports equipment manufacturers.
                        </p>
                        <Link
                            href="/wholesaler/marketplace"
                            className="mt-6 inline-flex items-center gap-1.5 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-body font-black text-[10px] uppercase tracking-wider transition-all shadow-sm"
                        >
                            Browse Marketplace
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WholesalerManufacturersPage;
