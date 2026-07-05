"use client";

import { getApiBaseUrl } from '@/lib/api';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PublicLayout from '../../components/shared/PublicLayout';
import { useAuth } from '@/context/AuthContext';
import { Search, MapPin, CheckCircle, Package, TrendingUp, Building2, Clock, AlertCircle } from 'lucide-react';

const Suppliers = () => {
    const { user } = useAuth();
    const [filters, setFilters] = useState({
        industry: 'all',
        location: 'all',
        verifiedOnly: true,
        searchQuery: ''
    });

    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const headers = {};
                if (typeof window !== 'undefined') {
                    const token = localStorage.getItem('token');
                    if (token) headers.Authorization = `Bearer ${token}`;
                }
                const response = await fetch(`${getApiBaseUrl()}/api/auth/manufacturers`, { headers });
                const data = await response.json();
                if (data.success) {
                    const mappedSuppliers = data.data.map(s => ({
                        id: s._id,
                        name: s.name,
                        location: s.businessDetails?.city || 'Pakistan',
                        industry: s.businessDetails?.specialization?.[0] || 'Sports',
                        verified: s.businessDetails?.isVerified || false,
                        capacity: s.businessDetails?.capacity || 'Contact for info',
                        specialty: s.businessDetails?.specialization?.join(', ') || 'Sports Equipment',
                        yearsActive: s.businessDetails?.yearsOperating || 0,
                        certifications: s.businessDetails?.certifications || [],
                        exportMarkets: s.businessDetails?.exportMarkets || []
                    }));
                    setSuppliers(mappedSuppliers);
                }
            } catch (err) {
                console.error('Error fetching suppliers:', err);
                setError('Failed to load suppliers');
            } finally {
                setLoading(false);
            }
        };

        fetchSuppliers();
    }, [user?.id]);

    if (loading) {
        return (
            <PublicLayout>
                <div className="min-h-screen bg-neutral-50 pt-32 flex items-center justify-center">
                    <div className="text-center">
                        <Clock className="mx-auto text-emerald-600 animate-spin mb-4" size={48} />
                        <p className="font-body text-slate-600">Loading suppliers...</p>
                    </div>
                </div>
            </PublicLayout>
        );
    }

    if (error) {
        return (
            <PublicLayout>
                <div className="min-h-screen bg-neutral-50 pt-32 flex items-center justify-center">
                    <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 max-w-md text-center">
                        <AlertCircle className="mx-auto text-red-600 mb-4" size={48} />
                        <h2 className="font-heading text-2xl font-bold text-red-700 mb-2">Error</h2>
                        <p className="font-body text-red-600 mb-6">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-body font-semibold"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </PublicLayout>
        );
    }

    const filteredSuppliers = suppliers.filter(supplier => {
        if (filters.industry !== 'all' && supplier.industry.toLowerCase() !== filters.industry.toLowerCase()) return false;
        if (filters.location !== 'all' && !supplier.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
        if (filters.verifiedOnly && !supplier.verified) return false;
        if (filters.searchQuery &&
            !supplier.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) &&
            !supplier.specialty.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;
        return true;
    });

    return (
        <PublicLayout>
            <div className="min-h-screen bg-neutral-50 pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-12">
                        <h1 className="font-heading text-5xl font-bold text-slate-900 mb-4">Verified Suppliers</h1>
                        <p className="font-body text-xl text-slate-600 max-w-3xl">
                            Discover verified manufacturers with audited capacity and proven reliability
                        </p>
                    </div>

                    {/* Search & Filters */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
                        <div className="flex flex-col lg:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={22} />
                                <input
                                    type="text"
                                    placeholder="Search suppliers by name or specialty..."
                                    value={filters.searchQuery}
                                    onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                                    className="w-full pl-14 pr-4 py-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-transparent font-body text-lg bg-white outline-none transition-all"
                                />
                            </div>
                            <div className="flex gap-4">
                                <select
                                    value={filters.industry}
                                    onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
                                    className="px-4 py-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-transparent font-body outline-none appearance-none bg-white cursor-pointer"
                                >
                                    <option value="all">All Industries</option>
                                    <option value="cricket">Cricket</option>
                                    <option value="football">Football</option>
                                </select>
                                <select
                                    value={filters.location}
                                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                                    className="px-4 py-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-transparent font-body outline-none appearance-none bg-white cursor-pointer"
                                >
                                    <option value="all">All Locations</option>
                                    <option value="sialkot">Sialkot</option>
                                    <option value="lahore">Lahore</option>
                                    <option value="karachi">Karachi</option>
                                    <option value="faisalabad">Faisalabad</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={filters.verifiedOnly}
                                    onChange={(e) => setFilters({ ...filters, verifiedOnly: e.target.checked })}
                                    className="w-5 h-5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                                />
                                <span className="ml-2 font-body font-medium text-slate-700">Verified suppliers only</span>
                            </label>
                        </div>
                    </div>

                    {/* Suppliers Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredSuppliers.map((supplier) => (
                            <div
                                key={supplier.id}
                                className="bg-white rounded-2xl border border-slate-200 p-8 hover:border-emerald-600 hover:shadow-xl transition-all group"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            {supplier.verified && (
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full">
                                                    <CheckCircle size={14} className="text-emerald-600" />
                                                    <span className="font-body text-xs font-semibold text-emerald-700 uppercase tracking-wide">Verified</span>
                                                </div>
                                            )}
                                            <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-full">
                                                <span className="font-body text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                                    {supplier.industry}
                                                </span>
                                            </span>
                                        </div>
                                        <h3 className="font-heading text-2xl font-bold text-slate-900 mb-2 transition-colors">
                                            {supplier.name}
                                        </h3>
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="flex items-center gap-2 text-slate-500 mb-6">
                                    <MapPin size={18} />
                                    <span className="font-body">{supplier.location}</span>
                                </div>

                                {/* Key Info */}
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <span className="font-body text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                                            Specialty
                                        </span>
                                        <p className="font-body font-semibold text-slate-900">{supplier.specialty}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="font-body text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                                                Capacity
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <Package size={16} className="text-emerald-600" />
                                                <span className="font-body font-semibold text-slate-900">{supplier.capacity}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="font-body text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                                                Experience
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <TrendingUp size={16} className="text-emerald-600" />
                                                <span className="font-body font-semibold text-slate-900">{supplier.yearsActive} years</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Certifications removed for brevity if needed, but let's keep them if present */}
                                {supplier.certifications && supplier.certifications.length > 0 && (
                                    <div className="mb-6 pt-6 border-t border-slate-100">
                                        <span className="font-body text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">
                                            Certifications
                                        </span>
                                        <div className="flex flex-wrap gap-2">
                                            {supplier.certifications.map((cert, index) => (
                                                <span
                                                    key={index}
                                                    className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg font-body text-xs font-medium text-slate-600"
                                                >
                                                    {cert}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* CTA */}
                                <Link
                                    href={`/marketplace?supplier=${supplier.id}`}
                                    className="block w-full text-center px-6 py-4 bg-slate-900 text-white rounded-xl hover:bg-black transition-all font-body font-bold"
                                >
                                    View Supplier Profile
                                </Link>
                            </div>
                        ))}
                    </div>

                    {filteredSuppliers.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
                            <Building2 className="mx-auto text-slate-200 mb-4" size={64} />
                            <h3 className="font-heading text-2xl font-bold text-slate-900 mb-2">No suppliers found</h3>
                            <p className="font-body text-slate-600">Try adjusting your filters</p>
                        </div>
                    )}
                </div>
            </div>
        </PublicLayout>
    );
};

export default Suppliers;
