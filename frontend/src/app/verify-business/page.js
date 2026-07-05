"use client";

import { getApiBaseUrl } from '@/lib/api';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/shared/ProtectedRoute';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { getAllPakistanCities, isRecognizedCity } from '@/lib/pakistanLocations';
import { getVerificationDisplayState } from '@/lib/verificationStats';

const PAKISTAN_CITIES = getAllPakistanCities();

const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const ALLOWED_DOCUMENT_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];
const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024;

const validateBusinessDocument = (file) => {
    if (!file) {
        return 'Please upload your NTN Registration Document before continuing.';
    }

    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_DOCUMENT_EXTENSIONS.includes(extension) || !ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
        return 'Please upload a valid PDF, JPG, JPEG, or PNG file.';
    }

    if (file.size > MAX_DOCUMENT_SIZE) {
        return 'File size exceeds 5MB limit.';
    }

    return '';
};

const VerifyBusiness = () => {
    const [formData, setFormData] = useState({
        businessLicense: null,
        taxId: '',
        city: '',
        address: '',
        phone: '',
        website: ''
    });
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [uploaded, setUploaded] = useState(false);
    const [documentTouched, setDocumentTouched] = useState(false);
    const { user, updateVerificationStatus, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (authLoading || !user) return;
        const state = getVerificationDisplayState(user);
        if (state === 'pending' || state === 'approved') {
            router.replace('/verification-status');
        }
    }, [authLoading, user, router]);

    const validateField = (name, value) => {
        let error = '';
        if (name === 'taxId') {
            if (!value) error = 'NTN must contain only numbers';
            else if (!/^\d+$/.test(value)) error = 'NTN must contain only numbers';
            else if (value.length < 7 || value.length > 9) error = 'NTN should be 7-9 digits';
        }
        if (name === 'address') {
            if (!value || !value.trim()) error = 'Business address is required';
        }
        if (name === 'phone') {
            if (!value) {
                error = 'Phone number is required';
            } else {
                const plain = value.replace(/[\s-]/g, '');
                if (!/^\+?\d+$/.test(plain)) {
                    error = 'Phone must contain only numbers';
                } else if (!/^((\+92)|(0092))?3[0-9]{9}$|^03[0-9]{9}$/.test(plain)) {
                    error = 'Invalid Pakistan phone format (e.g. 03001234567)';
                }
            }
        }
        if (name === 'city') {
            if (!isRecognizedCity(value)) error = 'Please select a valid city';
        }
        return error;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError(null);
        
        // Final validation
        const newErrors = {};
        Object.keys(formData).forEach(key => {
            if (key !== 'businessLicense' && key !== 'website') {
                const error = validateField(key, formData[key]);
                if (error) newErrors[key] = error;
            }
        });

        const documentError = validateBusinessDocument(formData.businessLicense);
        if (documentError) {
            newErrors.businessLicense = documentError;
        }
        setDocumentTouched(true);

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            const fieldOrder = ['businessLicense', 'taxId', 'city', 'address', 'phone'];
            const firstErrField = fieldOrder.find((field) => newErrors[field]) || Object.keys(newErrors)[0];
            const element = document.getElementById(firstErrField);
            if (element) {
                element.focus();
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        if (!user) {
            setServerError('Your session is still loading. Please wait a moment and try again.');
            return;
        }

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setServerError('You are not signed in. Please log in and try again.');
                setSubmitting(false);
                return;
            }
            const formDataToSend = new FormData();
            formDataToSend.append('taxId', formData.taxId);
            formDataToSend.append('city', formData.city);
            formDataToSend.append('address', formData.address);
            formDataToSend.append('phone', formData.phone.replace(/[\s-]/g, ''));
            formDataToSend.append('website', formData.website);
            formDataToSend.append('businessLicense', formData.businessLicense);

            const response = await fetch(`${getApiBaseUrl()}/api/auth/verify-business`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formDataToSend
            });

            const data = await response.json();

            if (data.success) {
                const nextDetails = data.data?.businessDetails || user?.businessDetails;
                updateVerificationStatus('pending', { businessDetails: nextDetails });
                router.replace('/verification-status');
            } else {
                setServerError(data.error || 'Failed to submit verification');
            }
        } catch (err) {
            console.error('Submission error:', err);
            setServerError('Error connecting to server. Please try again later.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setDocumentTouched(true);

        if (!file) {
            setFormData((prev) => ({ ...prev, businessLicense: null }));
            setUploaded(false);
            setErrors((prev) => ({
                ...prev,
                businessLicense: 'Please upload your NTN Registration Document before continuing.',
            }));
            return;
        }

        const documentError = validateBusinessDocument(file);
        if (documentError) {
            setFormData((prev) => ({ ...prev, businessLicense: null }));
            setUploaded(false);
            setErrors((prev) => ({ ...prev, businessLicense: documentError }));
            e.target.value = '';
            return;
        }

        setFormData((prev) => ({ ...prev, businessLicense: file }));
        setUploaded(true);
        setErrors((prev) => ({ ...prev, businessLicense: '' }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Block alphabets for taxId and phone in real-time
        if ((name === 'taxId' || name === 'phone') && value !== '' && !/^\+?[\d\s-]*$/.test(value)) {
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Real-time validation feedback
        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));
    };

    if (authLoading) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen flex items-center justify-center bg-slate-900">
                    <div className="text-center">
                        <Loader2 size={40} className="animate-spin text-emerald-500 mx-auto mb-4" />
                        <p className="text-white/70 text-sm font-medium">Loading your account…</p>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    const verificationState = getVerificationDisplayState(user);
    if (user && (verificationState === 'pending' || verificationState === 'approved')) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen flex items-center justify-center bg-slate-900">
                    <Loader2 size={40} className="animate-spin text-emerald-500 mx-auto mb-4" />
                </div>
            </ProtectedRoute>
        );
    }

    if (!user) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
                    <div className="max-w-md text-center bg-white rounded-2xl p-8 shadow-xl">
                        <AlertCircle className="text-amber-500 mx-auto mb-3" size={32} />
                        <h2 className="font-heading text-lg font-bold text-slate-900 mb-2">Session unavailable</h2>
                        <p className="text-slate-600 text-sm mb-4">
                            We could not load your account. Please sign in again to submit verification.
                        </p>
                        <button
                            type="button"
                            onClick={() => router.replace('/login?from=/verify-business')}
                            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700"
                        >
                            Go to sign in
                        </button>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="relative min-h-screen pt-32 pb-20 px-4 overflow-hidden bg-slate-900">
                <div className="absolute inset-0 z-0">
                    <img
                        src="/assets/images/Babar azam.webp"
                        alt=""
                        className="w-full h-full object-cover object-[center_20%] opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 to-emerald-900/85 mix-blend-multiply"></div>
                </div>

                <div className="relative z-10 max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
                    <div className="text-center mb-8">
                        <h1 className="font-heading text-4xl font-bold text-slate-900 mb-2">
                            {user?.role === 'wholesaler' ? 'Business Verification' : 'Manufacturer Verification'}
                        </h1>
                        <p className="font-body text-slate-600">
                            Complete your business verification to access all features on GearUp
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block font-body font-medium text-slate-900 mb-2">
                                Business License / Registration Certificate
                            </label>
                            <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                                errors.businessLicense
                                    ? 'border-red-500 bg-red-50'
                                    : uploaded
                                        ? 'border-emerald-500 bg-emerald-50'
                                        : 'border-neutral-300 hover:border-emerald-600'
                            }`}>
                                <input
                                    type="file"
                                    id="businessLicense"
                                    onChange={handleFileChange}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className="hidden"
                                />
                                <label htmlFor="businessLicense" className="cursor-pointer">
                                    {uploaded ? (
                                        <div className="flex flex-col items-center">
                                            <CheckCircle className="text-emerald-600 mb-2" size={48} />
                                            <span className="font-body text-sm text-emerald-700 font-medium">File uploaded: {formData.businessLicense?.name}</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <Upload className="text-neutral-400 mb-2" size={48} />
                                            <span className="font-body text-sm text-neutral-600">Click to upload or drag and drop</span>
                                            <span className="font-body text-xs text-neutral-500 mt-1">PDF, JPG, or PNG (max 5MB)</span>
                                        </div>
                                    )}
                                </label>
                            </div>
                            {documentTouched && errors.businessLicense && (
                                <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                                    <AlertCircle size={12} /> {errors.businessLicense}
                                </p>
                            )}
                            {uploaded && !errors.businessLicense && formData.businessLicense && (
                                <p className="text-emerald-600 text-xs mt-2 flex items-center gap-1">
                                    <CheckCircle size={12} /> Document uploaded successfully
                                </p>
                            )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="taxId" className="block font-body font-medium text-slate-900 mb-2">Tax ID / NTN</label>
                                <input
                                    type="text"
                                    id="taxId"
                                    name="taxId"
                                    value={formData.taxId}
                                    onChange={handleChange}
                                    required
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-600 outline-none font-body transition-all ${
                                        errors.taxId ? 'border-red-500 ring-2 ring-red-50 focus:border-red-500' : 'border-neutral-300 focus:border-emerald-600'
                                    }`}
                                    placeholder="e.g. 1234567"
                                />
                                {errors.taxId && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12}/> {errors.taxId}</p>}
                            </div>

                            <div>
                                <label htmlFor="city" className="block font-body font-medium text-slate-900 mb-2">City</label>
                                <select
                                    id="city"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    required
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-600 outline-none font-body appearance-none bg-white transition-all ${
                                        errors.city ? 'border-red-500 ring-2 ring-red-50 focus:border-red-500' : 'border-neutral-300 focus:border-emerald-600'
                                    }`}
                                >
                                    <option value="">Select City</option>
                                    {PAKISTAN_CITIES.map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                                {errors.city && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12}/> {errors.city}</p>}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="address" className="block font-body font-medium text-slate-900 mb-2">Business Address</label>
                            <textarea
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                required
                                rows="2"
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-600 outline-none font-body transition-all ${
                                        errors.address ? 'border-red-500 ring-2 ring-red-50 focus:border-red-500' : 'border-neutral-300 focus:border-emerald-600'
                                    }`}
                                placeholder="Full business address"
                            />
                            {errors.address && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12}/> {errors.address}</p>}
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="phone" className="block font-body font-medium text-slate-900 mb-2">Phone Number</label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-600 outline-none font-body transition-all ${
                                        errors.phone ? 'border-red-500 ring-2 ring-red-50 focus:border-red-500' : 'border-neutral-300 focus:border-emerald-600'
                                    }`}
                                    placeholder="03001234567"
                                />
                                {errors.phone && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12}/> {errors.phone}</p>}
                            </div>

                            <div>
                                <label htmlFor="website" className="block font-body font-medium text-slate-900 mb-2">Website (Optional)</label>
                                <input
                                    type="url"
                                    id="website"
                                    name="website"
                                    value={formData.website}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-600 outline-none font-body focus:border-emerald-600"
                                    placeholder="https://example.com"
                                />
                            </div>
                        </div>

                        <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                            <p className="font-body text-xs text-neutral-600 leading-relaxed">
                                <strong>Note:</strong> Verification ensures platform safety. Documents are handled securely. 
                                Verification typically takes 1-2 business days.
                            </p>
                        </div>

                        {serverError && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-600 font-body font-bold text-xs leading-relaxed animate-in fade-in duration-200">
                                <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
                                <span>{serverError}</span>
                            </div>
                        )}

                        <div className="flex space-x-4 pt-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="flex-1 px-6 py-3 border-2 border-neutral-200 text-neutral-600 rounded-xl font-body font-bold text-xs uppercase tracking-widest hover:bg-neutral-50 transition-all disabled:opacity-50"
                                disabled={submitting}
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || Object.values(errors).some(x => x)}
                                className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl font-body font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    'Submit Verification'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default VerifyBusiness;
