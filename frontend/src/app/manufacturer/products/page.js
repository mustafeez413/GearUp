"use client";

import { getApiBaseUrl } from '@/lib/api';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getInventoryStatus } from '@/utils/inventory';
import PageShell from '@/components/dashboard/PageShell';
import PageHeader from '@/components/dashboard/PageHeader';
import Card from '@/components/common/Card';
import Skeleton from '@/components/common/Skeleton';
import Badge from '@/components/common/Badge';
import { formatPKR } from '@/lib/financeUtils';
import { resolveProductImageUrl, PRODUCT_PLACEHOLDER } from '@/lib/marketplaceData';
import { formatMoqDisplay, formatStockWithUnit } from '@/utils/moq';
import { normalizeLoadedPackSize } from '@/lib/bulkPackaging';
import VerificationStatusBanner from '@/components/shared/VerificationStatusBanner';
import { isApprovedVerification } from '@/lib/verificationStats';
import useReadOnlyMode from '@/hooks/useReadOnlyMode';
import {
    Plus,
    Edit,
    Trash2,
    Package,
    Image as ImageIcon,
    Eye,
    Search,
    Filter,
    AlertCircle,
    MoreVertical,
    CheckCircle
} from 'lucide-react';

const ProductsPage = () => {
    const { user } = useAuth();
    const { isReadOnlyMode, guardAction } = useReadOnlyMode();
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState('');
    const [showImageModal, setShowImageModal] = useState(null);
    const [activeTab, setActiveTab] = useState('products');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deleteConfirmProduct, setDeleteConfirmProduct] = useState(null);
    const [deletingProductId, setDeletingProductId] = useState(null);
    const [successToast, setSuccessToast] = useState(null);
    const [errorToast, setErrorToast] = useState(null);

    const isVerified = isApprovedVerification(user);

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const userId = user?.id || user?._id;
            if (!userId) return;

            const response = await fetch(`${getApiBaseUrl()}/api/products?manufacturer=${userId}&scope=inventory`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setProducts(data.data.map(p => ({
                    id: p._id,
                    name: p.name,
                    image: p.images?.[0] || null,
                    price: p.pricePerBulkUnit || p.price || 0,
                    stock: p.availableStock !== undefined ? p.availableStock : (p.stock || 0),
                    totalStock: p.totalStock !== undefined ? p.totalStock : (p.stock || 0),
                    reservedStock: p.reservedStock || 0,
                    moq: p.minimumOrderQuantity || 1,
                    bulkUnit: p.bulkUnit || 'Dozen',
                    packSize: normalizeLoadedPackSize(p.bulkUnit || 'Dozen', p.packSize) || 12,
                    status: getInventoryStatus(p),
                    category: p.category || 'General',
                    sku: p.sku || 'N/A'
                })));
            }
        } catch (err) {
            console.error('Failed to fetch products', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusBadge = (status) => {
        const badges = {
            'Active': 'bg-[#E8FFF5] text-[#00A878] border border-[#00A878]',
            'Low Stock': 'bg-[#FFF7E6] text-[#F59E0B] border border-[#F59E0B]',
            'Out of Stock': 'bg-[#FEF2F2] text-[#EF4444] border border-[#EF4444]',
            'Draft': 'bg-[#F8FAFC] text-[#64748B] border border-[#E5E7EB]'
        };
        return badges[status] || badges['Draft'];
    };

    const handleDelete = async (productId) => {
        if (!guardAction()) return;
        console.log("Delete button clicked for product ID:", productId);
        if (!productId) {
            console.error("Delete failed: Product ID is undefined");
            setErrorToast("Failed to delete product: Invalid ID");
            setTimeout(() => setErrorToast(null), 3000);
            return;
        }

        // Close the confirmation modal and start the deleting loading state
        setDeleteConfirmProduct(null);
        setDeletingProductId(productId);
        setErrorToast(null);
        setSuccessToast(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error("No authorization token found");
            }

            const response = await fetch(`${getApiBaseUrl()}/api/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                console.log("Product successfully deleted from MongoDB:", productId);
                
                // Update UI instantly
                setProducts(prev => prev.filter(p => p.id !== productId));
                
                // Show success toast
                setSuccessToast("Product deleted successfully");
                setTimeout(() => setSuccessToast(null), 3000);
            } else {
                console.error("API Deletion failed:", data.message || data.error || "Unknown error");
                throw new Error(data.message || data.error || "Failed to delete product");
            }
        } catch (err) {
            console.error('Error deleting product:', err);
            setErrorToast(err.message || "Failed to delete product");
            setTimeout(() => setErrorToast(null), 3000);
        } finally {
            setDeletingProductId(null);
        }
    };

    if (loading && products.length === 0) {
        return (
            <div className="space-y-8 w-full animate-in fade-in duration-300">
                {/* Header Skeleton */}
                <div 
                    className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[24px] p-8 flex flex-col md:flex-row md:items-center justify-between gap-6"
                    style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.06)' }}
                >
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 animate-pulse" />
                            <div className="h-10 w-64 bg-slate-100 rounded-lg animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Grid Skeletons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <Skeleton key={i} variant="card" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 w-full animate-in fade-in duration-300">
            <div 
                className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[24px] p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8 lg:gap-6 w-full transition-all duration-300"
                style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.06)' }}
            >
                <div className="flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-5">
                    <div className="w-16 h-16 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center bg-[#E8FFF5] text-[#00A878] shadow-sm shrink-0">
                        <Package size={28} className="stroke-[2.5]" />
                    </div>
                    <div className="flex flex-col items-center sm:items-start gap-2.5">
                        <h1 className="text-[32px] sm:text-[42px] lg:text-[48px] font-[800] text-[#0F172A] tracking-tight leading-none">Inventory Console</h1>
                        <p className="text-[15px] sm:text-[16px] text-[#64748B] font-[500]">Manage and organize your listed SKUs.</p>
                        <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2.5 mt-2">
                            <div className="flex items-center h-[36px] gap-2 px-4 bg-[#FFFFFF] border border-[#E5E7EB] rounded-full text-[11px] sm:text-[12px] font-[700] text-[#475569] tracking-wide uppercase shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                                <Package size={14} className="text-[#00A878]" /> {products.length} Products
                            </div>
                            <div className="flex items-center h-[36px] gap-2 px-4 bg-[#FFFFFF] border border-[#E5E7EB] rounded-full text-[11px] sm:text-[12px] font-[700] text-[#475569] tracking-wide uppercase shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                                <span className="w-2 h-2 rounded-full bg-[#0EA5E9]"></span> {new Set(products.map(p => p.category)).size} Categories
                            </div>
                            <div className={`flex items-center h-[36px] gap-2 px-4 rounded-full text-[11px] sm:text-[12px] font-[700] tracking-wide uppercase border shadow-[0_2px_8px_rgba(15,23,42,0.04)] ${
                                products.some(p => p.status === 'Low Stock' || p.status === 'Out of Stock') 
                                    ? 'bg-[#FEF2F2] text-[#EF4444] border-[#EF4444]/20' 
                                    : 'bg-[#E8FFF5] text-[#00A878] border-[#00A878]/20'
                            }`}>
                                {products.some(p => p.status === 'Low Stock' || p.status === 'Out of Stock') ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
                                {products.filter(p => p.status === 'Low Stock' || p.status === 'Out of Stock').length} Low Stock
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex shrink-0 mt-2 lg:mt-0">
                    {isVerified && !isReadOnlyMode ? (
                        <Link
                            href="/manufacturer/products/new"
                            className="flex items-center justify-center gap-2 px-6 py-3.5 w-full sm:w-auto bg-[#00A878] hover:bg-[#0DBB85] text-white rounded-[14px] font-[700] text-[15px] transition-all duration-300 shadow-[0_12px_24px_rgba(0,168,120,0.25)] hover:-translate-y-[2px]"
                        >
                            <Plus size={20} strokeWidth={3} />
                            Add Product
                        </Link>
                    ) : (
                        <button
                            disabled
                            className="flex items-center justify-center gap-2 px-6 py-3.5 w-full sm:w-auto bg-[#F1F5F9] text-[#94A3B8] rounded-[14px] font-[700] text-[15px] cursor-not-allowed"
                        >
                            <Plus size={20} strokeWidth={3} />
                            Add Product
                        </button>
                    )}
                </div>
            </div>

            {/* Success & Error Toasts */}
            {successToast && (
                <div className="p-4 bg-[#E8FFF5] border border-[#00A878]/20 rounded-xl flex items-center gap-3 text-[#00A878] animate-in fade-in slide-in-from-top-2 shadow-md">
                    <CheckCircle size={18} strokeWidth={2.5} />
                    <p className="font-sans text-[14px] font-[700]">{successToast}</p>
                </div>
            )}
            {errorToast && (
                <div className="p-4 bg-[#FEF2F2] border border-[#EF4444]/20 rounded-xl flex items-center gap-3 text-[#EF4444] animate-in fade-in slide-in-from-top-2 shadow-md">
                    <AlertCircle size={18} strokeWidth={2.5} />
                    <p className="font-sans text-[14px] font-[700]">{errorToast}</p>
                </div>
            )}

            {!isVerified && (
                <VerificationStatusBanner
                    user={user}
                    notSubmittedDescription="Product listing is disabled until your business is verified."
                />
            )}

            {/* Tabs & Search Action Row */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-[#E2E8F0] mt-6 gap-y-4 lg:gap-y-0">
                <div className="flex items-center gap-8 h-full">
                    {['products', 'categories'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-4 font-sans font-[700] text-[15px] tracking-wide transition-all relative ${
                                activeTab === tab ? 'text-[#00A878]' : 'text-[#64748B] hover:text-[#0F172A]'
                            }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            {activeTab === tab && (
                                <div className="absolute bottom-[-1px] left-0 w-full h-[3px] bg-[#00A878] rounded-t-md transition-all z-10" />
                            )}
                        </button>
                    ))}
                </div>

                {activeTab === 'products' && (
                    <div className="flex items-center gap-3 pb-4 w-full lg:w-auto">
                        <div className="relative w-full lg:w-80">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name, SKU..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-4 pr-11 w-full h-[52px] bg-[#FFFFFF] border border-[#E2E8F0] rounded-[14px] shadow-[0_2px_8px_rgba(15,23,42,0.04)] focus:outline-none transition-all duration-200 font-sans text-[14px] font-[500] text-[#0F172A] placeholder-[#94A3B8] focus:border-[#00A878] focus:ring-[4px] focus:ring-[#00A878]/12"
                            />
                        </div>
                        <button className="flex items-center justify-center w-[52px] h-[52px] bg-[#FFFFFF] border border-[#E2E8F0] rounded-[14px] text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#00A878] hover:border-[#00A878]/30 transition-all shadow-[0_2px_8px_rgba(15,23,42,0.04)] hover:shadow-md shrink-0">
                            <Filter size={20} />
                        </button>
                    </div>
                )}
            </div>
            
            {/* Smart Inventory Hints */}
            {activeTab === 'products' && (
                <div className="flex justify-start w-full mb-8 mt-4">
                    <div className="flex items-center gap-2.5 text-[14px] font-[600] text-[#00A878] bg-[#E8FFF5] border border-[#00A878] rounded-[12px] px-5 py-3 w-fit shadow-sm">
                        <CheckCircle size={18} className="text-[#00A878]" strokeWidth={2.5} />
                        Inventory operating normally. {products.length} active SKUs detected.
                    </div>
                </div>
            )}

            {/* Content Area */}
            {activeTab === 'products' ? (
                <div className="w-full">
                    {/* Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {isVerified && (
                            <Link
                                href="/manufacturer/products/new"
                                className="bg-[#FAFCFD] border-2 border-dashed border-[#CBD5E1] hover:border-[#00A878]/40 hover:bg-[#F8FFFB] rounded-[16px] flex flex-col items-center justify-center p-6 transition-all duration-300 text-center min-h-[360px] group/add"
                            >
                                <div className="w-12 h-12 bg-[#FFFFFF] rounded-full shadow-sm border border-[#E2E8F0] flex items-center justify-center mb-4 transition-all duration-300 group-hover/add:scale-110 group-hover/add:border-[#00A878]/30 group-hover/add:shadow-[0_0_20px_rgba(0,168,120,0.1)]">
                                    <Plus className="text-[#64748B] group-hover/add:text-[#00A878] transition-colors" size={24} strokeWidth={2.5} />
                                </div>
                                <div className="font-sans text-[15px] font-[700] text-[#0F172A]">Add New SKU</div>
                                <p className="font-sans text-[#64748B] text-[13px] mt-1 font-[500]">Create new product</p>
                            </Link>
                        )}

                        {filteredProducts.map((product) => (
                            <div 
                                key={product.id} 
                                className="bg-[#FFFFFF] rounded-[16px] border border-[#E5E7EB] overflow-hidden flex flex-col hover:shadow-[0_8px_28px_rgba(15,23,42,0.07)] hover:-translate-y-[3px] transition-all duration-300 min-h-[360px] group/card"
                            >
                                <div className="relative aspect-[4/3] bg-gradient-to-b from-[#F8FAFC] to-[#F1F5F9] border-b border-[#E5E7EB] overflow-hidden shrink-0">
                                    {/* Status Badge */}
                                    <div className="absolute top-4 left-4 z-10">
                                        <div className={`px-3 flex items-center h-[26px] rounded-full text-[11px] font-[600] uppercase tracking-wide shadow-sm ${getStatusBadge(product.status)}`}>
                                            {product.status}
                                        </div>
                                    </div>

                                    {product.image ? (
                                        <img
                                            src={resolveProductImageUrl(product.image)}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                                            onError={(e) => {
                                                e.currentTarget.onerror = null;
                                                e.currentTarget.src = resolveProductImageUrl(null);
                                            }}
                                        />
                                    ) : (
                                        <Package className="text-[#CBD5E1]" size={48} />
                                    )}
                                </div>

                                <div className="p-5 flex flex-col flex-1">
                                    <div className="flex justify-between items-start mb-2 gap-4">
                                        <div className="text-[13px] font-[500] text-[#64748B] truncate">{product.category}</div>
                                        <div className="text-[12px] text-[#94A3B8] font-mono shrink-0">SKU: {product.sku}</div>
                                    </div>
                                    <h3 className="font-sans text-[16px] font-[700] text-[#0F172A] line-clamp-2 leading-snug mb-4">{product.name}</h3>

                                    <div className="mt-auto">
                                        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                                            <div className="font-sans font-[700] text-[20px] text-[#0F172A] tracking-tight">{formatPKR(product.price)}</div>
                                            <div className="text-[12px] font-[600] text-[#64748B]">Unit: {product.bulkUnit || 'Unit'}</div>
                                        </div>
                                        <div className="flex flex-col gap-1 mb-4 text-[12px] text-[#64748B]">
                                            <span>Stock: {formatStockWithUnit(product.stock, product.bulkUnit, product.moq).stockLabel}</span>
                                            <span>
                                                MOQ: {(() => {
                                                    const moqLabel = formatMoqDisplay(product.moq, product.bulkUnit, product.packSize);
                                                    return (
                                                        <>
                                                            {moqLabel.primary}
                                                            {moqLabel.secondary && (
                                                                <span className="block mt-0.5 text-[11px] font-[600] text-[#94A3B8]">
                                                                    {moqLabel.secondary}
                                                                </span>
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                            </span>
                                        </div>

                                        <div className="action-row mt-1">
                                            <button
                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowImageModal(product); }}
                                                className="action-btn-icon"
                                                title="View"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            {!isReadOnlyMode && (
                                            <Link
                                                href={`/manufacturer/products/edit/${product.id}`}
                                                className="action-btn-icon"
                                                title="Edit"
                                            >
                                                <Edit size={16} />
                                            </Link>
                                            )}
                                            {!isReadOnlyMode && (
                                            <button
                                                type="button"
                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteConfirmProduct(product); }}
                                                disabled={deletingProductId === product.id}
                                                className="action-btn-icon hover:bg-[#FEF2F2] hover:text-[#DC2626] hover:border-[#FCA5A5] disabled:opacity-50"
                                                title="Delete"
                                            >
                                                {deletingProductId === product.id ? (
                                                    <div className="w-4 h-4 border-2 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
                                                ) : (
                                                    <Trash2 size={16} />
                                                )}
                                            </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                /* Categories View */
                <div className="table-enterprise mt-6">
                    <div className="overflow-x-auto">
                        <table>
                            <thead>
                                <tr>
                                    <th className="px-6 py-5 text-left font-semibold text-[11px] uppercase tracking-[0.5px] text-[#64748B]">Category</th>
                                    <th className="px-6 py-5 text-left font-semibold text-[11px] uppercase tracking-[0.5px] text-[#64748B]">SKU Count</th>
                                    <th className="px-6 py-5 text-left font-semibold text-[11px] uppercase tracking-[0.5px] text-[#64748B]">Total Inventory</th>
                                    <th className="px-6 py-5 text-left font-semibold text-[11px] uppercase tracking-[0.5px] text-[#64748B]">Asset Value</th>
                                    <th className="px-6 py-5 text-right font-semibold text-[11px] uppercase tracking-[0.5px] text-[#64748B]"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(products.reduce((acc, product) => {
                                    const cat = product.category || 'Uncategorized';
                                    if (!acc[cat]) acc[cat] = { count: 0, stock: 0, totalValue: 0 };
                                    acc[cat].count += 1;
                                    acc[cat].stock += product.stock;
                                    acc[cat].totalValue += (product.price * product.stock);
                                    return acc;
                                }, {})).map(([name, stats]) => (
                                    <tr key={name} className="hover:bg-[#F8FFFC] transition-all group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-[#E8FFF5] rounded-xl flex items-center justify-center text-[#00A878] font-[800] text-[14px] italic shadow-sm">
                                                    {name.charAt(0)}
                                                </div>
                                                <div className="font-sans font-[700] text-[15px] text-[#0F172A]">{name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-full text-[11px] font-[700] text-[#475569] uppercase tracking-wider inline-block">
                                                {stats.count} SKUs
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 font-sans font-[700] text-[15px] text-[#0F172A]">
                                            {stats.stock.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="font-sans font-[700] text-[15px] text-[#0F172A]">{formatPKR(stats.totalValue)}</div>
                                        </td>
                                        <td className="px-6 py-5 text-right text-[#94A3B8] text-[12px] font-[600]">
                                            {stats.count} products
                                        </td>
                                    </tr>
                                ))}
                                {products.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-24 text-center">
                                            <Package className="mx-auto text-[#CBD5E1] mb-5" size={56} />
                                            <div className="font-sans text-[18px] font-[800] text-[#94A3B8] tracking-tight uppercase italic">No Categories Manifested</div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Image Modal & Delete Modal remains the same */}
            {/* Image Modal */}
            {showImageModal && (
                <div
                    className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[100] flex items-center justify-center p-8 animate-in fade-in duration-300"
                    onClick={() => setShowImageModal(null)}
                >
                    <div
                        className="bg-white rounded-[3rem] p-10 max-w-2xl w-full border border-white/20 shadow-2xl relative animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowImageModal(null)}
                            className="absolute -top-16 right-0 text-white hover:rotate-90 transition-transform duration-500"
                        >
                            <Plus className="rotate-45" size={40} />
                        </button>

                        <div className="mb-10 text-center">
                            <div className="text-[10px] font-black text-[#00A878] uppercase tracking-[0.3em] mb-2">{showImageModal.category}</div>
                            <h3 className="font-heading text-4xl font-[800] text-[#0F172A] tracking-tighter">{showImageModal.name}</h3>
                        </div>

                        <div className="bg-[#F8FAFC] rounded-2xl border border-[#E5E7EB] p-8 flex items-center justify-center mb-10 min-h-[400px] overflow-hidden">
                            {showImageModal.image ? (
                                <img
                                    src={resolveProductImageUrl(showImageModal.image)}
                                    alt={showImageModal.name}
                                    className="max-w-full max-h-[400px] object-contain rounded-2xl shadow-2xl shadow-slate-900/10 mix-blend-multiply"
                                    onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = PRODUCT_PLACEHOLDER;
                                    }}
                                />
                            ) : (
                                <Package className="text-[#CBD5E1]" size={120} />
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-6 bg-[#F8FAFC] rounded-[24px] border border-[#E5E7EB] text-center shadow-sm">
                                <div className="text-[11px] font-[800] text-[#94A3B8] uppercase tracking-widest mb-1.5">MSRP</div>
                                <div className="font-sans text-[24px] font-[800] text-[#0F172A]">{formatPKR(showImageModal.price)}</div>
                            </div>
                            <div className="p-6 bg-[#F8FAFC] rounded-[24px] border border-[#E5E7EB] text-center shadow-sm">
                                <div className="text-[11px] font-[800] text-[#94A3B8] uppercase tracking-widest mb-1.5">MOQ</div>
                                {(() => {
                                    const moqLabel = formatMoqDisplay(
                                        showImageModal.moq,
                                        showImageModal.bulkUnit,
                                        showImageModal.packSize
                                    );
                                    return (
                                        <>
                                            <div className="font-sans text-[24px] font-[800] text-[#0F172A]">{moqLabel.primary}</div>
                                            {moqLabel.secondary && (
                                                <div className="font-sans text-[13px] font-[600] text-[#64748B] mt-1">{moqLabel.secondary}</div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmProduct && (
                <div
                    className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-md z-[999] flex items-center justify-center p-4 transition-opacity duration-300"
                    onClick={() => setDeleteConfirmProduct(null)}
                >
                    <div
                        className="bg-white rounded-[24px] p-8 w-[460px] max-w-full h-auto border border-[#E5E7EB] shadow-[0_20px_60px_rgba(15,23,42,0.15)] relative flex flex-col items-center text-center animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Elegant Trash Icon Container with pulse background */}
                        <div className="w-16 h-16 bg-[#FEF2F2] text-[#EF4444] rounded-full flex items-center justify-center mb-6 shadow-inner relative">
                            <span className="absolute inset-0 bg-[#FEF2F2] rounded-full animate-ping duration-1000 scale-110"></span>
                            <Trash2 size={28} className="relative z-10" />
                        </div>

                        {/* Title */}
                        <h3 className="font-sans text-[24px] font-[800] text-[#0F172A] tracking-tight mb-3">
                            Delete Product?
                        </h3>

                        {/* Description */}
                        <p className="font-sans text-[#64748B] text-[15px] font-[500] leading-relaxed mb-1 px-2">
                            Are you sure you want to delete
                        </p>
                        <p className="font-sans text-[#0F172A] text-[16px] font-[700] leading-relaxed mb-4 px-2 break-words max-w-full">
                            "{deleteConfirmProduct.name}"?
                        </p>
                        <p className="font-sans text-[#EF4444] text-[12px] font-[800] uppercase tracking-wider mb-8">
                            This action cannot be undone.
                        </p>

                        {/* Buttons Container */}
                        <div className="flex gap-4 w-full">
                            <button
                                type="button"
                                onClick={() => setDeleteConfirmProduct(null)}
                                className="flex-1 py-3.5 px-6 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#475569] font-sans font-[800] text-[13px] uppercase tracking-wider rounded-[14px] transition-all duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDelete(deleteConfirmProduct.id)}
                                className="flex-1 py-3.5 px-6 bg-[#EF4444] hover:bg-[#DC2626] text-white font-sans font-[800] uppercase tracking-wider text-[13px] rounded-[14px] shadow-[0_8px_20px_rgba(239,68,68,0.25)] hover:shadow-[0_12px_24px_rgba(239,68,68,0.35)] transition-all duration-200 flex items-center justify-center gap-2 hover:-translate-y-0.5"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Internal ArrowRight icon for the table
const ArrowRight = ({ size, className }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
    </svg>
);

export default ProductsPage;
