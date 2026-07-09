"use client";

import { getApiBaseUrl } from '@/lib/api';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Save,
    AlertCircle,
    Upload,
    Banknote,
    Info,
    Layers,
    ChevronLeft,
    CheckCircle,
    Plus,
    Image as ImageIcon,
    Trash2
} from 'lucide-react';
import Link from 'next/link';
import {
    BULK_UNIT_OPTIONS,
    BULK_PACK_MESSAGES,
    validateBulkPackaging,
    resolvePackSizeForBulkUnit,
    normalizeLoadedPackSize,
    isPackSizeReadOnly,
} from '@/lib/bulkPackaging';
import {
    DOZEN_PRICING_MESSAGES,
    calculateDozenPriceFromSingle,
    deriveSinglePriceFromDozen,
    validateSingleUnitPrice,
    isDozenPricingMode,
} from '@/lib/dozenPricing';
import { formatPKR } from '@/lib/financeUtils';
import { resolveProductImageUrl } from '@/lib/marketplaceData';
import { formatMoqDisplay } from '@/utils/moq';
import { useAuth } from '@/context/AuthContext';
import useReadOnlyMode from '@/hooks/useReadOnlyMode';
import {
    SKU_FORMAT_EXAMPLE,
    buildProductSku,
    isSkuTaken,
    parseProductSku,
} from '@/lib/skuGenerator';

const DEFAULT_PRIMARY_COVER = '/images/ca-plus-15000-primary-cover.png';
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

function validateProductImageFile(file) {
    if (!file) {
        return 'Please select an image file.';
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return 'Only JPEG, PNG, and WEBP images are allowed.';
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
        return 'Image file size must be less than 5MB.';
    }
    return null;
}

async function uploadProductImageFile(file, token) {
    const payload = new FormData();
    // Backend expects field name "image"
    payload.append('image', file);

    const response = await fetch(`${getApiBaseUrl()}/api/products/upload-image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: payload,
    });

    let data = {};
    try {
        data = await response.json();
    } catch {
        throw new Error('Image upload failed. Please try again.');
    }

    if (!response.ok || !data.success) {
        throw new Error(data.error || 'Image upload failed. Please try again.');
    }

    // API returns { path: '/uploads/....' }
    return data.path;
}

async function normalizeImagesForSave(images, token) {
    const image = images?.[0];
    if (!image) return [];

    if (image.startsWith('data:')) {
        const blob = await fetch(image).then((res) => res.blob());
        const file = new File([blob], `product-${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
        return [await uploadProductImageFile(file, token)];
    }

    return [image];
}

const ProductForm = ({ id }) => {
    const router = useRouter();
    const { user } = useAuth();
    const { isReadOnlyMode, guardAction } = useReadOnlyMode();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [skuManuallyEdited, setSkuManuallyEdited] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        pricePerBulkUnit: '',
        category: 'Cricket',
        stock: '',
        sku: '',
        minimumOrderQuantity: 1,
        packSize: 12, // Default to 12 matching Dozen pack size
        bulkUnit: 'Dozen',
        images: id ? [] : [DEFAULT_PRIMARY_COVER],
        status: 'published' // Default status
    });

    const [imageUrlInput, setImageUrlInput] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imageError, setImageError] = useState(null);
    const fileInputRef = useRef(null);
    const [singleUnitPrice, setSingleUnitPrice] = useState('');
    const [brandName, setBrandName] = useState('');
    const [skuUniqueSuffix, setSkuUniqueSuffix] = useState(null);
    const [existingSkus, setExistingSkus] = useState([]);
    const [originalSku, setOriginalSku] = useState('');

    // Live validation schema
    const getValidationErrors = () => {
        const errors = {};
        if (!formData.name.trim()) {
            errors.name = 'Official Product Name is required';
        }
        if (!formData.description.trim()) {
            errors.description = 'Product specification is required';
        }
        if (isDozenPricingMode(formData.bulkUnit)) {
            const singleValidation = validateSingleUnitPrice(singleUnitPrice);
            if (!singleValidation.valid) {
                errors.singleUnitPrice = singleValidation.error;
            } else if (!formData.pricePerBulkUnit || Number(formData.pricePerBulkUnit) <= 0) {
                errors.pricePerBulkUnit = 'Bulk price is required';
            }
        } else if (formData.pricePerBulkUnit === '') {
            errors.pricePerBulkUnit = 'Bulk price is required';
        } else if (isNaN(formData.pricePerBulkUnit) || Number(formData.pricePerBulkUnit) <= 0) {
            errors.pricePerBulkUnit = 'Price must be greater than 0';
        }
        if (formData.stock === '') {
            errors.stock = 'Available stock is required';
        } else if (isNaN(formData.stock) || Number(formData.stock) < 0) {
            errors.stock = 'Stock quantity cannot be negative';
        }
        if (formData.minimumOrderQuantity === '' || Number(formData.minimumOrderQuantity) < 1) {
            errors.minimumOrderQuantity = 'Minimum Order Qty must be 1 or higher';
        }
        const packagingValidation = validateBulkPackaging(formData.bulkUnit, formData.packSize);
        if (!packagingValidation.valid && packagingValidation.packSizeError) {
            errors.packSize = packagingValidation.packSizeError;
        }
        if (formData.sku && isSkuTaken(formData.sku, existingSkus, originalSku)) {
            errors.sku = 'This SKU is already in use. Edit the SKU or regenerate.';
        }
        return errors;
    };

    const validationErrors = getValidationErrors();

    const processFiles = async (files, inputEl = null) => {
        if (!files || files.length === 0) return;

        const file = files[0];
        const validationMessage = validateProductImageFile(file);
        if (validationMessage) {
            setImageError(validationMessage);
            const target = inputEl || fileInputRef.current;
            if (target) {
                target.value = '';
            }
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            setImageError('Session expired. Please sign in again.');
            const target = inputEl || fileInputRef.current;
            if (target) {
                target.value = '';
            }
            return;
        }

        setImageError(null);
        setUploadingImage(true);

        try {
            const filePath = await uploadProductImageFile(file, token);
            setFormData((prev) => ({
                ...prev,
                images: [filePath],
            }));
            const target = inputEl || fileInputRef.current;
            if (target) {
                target.value = '';
            }
        } catch (err) {
            setError(err.message || 'Could not upload image. Please try again.');
        } finally {
            setUploadingImage(false);
        }
    };

    const categories = [
        'Cricket',
        'Football',
        'Protective Gear',
    ];

    const bulkUnits = BULK_UNIT_OPTIONS;
    const packSizeReadOnly = isPackSizeReadOnly(formData.bulkUnit);
    const dozenPricingMode = isDozenPricingMode(formData.bulkUnit);
    const moqPreview = formatMoqDisplay(
        formData.minimumOrderQuantity,
        formData.bulkUnit,
        formData.packSize
    );
    const dozenPreviewTotal = dozenPricingMode ? calculateDozenPriceFromSingle(singleUnitPrice) : null;

    const fetchExistingSkus = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${getApiBaseUrl()}/api/products?scope=inventory`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                const skus = (data.data || [])
                    .filter((product) => !isEditMode || product._id !== id)
                    .map((product) => product.sku)
                    .filter(Boolean);
                setExistingSkus(skus);
            }
        } catch (err) {
            console.error('Could not load existing SKUs', err);
        }
    }, [id, isEditMode]);

    const fetchProduct = useCallback(async () => {
        try {
            setFetching(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${getApiBaseUrl()}/api/products/${id}?scope=inventory`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                const product = data.data;
                setFormData({
                    name: product.name,
                    description: product.description || '',
                    pricePerBulkUnit: product.pricePerBulkUnit,
                    category: product.category,
                    stock: product.stock,
                    sku: product.sku || '',
                    minimumOrderQuantity: product.minimumOrderQuantity || 1,
                    packSize: normalizeLoadedPackSize(product.bulkUnit || 'Dozen', product.packSize),
                    bulkUnit: product.bulkUnit || 'Dozen',
                    images: (product.images || []).slice(0, 1),
                    status: product.status || 'published'
                });
                setOriginalSku(product.sku || '');
                setSkuManuallyEdited(true);
                const parsedSku = parseProductSku(product.sku);
                if (parsedSku) {
                    setSkuUniqueSuffix(parsedSku.uniqueSuffix);
                    setBrandName(parsedSku.brandCode);
                }
                if (isDozenPricingMode(product.bulkUnit || 'Dozen') && product.pricePerBulkUnit) {
                    setSingleUnitPrice(String(deriveSinglePriceFromDozen(product.pricePerBulkUnit) || ''));
                } else {
                    setSingleUnitPrice('');
                }
            } else {
                setError('Failed to fetch product details.');
            }
        } catch (err) {
            setError('Error connecting to server. Please check your connection.');
            console.error(err);
        } finally {
            setFetching(false);
        }
    }, [id]);

    useEffect(() => {
        fetchExistingSkus();
    }, [fetchExistingSkus]);

    useEffect(() => {
        if (!isEditMode && !brandName && user?.businessDetails?.businessName) {
            setBrandName(user.businessDetails.businessName);
        }
    }, [brandName, isEditMode, user?.businessDetails?.businessName]);

    useEffect(() => {
        if (isEditMode) {
            fetchProduct();
        }
    }, [isEditMode, fetchProduct]);

    useEffect(() => {
        if (skuManuallyEdited || isEditMode) return;
        if (!brandName.trim() || !formData.name.trim()) return;

        const built = buildProductSku({
            category: formData.category,
            brand: brandName,
            productName: formData.name,
            uniqueSuffix: skuUniqueSuffix,
            existingSkus,
        });

        if (built.uniqueSuffix && built.uniqueSuffix !== skuUniqueSuffix) {
            setSkuUniqueSuffix(built.uniqueSuffix);
        }
        if (built.sku && built.sku !== formData.sku) {
            setFormData((prev) => ({ ...prev, sku: built.sku }));
        }
    }, [
        brandName,
        formData.name,
        formData.category,
        formData.sku,
        skuUniqueSuffix,
        existingSkus,
        skuManuallyEdited,
        isEditMode,
    ]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'name') {
            setFormData(prev => ({
                ...prev,
                name: value
            }));
        } else if (name === 'category') {
            setFormData(prev => ({
                ...prev,
                category: value
            }));
        } else if (name === 'brandName') {
            setBrandName(value);
        } else if (name === 'sku') {
            setSkuManuallyEdited(true);
            setFormData(prev => ({
                ...prev,
                sku: value.toUpperCase()
            }));
        } else if (name === 'bulkUnit') {
            const singleForDozen =
                value === 'Dozen' && formData.pricePerBulkUnit
                    ? deriveSinglePriceFromDozen(formData.pricePerBulkUnit)
                    : '';

            if (value === 'Dozen') {
                setSingleUnitPrice(singleForDozen !== '' ? String(singleForDozen) : '');
            } else {
                setSingleUnitPrice('');
            }

            setFormData(prev => ({
                ...prev,
                bulkUnit: value,
                packSize: resolvePackSizeForBulkUnit(value, prev.packSize),
                ...(value === 'Dozen' && singleForDozen !== ''
                    ? { pricePerBulkUnit: singleForDozen * 12 }
                    : {}),
            }));
        } else if (name === 'packSize') {
            if (isPackSizeReadOnly(formData.bulkUnit)) {
                return;
            }
            setFormData(prev => ({
                ...prev,
                packSize: value,
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleRegenerateSku = () => {
        if (!brandName.trim() || !formData.name.trim()) return;
        setSkuManuallyEdited(false);
        setSkuUniqueSuffix(null);
        const built = buildProductSku({
            category: formData.category,
            brand: brandName,
            productName: formData.name,
            existingSkus,
        });
        if (built.uniqueSuffix) setSkuUniqueSuffix(built.uniqueSuffix);
        if (built.sku) setFormData((prev) => ({ ...prev, sku: built.sku }));
    };

    const handleSingleUnitPriceChange = (e) => {
        const { value } = e.target;
        setSingleUnitPrice(value);
        setFormData(prev => ({
            ...prev,
            pricePerBulkUnit: calculateDozenPriceFromSingle(value),
        }));
    };

    const handleAddImage = () => {
        if (imageUrlInput.trim()) {
            setFormData(prev => ({
                ...prev,
                images: [imageUrlInput.trim()],
            }));
            setImageUrlInput('');
        }
    };

    const handleRemoveImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!guardAction()) return;
        setLoading(true);
        setError(null);

        if (Object.keys(validationErrors).length > 0) {
            setError('Please resolve all validation errors before listing product.');
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Session expired. Please sign in again.');
                setLoading(false);
                return;
            }

            const url = isEditMode
                ? `${getApiBaseUrl()}/api/products/${id}`
                : `${getApiBaseUrl()}/api/products`;

            const method = isEditMode ? 'PUT' : 'POST';

            const packagingValidation = validateBulkPackaging(formData.bulkUnit, formData.packSize);
            if (!packagingValidation.valid) {
                setError(packagingValidation.packSizeError || 'Please resolve all validation errors before listing product.');
                setLoading(false);
                return;
            }

            let finalPricePerBulkUnit = Number(formData.pricePerBulkUnit);
            if (isDozenPricingMode(formData.bulkUnit)) {
                const singleValidation = validateSingleUnitPrice(singleUnitPrice);
                if (!singleValidation.valid) {
                    setError(singleValidation.error || 'Please resolve all validation errors before listing product.');
                    setLoading(false);
                    return;
                }
                finalPricePerBulkUnit = singleValidation.normalizedDozen;
            }

            let imagesToSave;
            try {
                imagesToSave = await normalizeImagesForSave(formData.images, token);
            } catch (uploadErr) {
                setError(uploadErr.message || 'Could not upload product image.');
                setLoading(false);
                return;
            }

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    status: 'published',
                    sku: formData.sku ? String(formData.sku).trim().toUpperCase() : formData.sku,
                    images: imagesToSave,
                    pricePerBulkUnit: finalPricePerBulkUnit,
                    stock: Number(formData.stock),
                    minimumOrderQuantity: Number(formData.minimumOrderQuantity),
                    packSize: packagingValidation.normalizedPackSize
                })
            });

            let data = {};
            try {
                data = await response.json();
            } catch {
                setError(`Server error (${response.status}). Please try again.`);
                setLoading(false);
                return;
            }

            if (data.success) {
                setSuccess(true);
                // Clear draft local storage on successful catalog update
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('gearup_product_draft');
                }
                setTimeout(() => {
                    router.push('/manufacturer/products');
                }, 2000);
            } else {
                setError(data.error || `Failed to ${isEditMode ? 'update' : 'create'} product.`);
            }
        } catch (err) {
            if (err?.message === 'Failed to fetch') {
                setError('Could not reach the server. Make sure the backend is running and try again.');
            } else {
                setError(err.message || 'Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-2 border-slate-200 border-b-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="font-body font-bold text-slate-400 uppercase tracking-widest text-[10px]">Loading product catalog details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 w-full max-w-6xl mx-auto pb-10">
            {/* Navigation Header */}
            <div className="relative bg-[#FFFFFF] border border-[#E5E7EB] rounded-[24px] p-6 sm:p-8 text-center w-full" style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.05)' }}>
                {/* Back Button */}
                <div className="w-full flex sm:absolute sm:left-6 sm:top-6 justify-start mb-4 sm:mb-0">
                    <Link
                        href="/manufacturer/products"
                        className="group flex items-center justify-center w-10 h-10 bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F1F5F9] rounded-[12px] text-[#64748B] hover:text-[#0F172A] transition-all"
                    >
                        <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                    </Link>
                </div>

                {/* Centered Content */}
                <div className="flex flex-col items-center w-full max-w-2xl mx-auto space-y-2 px-4">
                    <h1 className="font-sans text-[36px] sm:text-[42px] lg:text-[48px] font-[800] text-[#0F172A] tracking-tight leading-none">
                        {isEditMode ? 'Edit Product' : 'Add Product'}
                    </h1>
                    <p className="font-sans text-[15px] sm:text-[16px] font-[500] text-[#64748B] w-full text-center">
                        Configure your wholesale product listing and inventory details.
                    </p>
                    <div className="flex items-center gap-2 bg-[#E8FFF5] px-4 py-2 rounded-full border border-[#00A878] mt-2">
                        <div className="w-2 h-2 rounded-full bg-[#00A878] shadow-[0_0_8px_rgba(0,168,120,0.5)] animate-pulse"></div>
                        <span className="font-sans text-[11px] font-[600] uppercase text-[#00A878] tracking-widest">
                            {isEditMode ? 'Edit Workspace' : 'Creation Portal'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Toast Alerts */}
            {error && (
                <div className="p-4 bg-[#FEF2F2] border border-[#EF4444]/20 rounded-[14px] flex items-center gap-3 text-[#EF4444]">
                    <AlertCircle size={18} />
                    <p className="font-sans text-[13px] font-[600]">{error}</p>
                </div>
            )}

            {success && (
                <div className="p-4 bg-[#E8FFF5] border border-[#00A878]/20 rounded-[14px] flex items-center gap-3 text-[#00A878]">
                    <CheckCircle size={18} />
                    <p className="font-sans text-[13px] font-[600]">
                        Product successfully {isEditMode ? 'updated' : 'published'}! Redirecting to catalog...
                    </p>
                </div>
            )}

            {/* Main Dynamic Layout Grid */}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT COLUMN: Product Specifications & Uploads */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Basic product specifications form card */}
                    <div className="bg-[#FFFFFF] p-6 sm:p-7 rounded-[20px] border border-[#E5E7EB] space-y-6" style={{ boxShadow: '0 6px 20px rgba(15,23,42,0.04)' }}>
                        <div className="flex items-center gap-3 border-b border-[#F1F5F9] pb-4">
                            <div className="w-10 h-10 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B]">
                                <Info size={18} />
                            </div>
                            <h3 className="font-sans text-[20px] sm:text-[24px] font-[700] text-[#0F172A] tracking-tight">Product Specifications</h3>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block font-sans text-[13px] font-[600] text-[#334155] mb-1.5">
                                    Official Product Name <span className="text-[#00A878]">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`w-full h-[52px] px-4 bg-[#FFFFFF] border rounded-[14px] focus:ring-[4px] outline-none transition-all duration-200 font-sans text-[#0F172A] placeholder-[#94A3B8] text-[15px] ${validationErrors.name
                                        ? 'border-[#EF4444] bg-[#FEF2F2]/30 focus:ring-[#EF4444]/10 focus:border-[#EF4444]'
                                        : 'border-[#CBD5E1] focus:ring-[#00A878]/10 focus:border-[#00A878] hover:border-[#94A3B8]'
                                        }`}
                                    placeholder="Pro Grade Carbon Bat, Premium Football, etc."
                                    required
                                />
                                {validationErrors.name && (
                                    <p className="text-[#EF4444] text-[11px] mt-1.5 font-[500] flex items-center gap-1.5">
                                        <AlertCircle size={12} /> {validationErrors.name}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block font-sans text-[13px] font-[600] text-[#334155] mb-1.5">
                                        Brand Name <span className="text-[#00A878]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="brandName"
                                        value={brandName}
                                        onChange={handleChange}
                                        className="w-full h-[52px] px-4 bg-[#FFFFFF] border border-[#CBD5E1] rounded-[14px] focus:ring-[4px] focus:ring-[#00A878]/10 focus:border-[#00A878] hover:border-[#94A3B8] outline-none transition-all duration-200 font-sans text-[#0F172A] placeholder-[#94A3B8] text-[15px]"
                                        placeholder="CA, MBM, HS Sports…"
                                    />
                                    <p className="text-[11px] text-[#94A3B8] mt-1.5 font-[500]">
                                        Used to build the brand code in your SKU (e.g. CA, MBM, HS).
                                    </p>
                                </div>

                                <div>
                                    <label className="block font-sans text-[13px] font-[600] text-[#334155] mb-1.5">
                                        Catalog Category <span className="text-[#00A878]">*</span>
                                    </label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="w-full h-[52px] px-4 bg-[#FFFFFF] border border-[#CBD5E1] rounded-[14px] focus:ring-[4px] focus:ring-[#00A878]/10 focus:border-[#00A878] hover:border-[#94A3B8] outline-none transition-all duration-200 font-sans text-[#0F172A] text-[15px] cursor-pointer appearance-none"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                    <p className="text-[11px] text-[#94A3B8] mt-1.5 font-[500]">
                                        Cricket uses prefix <span className="font-mono text-[#64748B]">BAT</span> in the SKU.
                                    </p>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between gap-3 mb-1.5">
                                    <label className="block font-sans text-[13px] font-[600] text-[#334155]">
                                        Product SKU {skuManuallyEdited ? '(Manual)' : '(Auto Generated)'}
                                    </label>
                                    {!isEditMode && (
                                        <button
                                            type="button"
                                            onClick={handleRegenerateSku}
                                            className="text-[11px] font-[600] text-[#00A878] hover:text-[#0DBB85] transition-colors"
                                        >
                                            Regenerate
                                        </button>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    name="sku"
                                    value={formData.sku}
                                    onChange={handleChange}
                                    className={`w-full h-[52px] px-4 bg-[#FFFFFF] border rounded-[14px] focus:ring-[4px] outline-none transition-all duration-200 font-sans text-[#0F172A] placeholder-[#94A3B8] text-[15px] font-mono tracking-wide ${validationErrors.sku
                                        ? 'border-[#EF4444] focus:ring-[#EF4444]/10 focus:border-[#EF4444]'
                                        : 'border-[#CBD5E1] focus:ring-[#00A878]/10 focus:border-[#00A878] hover:border-[#94A3B8]'
                                        }`}
                                    placeholder={SKU_FORMAT_EXAMPLE}
                                />
                                {validationErrors.sku && (
                                    <p className="text-[#EF4444] text-[11px] mt-1.5 font-[500] flex items-center gap-1.5">
                                        <AlertCircle size={12} /> {validationErrors.sku}
                                    </p>
                                )}
                                <p className="text-[11px] text-[#94A3B8] mt-1.5 font-[500]">
                                    Autogenerates when brand and product name are entered. Edit manually if needed.
                                </p>
                            </div>

                            <div>
                                <label className="block font-sans text-[13px] font-[600] text-[#334155] mb-1.5">
                                    Product Description Specification <span className="text-[#00A878]">*</span>
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="4"
                                    className={`w-full px-4 py-4 bg-[#FFFFFF] border rounded-[14px] focus:ring-[4px] outline-none transition-all duration-200 font-sans text-[#0F172A] placeholder-[#94A3B8] text-[15px] resize-none ${validationErrors.description
                                        ? 'border-[#EF4444] bg-[#FEF2F2]/30 focus:ring-[#EF4444]/10 focus:border-[#EF4444]'
                                        : 'border-[#CBD5E1] focus:ring-[#00A878]/10 focus:border-[#00A878] hover:border-[#94A3B8]'
                                        }`}
                                    placeholder="Material, size, durability, packaging details..."
                                    maxLength="1000"
                                    required
                                />
                                <div className="flex justify-between items-center mt-2">
                                    {validationErrors.description ? (
                                        <p className="text-[#EF4444] text-[11px] font-[500] flex items-center gap-1.5">
                                            <AlertCircle size={12} /> {validationErrors.description}
                                        </p>
                                    ) : (
                                        <span className="text-[11px] text-[#94A3B8] font-[500]">Clear specifications increase wholesale conversion.</span>
                                    )}
                                    <span className={`text-[11px] font-[500] ${formData.description.length > 900 ? 'text-[#EF4444]' : 'text-[#94A3B8]'}`}>
                                        {formData.description.length} / 1000
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Premium Drag and Drop Image Upload Card */}
                    <div className="bg-[#FFFFFF] p-6 sm:p-7 rounded-[20px] border border-[#E5E7EB] space-y-6" style={{ boxShadow: '0 6px 20px rgba(15,23,42,0.04)' }}>
                        <div className="flex items-center gap-3 border-b border-[#F1F5F9] pb-4">
                            <div className="w-10 h-10 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B]">
                                <ImageIcon size={18} />
                            </div>
                            <h3 className="font-sans text-[20px] sm:text-[24px] font-[700] text-[#0F172A] tracking-tight">Product Assets & Images</h3>
                        </div>

                        <div className="space-y-4">
                            {/* Drag and Drop Zone */}
                            <div
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setIsDragging(false);
                                    processFiles(e.dataTransfer.files);
                                }}
                                className={`border-2 border-dashed rounded-[18px] p-8 transition-all duration-250 flex flex-col items-center justify-center text-center cursor-pointer ${isDragging
                                    ? 'border-[#00A878] bg-[#F8FFFB]'
                                    : 'border-[#CBD5E1] bg-[#FAFCFD] hover:bg-[#F8FFFB] hover:border-[#00A878]'
                                    }`}
                                onClick={() => document.getElementById('file-upload-input').click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    id="file-upload-input"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={(e) => {
                                        processFiles(e.target.files, e.target);
                                    }}
                                    className="hidden"
                                />
                                {uploadingImage ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-8 h-8 border-2 border-[#00A878]/20 border-t-[#00A878] rounded-full animate-spin"></div>
                                        <p className="text-[13px] font-[600] text-[#00A878]">Processing assets...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-14 h-14 bg-[#FFFFFF] rounded-[14px] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] mb-4">
                                            <Upload size={24} />
                                        </div>
                                        <p className="text-[15px] font-[500] text-[#334155]">
                                            Drag & drop your primary cover image or <span className="text-[#00A878] font-[600]">click to upload</span>
                                        </p>
                                        <p className="text-[12px] text-[#94A3B8] mt-2 font-[500]">One primary cover only • JPEG, PNG, or WEBP • Max 5MB</p>
                                    </>
                                )}
                            </div>

                            {imageError && (
                                <p className="text-[#EF4444] text-[11px] font-[500] flex items-center gap-1.5">
                                    <AlertCircle size={12} /> {imageError}
                                </p>
                            )}

                            {/* Manual URL Input Option */}
                            <div className="flex flex-col sm:flex-row gap-3 items-center">
                                <div className="flex-1 w-full">
                                    <input
                                        type="url"
                                        value={imageUrlInput}
                                        onChange={(e) => setImageUrlInput(e.target.value)}
                                        className="w-full h-[44px] px-4 bg-[#FFFFFF] border border-[#CBD5E1] rounded-[12px] focus:ring-[4px] focus:ring-[#00A878]/10 focus:border-[#00A878] hover:border-[#94A3B8] outline-none transition-all duration-200 font-sans text-[#0F172A] placeholder-[#94A3B8] text-[13px]"
                                        placeholder="Or paste external image URL address..."
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddImage}
                                    className="w-full sm:w-auto px-5 h-[44px] bg-[#071A35] text-white text-[13px] font-[600] rounded-[14px] hover:opacity-95 transition-all flex items-center justify-center gap-1.5" style={{ boxShadow: '0 10px 20px rgba(7,26,53,0.15)' }}
                                >
                                    <Plus size={16} /> Add URL
                                </button>
                            </div>

                            {/* Image previews */}
                            {formData.images.length > 0 ? (
                                <div className="mt-4 max-w-xs">
                                    <div className="relative aspect-[4/3] bg-[#F8FAFC] rounded-[14px] border border-[#E2E8F0] overflow-hidden group hover:shadow-md transition-all duration-200">
                                        <img
                                            src={resolveProductImageUrl(formData.images[0])}
                                            alt="Primary cover preview"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.onerror = null;
                                                e.currentTarget.src = resolveProductImageUrl(null);
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(0)}
                                            className="absolute top-2 right-2 p-1.5 bg-[#EF4444] text-white rounded-[8px] opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 hover:bg-[#DC2626]"
                                            title="Remove primary cover"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                        <div className="absolute bottom-0 left-0 right-0 bg-[#0F172A]/70 backdrop-blur-sm py-1 text-center text-[10px] text-white font-[600] uppercase tracking-wider">
                                            Primary cover
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 border border-[#E2E8F0] rounded-[16px] bg-[#F8FAFC] flex flex-col items-center justify-center text-center mt-4">
                                    <ImageIcon size={32} className="text-[#CBD5E1] mb-3" />
                                    <p className="font-sans text-[#64748B] font-[500] text-[13px]">No images uploaded yet. Primary cover asset will represent your B2B listing.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Interactive Live Preview, Prices, and Actions */}
                <div className="lg:col-span-1 space-y-6">

                    {/* Dynamic B2B Live Preview Widget */}
                    <div className="bg-[#FFFFFF] rounded-[20px] border border-[#E5E7EB] p-6 overflow-hidden space-y-5" style={{ boxShadow: '0 6px 20px rgba(15,23,42,0.04)' }}>
                        <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                            <h4 className="font-sans text-[11px] font-[700] uppercase text-[#64748B] tracking-wider flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#00A878] shadow-[0_0_8px_rgba(0,168,120,0.5)] animate-pulse"></span>
                                Live Preview
                            </h4>
                        </div>

                        <div className="aspect-[4/3] rounded-[16px] bg-[#F8FAFC] border border-[#E2E8F0] overflow-hidden relative flex items-center justify-center text-[#CBD5E1]">
                            {formData.images.length > 0 ? (
                                <img
                                    src={resolveProductImageUrl(formData.images[0])}
                                    alt="Live Preview representation"
                                    className="w-full h-full object-contain p-4"
                                    onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = resolveProductImageUrl(null);
                                    }}
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-2 opacity-50">
                                    <ImageIcon size={40} className="text-[#CBD5E1]" />
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] bg-[#E8FFF5] text-[#00A878] px-2.5 py-1 rounded-full font-[700] uppercase tracking-widest border border-[#00A878]/20">
                                    {formData.category}
                                </span>
                                {formData.sku && (
                                    <span className="text-[11px] text-[#94A3B8] font-[500] font-mono">SKU: {formData.sku}</span>
                                )}
                            </div>
                            <h3 className="font-sans text-[17px] font-[700] text-[#0F172A] leading-snug line-clamp-2">
                                {formData.name.trim() || 'Premium Wholesale Product'}
                            </h3>
                            <div className="flex items-baseline justify-between border-t border-[#F1F5F9] pt-4 mt-3">
                                <div className="text-[#94A3B8] text-[11px] font-[500] tracking-wide">Bulk Price</div>
                                <div className="font-sans text-[19px] font-[700] text-[#0F172A]">
                                    {formData.pricePerBulkUnit ? `PKR ${Number(formData.pricePerBulkUnit).toLocaleString()}` : 'PKR --'}
                                    <span className="text-[#94A3B8] text-[13px] font-[500] font-sans"> / {formData.bulkUnit}</span>
                                </div>
                            </div>

                            {dozenPricingMode && dozenPreviewTotal > 0 && (
                                <div className="rounded-[14px] border border-[#E8FFF5] bg-[#F8FFFC] px-3.5 py-3 space-y-1.5">
                                    <div className="flex items-center justify-between text-[12px] font-[600] text-[#334155]">
                                        <span className="text-[#64748B]">Single Unit</span>
                                        <span>{formatPKR(Number(singleUnitPrice))}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[12px] font-[700] text-[#0F172A]">
                                        <span className="text-[#64748B]">1 Dozen (12 Units)</span>
                                        <span>{formatPKR(dozenPreviewTotal)}</span>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-[#F1F5F9] text-[12px] font-[500] text-[#64748B]">
                                <div>
                                    <span className="text-[#94A3B8]">Min Order:</span>{' '}
                                    <span className="text-[#0F172A] font-[700]">{moqPreview.primary}</span>
                                    {moqPreview.secondary && (
                                        <span className="block text-[10px] text-[#94A3B8] font-[500] mt-0.5">{moqPreview.secondary}</span>
                                    )}
                                </div>
                                <div className="text-right">
                                    <span className="text-[#94A3B8]">Pack size:</span> {formData.packSize} Units
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Premium Wholesale & Bulk Pricing Card */}
                    <div className="bg-[#FFFFFF] p-6 rounded-[20px] border border-[#E5E7EB] space-y-5" style={{ boxShadow: '0 6px 20px rgba(15,23,42,0.04)' }}>
                        <div className="flex items-center gap-3 border-b border-[#F1F5F9] pb-4">
                            <div className="w-10 h-10 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#64748B]">
                                <Banknote size={18} />
                            </div>
                            <h3 className="font-sans text-[20px] sm:text-[24px] font-[700] text-[#0F172A] tracking-tight">Bulk Sales Details</h3>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block font-sans text-[13px] font-[600] text-[#334155] mb-1.5">
                                    Bulk Pack Unit Type <span className="text-[#00A878]">*</span>
                                </label>
                                <select
                                    name="bulkUnit"
                                    value={formData.bulkUnit}
                                    onChange={handleChange}
                                    className="w-full h-[52px] px-4 bg-[#FFFFFF] border border-[#CBD5E1] rounded-[14px] focus:ring-[4px] focus:ring-[#00A878]/10 focus:border-[#00A878] hover:border-[#94A3B8] outline-none transition-all duration-200 font-sans text-[#0F172A] text-[15px] cursor-pointer"
                                >
                                    {bulkUnits.map(unit => (
                                        <option key={unit} value={unit}>{unit}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-sans text-[13px] font-[600] text-[#334155] mb-1.5">
                                        Units Per Bulk Pack <span className="text-[#00A878]">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="packSize"
                                        value={formData.packSize}
                                        onChange={handleChange}
                                        min="1"
                                        max="999"
                                        readOnly={packSizeReadOnly}
                                        disabled={packSizeReadOnly}
                                        className={`w-full h-[52px] px-4 border rounded-[14px] focus:ring-[4px] outline-none transition-all duration-200 font-sans text-[15px] ${packSizeReadOnly
                                            ? 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] cursor-not-allowed'
                                            : validationErrors.packSize
                                                ? 'bg-[#FFFFFF] border-[#EF4444] focus:ring-[#EF4444]/10 focus:border-[#EF4444] text-[#0F172A]'
                                                : 'bg-[#FFFFFF] border-[#CBD5E1] focus:ring-[#00A878]/10 focus:border-[#00A878] hover:border-[#94A3B8] text-[#0F172A]'
                                            }`}
                                        required
                                    />
                                    {packSizeReadOnly ? (
                                        <p className="text-[11px] text-[#64748B] mt-1.5 font-[500]">{BULK_PACK_MESSAGES.dozenHelper}</p>
                                    ) : (
                                        <p className="text-[11px] text-[#94A3B8] mt-1.5 font-[500]">Enter units per pack (1–999).</p>
                                    )}
                                    {validationErrors.packSize && (
                                        <p className="text-[#EF4444] text-[11px] mt-1.5 font-[500] flex items-center gap-1.5">
                                            <AlertCircle size={12} /> {validationErrors.packSize}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block font-sans text-[13px] font-[600] text-[#334155] mb-1.5">
                                        Min Order Qty ({formData.bulkUnit}s)
                                    </label>
                                    <input
                                        type="number"
                                        name="minimumOrderQuantity"
                                        value={formData.minimumOrderQuantity}
                                        onChange={handleChange}
                                        min="1"
                                        className="w-full h-[52px] px-4 bg-[#FFFFFF] border border-[#CBD5E1] rounded-[14px] focus:ring-[4px] focus:ring-[#00A878]/10 focus:border-[#00A878] hover:border-[#94A3B8] outline-none transition-all duration-200 font-sans text-[#0F172A] text-[15px]"
                                        required
                                    />
                                    {validationErrors.minimumOrderQuantity && (
                                        <p className="text-[#EF4444] text-[11px] mt-1.5 font-[500]">{validationErrors.minimumOrderQuantity}</p>
                                    )}
                                </div>
                            </div>

                            {dozenPricingMode ? (
                                <>
                                    <div>
                                        <label className="block font-sans text-[13px] font-[600] text-[#334155] mb-1.5">
                                            Single Unit Price (PKR) <span className="text-[#00A878]">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="singleUnitPrice"
                                            value={singleUnitPrice}
                                            onChange={handleSingleUnitPriceChange}
                                            min="1"
                                            step="1"
                                            inputMode="numeric"
                                            className={`w-full h-[52px] px-4 bg-[#FFFFFF] border rounded-[14px] focus:ring-[4px] outline-none transition-all duration-200 font-sans text-[#0F172A] placeholder-[#94A3B8] text-[15px] ${validationErrors.singleUnitPrice
                                                ? 'border-[#EF4444] bg-[#FEF2F2]/30 focus:ring-[#EF4444]/10 focus:border-[#EF4444]'
                                                : 'border-[#CBD5E1] focus:ring-[#00A878]/10 focus:border-[#00A878] hover:border-[#94A3B8]'
                                                }`}
                                            placeholder="95000"
                                            required
                                        />
                                        {validationErrors.singleUnitPrice && (
                                            <p className="text-[#EF4444] text-[11px] mt-1.5 font-[500] flex items-center gap-1.5">
                                                <AlertCircle size={12} /> {validationErrors.singleUnitPrice}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block font-sans text-[13px] font-[600] text-[#334155] mb-1.5">
                                            Price Per Dozen (PKR) <span className="text-[#00A878]">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="pricePerBulkUnit"
                                            value={formData.pricePerBulkUnit}
                                            readOnly
                                            disabled
                                            className="w-full h-[52px] px-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[14px] font-sans text-[#64748B] text-[15px] cursor-not-allowed"
                                            placeholder="0"
                                        />
                                        <p className="text-[11px] text-[#64748B] mt-1.5 font-[500]">
                                            {DOZEN_PRICING_MESSAGES.dozenHelper}
                                        </p>
                                    </div>

                                    {dozenPreviewTotal > 0 && (
                                        <div className="rounded-[16px] border border-[#E2E8F0] bg-gradient-to-br from-[#F8FAFC] to-[#F8FFFC] p-4 space-y-2">
                                            <p className="text-[10px] font-[700] uppercase tracking-[0.12em] text-[#64748B]">
                                                Pricing Preview
                                            </p>
                                            <div className="flex items-center justify-between text-[13px] font-[600] text-[#334155]">
                                                <span>Single Unit</span>
                                                <span className="text-[#0F172A]">{formatPKR(Number(singleUnitPrice))}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-[13px] font-[700] text-[#0F172A]">
                                                <span>1 Dozen (12 Units)</span>
                                                <span className="text-[#00A878]">{formatPKR(dozenPreviewTotal)}</span>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div>
                                    <label className="block font-sans text-[13px] font-[600] text-[#334155] mb-1.5">
                                        Price Per {formData.bulkUnit} (PKR) <span className="text-[#00A878]">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="pricePerBulkUnit"
                                        value={formData.pricePerBulkUnit}
                                        onChange={handleChange}
                                        min="0"
                                        className={`w-full h-[52px] px-4 bg-[#FFFFFF] border rounded-[14px] focus:ring-[4px] outline-none transition-all duration-200 font-sans text-[#0F172A] placeholder-[#94A3B8] text-[15px] ${validationErrors.pricePerBulkUnit
                                            ? 'border-[#EF4444] bg-[#FEF2F2]/30 focus:ring-[#EF4444]/10 focus:border-[#EF4444]'
                                            : 'border-[#CBD5E1] focus:ring-[#00A878]/10 focus:border-[#00A878] hover:border-[#94A3B8]'
                                            }`}
                                        placeholder="0"
                                        required
                                    />
                                    {validationErrors.pricePerBulkUnit && (
                                        <p className="text-[#EF4444] text-[11px] mt-1.5 font-[500] flex items-center gap-1.5">
                                            <AlertCircle size={12} /> {validationErrors.pricePerBulkUnit}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="block font-sans text-[13px] font-[600] text-[#334155] mb-1.5">
                                    Total Stock Available ({formData.bulkUnit}s) <span className="text-[#00A878]">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="stock"
                                    value={formData.stock}
                                    onChange={handleChange}
                                    min="0"
                                    className={`w-full h-[52px] px-4 bg-[#FFFFFF] border rounded-[14px] focus:ring-[4px] outline-none transition-all duration-200 font-sans text-[#0F172A] placeholder-[#94A3B8] text-[15px] ${validationErrors.stock
                                        ? 'border-[#EF4444] bg-[#FEF2F2]/30 focus:ring-[#EF4444]/10 focus:border-[#EF4444]'
                                        : 'border-[#CBD5E1] focus:ring-[#00A878]/10 focus:border-[#00A878] hover:border-[#94A3B8]'
                                        }`}
                                    placeholder="0"
                                    required
                                />
                                {validationErrors.stock && (
                                    <p className="text-[#EF4444] text-[11px] mt-1.5 font-[500] flex items-center gap-1.5">
                                        <AlertCircle size={12} /> {validationErrors.stock}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Floating Premium Publishing Sticky Action Card */}
                    <div className="bg-[#FFFFFF] p-6 rounded-[20px] border border-[#E5E7EB] space-y-4 sticky top-6 z-20" style={{ boxShadow: '0 6px 20px rgba(15,23,42,0.04)' }}>
                        <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3 mb-2">
                            <span className="text-[11px] font-[700] text-[#64748B] uppercase tracking-widest">
                                Listing Status
                            </span>
                            <span className="text-[11px] bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] px-2.5 py-0.5 rounded-full font-[600] uppercase tracking-wider">
                                {isEditMode ? 'Active Catalog' : 'New Draft'}
                            </span>
                        </div>

                        <div className="flex gap-3 flex-col">
                            <button
                                type="submit"
                                disabled={loading || isReadOnlyMode || Object.keys(validationErrors).length > 0}
                                className="w-full h-[52px] px-4 bg-[#00A878] text-white font-sans font-[700] text-[15px] rounded-[14px] hover:bg-[#0DBB85] transition-all flex items-center justify-center gap-2 disabled:bg-[#F1F5F9] disabled:text-[#94A3B8] disabled:shadow-none hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed" style={{ boxShadow: loading || isReadOnlyMode || Object.keys(validationErrors).length > 0 ? 'none' : '0 12px 24px rgba(0,168,120,0.25)' }}
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        {isEditMode ? 'Update Listing' : 'Publish Product'}
                                    </>
                                )}
                            </button>

                            <Link
                                href="/manufacturer/products"
                                className="block w-full text-center py-2 text-[#64748B] font-sans font-[500] text-[13px] hover:text-[#0F172A] transition-colors"
                            >
                                Cancel and return
                            </Link>
                        </div>
                    </div>

                    {/* Listing Guidelines */}
                    <div className="relative p-6 bg-[#F8FAFC] rounded-[18px] border border-[#E2E8F0] space-y-4 overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#00A878] rounded-l-[18px]"></div>
                        <h4 className="font-sans text-[13px] font-[700] text-[#334155] flex items-center gap-2">
                            <Layers size={16} className="text-[#64748B]" />
                            Listing Guidelines
                        </h4>
                        <ul className="space-y-2.5">
                            <li className="font-sans text-[12px] text-[#64748B] font-[500] leading-relaxed flex gap-2"><span className="text-[#00A878]">•</span> Keep MOQ reasonable to invite first-time wholesale buyers.</li>
                            <li className="font-sans text-[12px] text-[#64748B] font-[500] leading-relaxed flex gap-2"><span className="text-[#00A878]">•</span> Accurate SKU helps match inventory logic efficiently.</li>
                            <li className="font-sans text-[12px] text-[#64748B] font-[500] leading-relaxed flex gap-2"><span className="text-[#00A878]">•</span> Prices are structured around the selected bulk pack size.</li>
                        </ul>
                    </div>

                </div>
            </form>
        </div>
    );
};

export default ProductForm;
