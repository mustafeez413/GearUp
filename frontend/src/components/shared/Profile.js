"use client";

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getApiBaseUrl } from '@/lib/api';
import {
    CITY_PROVINCE_MISMATCH_ERROR,
    getCitiesForProvince,
    normalizeProvince,
    PAKISTAN_PROVINCES,
} from '@/lib/pakistanLocations';
import { User, Building, Mail, Phone, MapPin, Camera, ShieldCheck, FileText, CheckCircle, AlertCircle, Building2, Trash2, Pencil, Save, X, Lock, Eye, EyeOff, KeyRound, Clock, Settings } from 'lucide-react';
import { useSearchParams, usePathname } from 'next/navigation';
import VerificationStatusBanner from '@/components/shared/VerificationStatusBanner';
import useReadOnlyMode from '@/hooks/useReadOnlyMode';
import { getVerificationDisplayState } from '@/lib/verificationStats';
import UserAvatar from '@/components/ui/UserAvatar';

function buildProfileFormState(user) {
    const bd = user?.businessDetails;
    const pd = user?.paymentDetails;
    return {
        name: user?.name || '',
        email: user?.email || '',
        company: bd?.businessName || '',
        phone: bd?.phone || '',
        address: bd?.address || '',
        city: bd?.city || '',
        province: normalizeProvince(bd?.province || ''),
        taxId: bd?.taxId || '',
        bankName: pd?.bankName || '',
        accountTitle: pd?.accountTitle || '',
        accountNumber: pd?.accountNumber || '',
        iban: pd?.iban || '',
        jazzCashNumber: pd?.jazzCashNumber || '',
        easypaisaNumber: pd?.easypaisaNumber || '',
        paymentMethodType: pd?.paymentMethodType || 'Bank Account',
        sadaPayNumber: pd?.sadaPayNumber || '',
        nayaPayNumber: pd?.nayaPayNumber || '',
        otherWalletName: pd?.otherWalletName || '',
        otherWalletNumber: pd?.otherWalletNumber || '',
        paymentNotes: pd?.paymentNotes || ''
    };
}

const UserProfileInner = ({ isDashboard = false }) => {
    const { user, updateUser } = useAuth();
    const { isReadOnlyMode, guardAction } = useReadOnlyMode();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(() => buildProfileFormState(null));
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const fileInputRef = React.useRef(null);
    const [validationError, setValidationError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Password change states
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [pwError, setPwError] = useState(null);
    const [pwSuccess, setPwSuccess] = useState(null);
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);

    const searchParams = useSearchParams();
    const pathname = usePathname();

    // Navigation tab state ('account' | 'settings')
    const [activeTab, setActiveTab] = useState(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get('tab');
            if (tabParam === 'settings') return 'settings';
            if (tabParam === 'account') return 'account';
            if (window.location.pathname.includes('settings')) return 'settings';
        }
        return 'account';
    });

    useEffect(() => {
        const tabParam = searchParams?.get('tab');
        if (tabParam === 'settings') {
            setActiveTab('settings');
        } else if (tabParam === 'account') {
            setActiveTab('account');
        } else if (pathname?.includes('settings')) {
            setActiveTab('settings');
        } else {
            setActiveTab('account');
        }
    }, [searchParams, pathname]);

    useEffect(() => {
        if (activeTab === 'settings') {
            setShowChangePassword(true);
        }
    }, [activeTab]);

    useEffect(() => {
        setFormData(buildProfileFormState(user));
        setPreview(user?.avatar || null);
        
        // Admin overrides: load platform settings as the source of truth for payment details
        const fetchAdminSettings = async () => {
            if (user?.role === 'admin') {
                try {
                    const token = localStorage.getItem('token');
                    const res = await fetch(`${getApiBaseUrl()}/api/auth/settings`, {
                        headers: { Authorization: `Bearer ${token}` },
                        cache: 'no-store'
                    });
                    const data = await res.json();
                    if (data.success && data.data) {
                        setFormData(prev => ({
                            ...prev,
                            bankName: data.data.platformBankDetails?.bankName || '',
                            accountTitle: data.data.platformBankDetails?.accountTitle || '',
                            accountNumber: data.data.platformBankDetails?.accountNumber || '',
                            iban: data.data.platformBankDetails?.iban || '',
                            jazzCashNumber: data.data.platformMobileMoney?.jazzCashNumber || '',
                            easypaisaNumber: data.data.platformMobileMoney?.easypaisaNumber || ''
                        }));
                    }
                } catch (err) {
                    console.error("Failed to load admin settings", err);
                }
            }
        };
        fetchAdminSettings();
    }, [user]);


    // Dynamic cities filter depending on selected province
    const availableCities = useMemo(() => {
        if (!formData.province) return [];
        return getCitiesForProvince(formData.province);
    }, [formData.province]);

    const verificationState = getVerificationDisplayState(user);
    const showVerificationSection = user?.role === 'manufacturer' || user?.role === 'wholesaler';

    const verificationBadge = useMemo(() => {
        if (!showVerificationSection) {
            return {
                label: `Verified ${user?.role || 'Partner'}`,
                className: 'text-[#00A878] bg-[#00A878]/10',
                icon: ShieldCheck,
            };
        }
        switch (verificationState) {
            case 'approved':
                return {
                    label: 'Business Verified',
                    className: 'text-[#00A878] bg-[#00A878]/10',
                    icon: ShieldCheck,
                };
            case 'pending':
                return {
                    label: 'Pending Review',
                    className: 'text-amber-700 bg-amber-100',
                    icon: Clock,
                };
            case 'rejected':
                return {
                    label: 'Action Required',
                    className: 'text-rose-700 bg-rose-100',
                    icon: AlertCircle,
                };
            default:
                return {
                    label: 'Verification Not Submitted',
                    className: 'text-slate-600 bg-slate-100',
                    icon: AlertCircle,
                };
        }
    }, [verificationState, showVerificationSection, user?.role]);

    const verificationStatusLabel = useMemo(() => {
        if (!showVerificationSection) return 'Verified';
        switch (verificationState) {
            case 'approved':
                return 'Verified';
            case 'pending':
                return 'Pending Review';
            case 'rejected':
                return 'Action Required';
            default:
                return 'Not Submitted';
        }
    }, [verificationState, showVerificationSection]);

    const verificationStatusClass = useMemo(() => {
        if (!showVerificationSection || verificationState === 'approved') {
            return 'text-[#00A878]';
        }
        if (verificationState === 'pending') return 'text-amber-400';
        if (verificationState === 'rejected') return 'text-rose-400';
        return 'text-slate-400';
    }, [verificationState, showVerificationSection]);

    const VerificationBadgeIcon = verificationBadge.icon;

    // Client-side validators
    const validatePhone = (phone) => {
        if (!phone) return false;
        const plain = phone.replace(/[\s-]/g, '');
        return /^((\+92)|(0092))?3[0-9]{9}$|^03[0-9]{9}$/.test(plain);
    };

    const validateTaxId = (tax) => {
        if (!tax) return true;
        return /^\d{7,9}$/.test(tax);
    };

    const validateBankName = (val) => {
        if (!val) return false;
        return /^[a-zA-Z\s&\-\.]{3,50}$/.test(val);
    };

    const validateAccountTitle = (val) => {
        if (!val) return false;
        return /^[a-zA-Z0-9\s]{3,100}$/.test(val);
    };

    const validateAccountNumber = (val) => {
        if (!val) return false;
        return /^\d{8,24}$/.test(val);
    };

    const validateIBAN = (val) => {
        if (!val) return false;
        return /^PK[a-zA-Z0-9]{22}$/.test(val);
    };

    const validateMobileMoney = (val) => {
        if (!val) return false;
        return /^03\d{9}$/.test(val);
    };

    const handlePhoneChange = (e) => {
        const val = e.target.value;
        // Block alphabets inside phone in real-time (permitting digits, +, spaces, and dashes)
        if (val !== '' && !/^\+?[\d\s-]*$/.test(val)) {
            return;
        }
        setFormData(prev => ({ ...prev, phone: val }));
    };

    const handleTaxChange = (e) => {
        const val = e.target.value;
        const cleaned = val.replace(/\D/g, '');
        setFormData(prev => ({ ...prev, taxId: cleaned }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!guardAction()) return;
        setValidationError(null);
        setSuccessMessage(null);

        // Strict validation guards
        if (!formData.name.trim()) {
            setValidationError('Please enter a valid full name.');
            return;
        }

        if (!formData.company.trim()) {
            setValidationError('Please enter a valid company name.');
            return;
        }

        if (!formData.phone) {
            setValidationError('Phone number is required.');
            const phoneField = document.getElementById('phone');
            if (phoneField) phoneField.focus();
            return;
        }

        if (!validatePhone(formData.phone)) {
            setValidationError('Please enter a valid Pakistan mobile number starting with 03 or +923 (e.g. 03001234567).');
            const phoneField = document.getElementById('phone');
            if (phoneField) phoneField.focus();
            return;
        }

        if (!formData.province) {
            setValidationError('Please select a valid province/state.');
            return;
        }

        if (!formData.city) {
            setValidationError('Please select a valid city.');
            return;
        }

        // Dependent validation check
        const allowedCities = getCitiesForProvince(formData.province);
        if (!allowedCities.some((city) => city.toLowerCase() === formData.city.toLowerCase())) {
            setValidationError(CITY_PROVINCE_MISMATCH_ERROR);
            return;
        }

        if (formData.taxId && !validateTaxId(formData.taxId)) {
            setValidationError('NTN Number must be exactly 7 to 9 numeric digits.');
            return;
        }



        try {
            setIsSaving(true);
            const token = localStorage.getItem('token');
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('email', formData.email);
            formDataToSend.append('businessDetails', JSON.stringify({
                businessName: formData.company,
                phone: formData.phone.replace(/[\s-]/g, ''),
                address: formData.address,
                city: formData.city,
                province: formData.province,
                taxId: formData.taxId
            }));
            formDataToSend.append('paymentDetails', JSON.stringify({
                paymentMethodType: formData.paymentMethodType,
                bankName: formData.bankName,
                accountTitle: formData.accountTitle,
                accountNumber: formData.accountNumber,
                iban: formData.iban,
                jazzCashNumber: formData.jazzCashNumber,
                easypaisaNumber: formData.easypaisaNumber,
                sadaPayNumber: formData.sadaPayNumber,
                nayaPayNumber: formData.nayaPayNumber,
                otherWalletName: formData.otherWalletName,
                otherWalletNumber: formData.otherWalletNumber,
                paymentNotes: formData.paymentNotes
            }));
            if (selectedFile) {
                formDataToSend.append('avatar', selectedFile);
            }

            const res = await fetch(`${getApiBaseUrl()}/api/auth/profile`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formDataToSend
            });
            const data = await res.json();
            if (data.success) {
                if (data.reverificationRequired) {
                    setSuccessMessage('Profile updated. Changing verified business details resets verification status to Pending for Admin review.');
                } else {
                    setSuccessMessage(data.message || 'Profile updated successfully!');
                }
                updateUser({
                    ...user,
                    ...(data.data || {}),
                    name: formData.name,
                    email: formData.email,
                    avatar: data.data?.avatar || user.avatar,
                    verificationStatus: data.reverificationRequired ? 'pending' : (data.data?.verificationStatus || user?.verificationStatus),
                    businessDetails: {
                        ...user?.businessDetails,
                        ...(data.data?.businessDetails || {}),
                        businessName: formData.company,
                        phone: formData.phone,
                        address: formData.address,
                        city: formData.city,
                        province: formData.province,
                        taxId: formData.taxId,
                        isVerified: data.reverificationRequired ? false : (user?.businessDetails?.isVerified)
                    },
                    paymentDetails: {
                        ...user?.paymentDetails,
                        paymentMethodType: formData.paymentMethodType,
                        bankName: formData.bankName,
                        accountTitle: formData.accountTitle,
                        accountNumber: formData.accountNumber,
                        iban: formData.iban,
                        jazzCashNumber: formData.jazzCashNumber,
                        easypaisaNumber: formData.easypaisaNumber,
                        sadaPayNumber: formData.sadaPayNumber,
                        nayaPayNumber: formData.nayaPayNumber,
                        otherWalletName: formData.otherWalletName,
                        otherWalletNumber: formData.otherWalletNumber,
                        paymentNotes: formData.paymentNotes
                    }
                });
                setIsEditing(false);
                
                // NEW LOGIC: Admin settings must sync to the central Settings collection
                if (user?.role === 'admin') {
                    await fetch(`${getApiBaseUrl()}/api/admin/settings`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            platformBankDetails: {
                                bankName: formData.bankName,
                                accountTitle: formData.accountTitle,
                                accountNumber: formData.accountNumber,
                                iban: formData.iban
                            },
                            platformMobileMoney: {
                                jazzCashNumber: formData.jazzCashNumber,
                                easypaisaNumber: formData.easypaisaNumber
                            }
                        })
                    });
                }
                
                setSuccessMessage('Profile updated successfully!');
                setSelectedFile(null);
            } else {
                setValidationError(data.error || 'Profile update failed.');
            }
        } catch (error) {
            setValidationError('Update failed. Connection error.');
        } finally {
            setIsSaving(false);
        }
    };

    // Handle instant photo deletion with confirmation modal
    const handleRemoveAvatar = async () => {
        setShowConfirmModal(false);
        setValidationError(null);
        setSuccessMessage(null);
        try {
            setIsSaving(true);
            const token = localStorage.getItem('token');
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('email', formData.email);
            formDataToSend.append('removeAvatar', 'true');
            formDataToSend.append('businessDetails', JSON.stringify({
                businessName: formData.company,
                phone: formData.phone.replace(/[\s-]/g, ''),
                address: formData.address,
                city: formData.city,
                province: formData.province,
                taxId: formData.taxId
            }));

            const res = await fetch(`${getApiBaseUrl()}/api/auth/profile`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formDataToSend
            });
            const data = await res.json();
            if (data.success) {
                updateUser({
                    ...user,
                    avatar: '',
                    businessDetails: {
                        ...user?.businessDetails,
                        businessName: formData.company,
                        phone: formData.phone,
                        address: formData.address,
                        city: formData.city,
                        province: formData.province,
                        taxId: formData.taxId
                    }
                });
                setSelectedFile(null);
                setPreview(null);
                setSuccessMessage('Profile image removed successfully.');
            } else {
                setValidationError(data.error || 'Failed to remove profile image.');
            }
        } catch (error) {
            setValidationError('Failed to remove profile image. Connection error.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setValidationError(null);
        setSuccessMessage(null);
        if (file) {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                setValidationError('Invalid file type. Please select a JPG, PNG, or WEBP image.');
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                setValidationError('File too large. Maximum allowed size is 5MB.');
                return;
            }

            setSelectedFile(file);
            
            if (preview && preview.startsWith('blob:')) {
                URL.revokeObjectURL(preview);
            }
            
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleChange = (e) => {
        let { name, value } = e.target;
        if (name === 'province') {
            setFormData(prev => ({
                ...prev,
                province: value,
                city: '' 
            }));
        } else {
            if (name === 'iban') {
                value = value.toUpperCase();
            } else if (name === 'accountNumber' || name === 'jazzCashNumber' || name === 'easypaisaNumber' || name === 'sadaPayNumber' || name === 'nayaPayNumber') {
                value = value.replace(/\D/g, ''); // Numbers only
            }
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!guardAction()) return;
        setPwError(null);
        setPwSuccess(null);

        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            setPwError('Please fill in all password fields.');
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            setPwError('New password must be at least 6 characters.');
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPwError('New password and confirm password do not match.');
            return;
        }
        if (passwordForm.currentPassword === passwordForm.newPassword) {
            setPwError('New password must be different from current password.');
            return;
        }

        try {
            setChangingPassword(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${getApiBaseUrl()}/api/auth/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword
                })
            });
            const data = await res.json();
            if (data.success) {
                setPwSuccess('Password changed successfully!');
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setShowCurrentPw(false);
                setShowNewPw(false);
                setShowConfirmPw(false);
                setTimeout(() => setShowChangePassword(false), 2000);
            } else {
                setPwError(data.error || 'Failed to change password.');
            }
        } catch (error) {
            setPwError('Connection error. Please try again.');
        } finally {
            setChangingPassword(false);
        }
    };

    const handleCameraClick = () => {
        fileInputRef.current.click();
    };

    return (
        <div className={isDashboard ? 'space-y-6 pb-24' : 'pt-24 pb-24 px-4 space-y-6'}>
            <div className="w-full mx-auto">
                
                {/* Header Row */}
                <div className="flex flex-col items-center text-center gap-4 pb-8 mb-6 border-b border-[#E5E7EB]">
                    <div>
                        <h2 className="text-[36px] font-[800] text-[#0F172A] leading-tight tracking-tight">
                            {activeTab === 'settings' ? 'Account Settings & Security' : 'My Account'}
                        </h2>
                        <p className="text-[16px] text-[#64748B] mt-2 font-medium">
                            {activeTab === 'settings'
                                ? 'Manage your password, security preferences, and account controls.'
                                : 'Manage your personal information, company profile, and business details.'}
                        </p>
                    </div>

                    {/* Navigation Sub-Tabs */}
                    <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
                        <button
                            type="button"
                            onClick={() => setActiveTab('account')}
                            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                                activeTab === 'account'
                                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                                    : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            <User size={14} /> My Account
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab('settings');
                                setShowChangePassword(true);
                            }}
                            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                                activeTab === 'settings'
                                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                                    : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            <Settings size={14} /> Settings & Security
                        </button>
                    </div>

                    {!isEditing && !isReadOnlyMode ? (
                        <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-700 text-white rounded-xl font-body font-bold text-[11px] uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg select-none"
                        >
                            <Pencil size={13} strokeWidth={2.5} /> Edit Profile
                        </button>
                    ) : !isEditing && isReadOnlyMode ? null : (
                        <div className="shrink-0 flex gap-2 select-none">
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 hover:border-red-200 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl font-body font-bold text-[11px] uppercase tracking-wider transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <X size={13} strokeWidth={2.5} /> Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-8 py-3 bg-[#00A878] hover:bg-[#009166] text-white rounded-xl font-bold text-[13px] transition-all duration-300 shadow-[0_8px_24px_rgba(0,168,120,0.25)] hover:shadow-[0_12px_28px_rgba(0,168,120,0.35)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                            >
                                {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save size={16} strokeWidth={2} />}
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}
                </div>

                {activeTab === 'account' ? (
                <div className="grid lg:grid-cols-3 gap-8 items-start mt-8">
                    {/* Left Column: Visual Profile Card & Account Status */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Avatar Card */}
                        <div className="bg-white rounded-[16px] border border-[#E5E7EB] shadow-[0_8px_24px_rgba(15,23,42,0.05)] text-center relative overflow-hidden">
                            {/* Decorative banner */}
                            <div className="h-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(0,168,120,0.15),_transparent_60%)]" />
                            </div>

                            <div className="px-6 pb-8 -mt-12">
                                <div
                                    onClick={isEditing ? handleCameraClick : undefined}
                                    className={`relative inline-block select-none group mb-4 ${isEditing ? 'cursor-pointer' : ''}`}
                                >
                                    <UserAvatar
                                      user={user}
                                      name={user?.name}
                                      src={preview || undefined}
                                      size="2xl"
                                      variant="emerald"
                                      bordered
                                      className="mx-auto border-4 border-white shadow-lg"
                                      imageClassName="group-hover:scale-105 transition-transform duration-500"
                                    />
                                    {isEditing && (
                                        <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <Camera size={20} className="text-white" />
                                        </div>
                                    )}
                                    {isEditing && (
                                        <button
                                            type="button"
                                            onClick={handleCameraClick}
                                            className="absolute bottom-0 right-0 p-2 bg-emerald-600 text-white rounded-lg shadow-md hover:bg-emerald-700 transition-all border-2 border-white"
                                        >
                                            <Camera size={12} />
                                        </button>
                                    )}
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/jpeg, image/png, image/webp" className="hidden" />
                                </div>

                                {isEditing && (preview || user?.avatar) && (
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmModal(true)}
                                        className="mb-4 text-[12px] font-semibold text-rose-500 hover:text-rose-700 transition-colors select-none flex items-center gap-1.5 mx-auto bg-rose-50 px-3 py-1 rounded-full"
                                    >
                                        <Trash2 size={14} /> Remove Photo
                                    </button>
                                )}

                                <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
                                    {user?.name || 'Authorized Partner'}
                                </h3>
                                <p className="text-[14px] text-slate-500 mt-1 font-medium">{user?.businessDetails?.businessName || 'Business Profile'}</p>
                                
                                <div className="flex items-center justify-center gap-1.5 mt-4 mb-6">
                                    <span className={`flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-full ${verificationBadge.className}`}>
                                        <VerificationBadgeIcon size={14} /> {verificationBadge.label}
                                    </span>
                                </div>

                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-left space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[12px] font-semibold text-slate-500">Account Type</span>
                                        <span className="text-[13px] font-bold text-slate-900 uppercase">{user?.role}</span>
                                    </div>
                                    <div className="h-px bg-slate-200/60" />
                                    <div className="flex items-center justify-between">
                                        <span className="text-[12px] font-semibold text-slate-500">Region Hub</span>
                                        <span className="text-[13px] font-bold text-slate-900">Pakistan</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Account & Security Status Card */}
                        <div className="bg-slate-900 rounded-[16px] p-6 text-white shadow-xl relative overflow-hidden border border-slate-800">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-[#00A878]/10 blur-[50px] rounded-full pointer-events-none" />

                            <h3 className="relative z-10 text-[12px] font-bold uppercase tracking-widest mb-6 text-[#00A878]">Account Status</h3>

                            <div className="space-y-4 relative z-10">
                                <div className="flex items-center justify-between">
                                    <span className="text-[13px] font-medium text-slate-400">Verification</span>
                                    <span className={`text-[13px] font-bold flex items-center gap-1.5 ${verificationStatusClass}`}>
                                        <CheckCircle size={14} strokeWidth={2.5} /> {verificationStatusLabel}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[13px] font-medium text-slate-400">Membership</span>
                                    <span className="text-[13px] font-bold text-white">Enterprise B2B</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[13px] font-medium text-slate-400">Security</span>
                                    <span className="text-[13px] font-bold text-[#00A878]">256-bit SSL</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[13px] font-medium text-slate-400">Member Since</span>
                                    <span className="text-[13px] font-bold text-white">2026</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Editable Business details Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-[16px] border border-[#E5E7EB] p-8 shadow-[0_8px_24px_rgba(15,23,42,0.05)] space-y-8">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                
                                {validationError && (
                                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 font-semibold text-[14px] animate-in fade-in duration-200">
                                        <AlertCircle size={18} className="shrink-0" />
                                        <span>{validationError}</span>
                                    </div>
                                )}

                                {successMessage && (
                                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-600 font-body font-black text-[9px] uppercase tracking-widest leading-relaxed animate-in fade-in duration-200">
                                        <CheckCircle size={16} className="shrink-0 text-emerald-500" />
                                        <span>{successMessage}</span>
                                    </div>
                                )}

                                {/* Row 1: Full Name & Email */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 font-body font-black text-[10px] uppercase tracking-widest text-slate-400">
                                            <User size={14} className="text-emerald-500 shrink-0" /> Full Name
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none hover:border-slate-300 focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all duration-200 font-body text-slate-900 font-bold text-sm placeholder:text-slate-400 disabled:opacity-60 disabled:cursor-not-allowed ${
                                                isEditing && !formData.name.trim() ? 'border-red-300 focus:ring-red-50 focus:border-red-500' :
                                                isEditing && formData.name.trim() ? 'border-emerald-300 focus:border-emerald-500' : 'border-slate-200'
                                            }`}
                                            placeholder="Enter Full Name"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 font-body font-bold text-[11px] uppercase tracking-widest text-slate-500">
                                            <Mail size={14} className="text-emerald-500 shrink-0" /> Email Address
                                        </label>
                                        <input
                                            required
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            disabled={true}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-body text-slate-900 font-bold text-sm opacity-60 cursor-not-allowed placeholder:text-slate-400"
                                            placeholder="e.g. name@company.com"
                                        />
                                    </div>
                                </div>

                                {/* Row 2: Company Name & Phone Number */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 font-body font-bold text-[11px] uppercase tracking-widest text-slate-500">
                                            <Building size={14} className="text-emerald-500 shrink-0" /> Company Name
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            name="company"
                                            value={formData.company}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none hover:border-slate-300 focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all duration-200 font-body text-slate-900 font-bold text-sm placeholder:text-slate-400 disabled:opacity-60 disabled:cursor-not-allowed ${
                                                isEditing && !formData.company.trim() ? 'border-red-300 focus:ring-red-50 focus:border-red-500' :
                                                isEditing && formData.company.trim() ? 'border-emerald-300 focus:border-emerald-500' : 'border-slate-200'
                                            }`}
                                            placeholder="Enter Company Name"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 font-body font-bold text-[11px] uppercase tracking-widest text-slate-500">
                                            <Phone size={14} className="text-emerald-500 shrink-0" /> Phone Number
                                        </label>
                                        <input
                                            required
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handlePhoneChange}
                                            disabled={!isEditing}
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none hover:border-slate-300 focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all duration-200 font-body text-slate-900 font-bold text-sm placeholder:text-slate-400 disabled:opacity-60 disabled:cursor-not-allowed ${
                                                formData.phone && !validatePhone(formData.phone) ? 'border-red-300 focus:ring-red-50 focus:border-red-500' : 
                                                formData.phone && validatePhone(formData.phone) ? 'border-emerald-300 focus:border-emerald-500' : 'border-slate-200'
                                            }`}
                                            placeholder="e.g. +92 300 1234567"
                                        />
                                        {formData.phone && !validatePhone(formData.phone) && (
                                            <p className="text-[9px] font-body font-bold text-red-500 uppercase tracking-wider leading-none">
                                                Enter valid Pakistan mobile number
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Row 3: Province & City (Dependent Fields) */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 font-body font-bold text-[11px] uppercase tracking-widest text-slate-500">
                                            <MapPin size={14} className="text-emerald-500 shrink-0" /> Province / State
                                        </label>
                                        <select
                                            name="province"
                                            value={formData.province}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none hover:border-slate-300 focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all duration-200 font-body text-slate-900 font-bold text-sm disabled:opacity-60 disabled:cursor-not-allowed appearance-none cursor-pointer ${
                                                isEditing && !formData.province ? 'border-red-300 focus:ring-red-50 focus:border-red-500' : 
                                                isEditing && formData.province ? 'border-emerald-300 focus:border-emerald-500' : 'border-slate-200'
                                            }`}
                                        >
                                            <option value="">Select Province</option>
                                            {PAKISTAN_PROVINCES.map(prov => (
                                                <option key={prov} value={prov}>{prov}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 font-body font-bold text-[11px] uppercase tracking-widest text-slate-500">
                                            <Building2 size={14} className="text-emerald-500 shrink-0" /> City
                                        </label>
                                        <select
                                            name="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            disabled={!isEditing || !formData.province}
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none hover:border-slate-300 focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all duration-200 font-body text-slate-900 font-bold text-sm disabled:opacity-60 disabled:cursor-not-allowed appearance-none cursor-pointer ${
                                                isEditing && !formData.city ? 'border-red-300 focus:ring-red-50 focus:border-red-500' : 
                                                isEditing && formData.city ? 'border-emerald-300 focus:border-emerald-500' : 'border-slate-200'
                                            }`}
                                        >
                                            <option value="">
                                                {!formData.province ? 'Select Province First' : 'Select City'}
                                            </option>
                                            {availableCities.map(city => (
                                                <option key={city} value={city}>{city}</option>
                                            ))}
                                        </select>
                                        {isEditing && formData.province && !formData.city && (
                                            <p className="text-[9px] font-body font-bold text-red-500 uppercase tracking-wider leading-none">
                                                Please select a valid city for the selected province or region.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Row 4: NTN (Tax ID) */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 font-body font-black text-[10px] uppercase tracking-widest text-slate-400">
                                        <FileText size={14} className="text-emerald-500 shrink-0" /> NTN (Tax ID / Optional)
                                    </label>
                                    <input
                                        type="text"
                                        name="taxId"
                                        value={formData.taxId}
                                        onChange={handleTaxChange}
                                        disabled={!isEditing}
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none hover:border-slate-300 focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all duration-200 font-body text-slate-900 font-bold text-sm placeholder:text-slate-400 disabled:opacity-60 disabled:cursor-not-allowed ${
                                            formData.taxId && !validateTaxId(formData.taxId) ? 'border-red-300 focus:ring-red-50 focus:border-red-500' : 
                                            formData.taxId && validateTaxId(formData.taxId) ? 'border-emerald-300 focus:border-emerald-500' : 'border-slate-200'
                                        }`}
                                        placeholder="7-9 digits NTN number"
                                    />
                                    {formData.taxId && !validateTaxId(formData.taxId) && (
                                        <p className="text-[9px] font-body font-bold text-red-500 uppercase tracking-wider leading-none">
                                            NTN must be exactly 7-9 numeric digits
                                        </p>
                                    )}
                                </div>

                                {showVerificationSection && (
                                    <div className="space-y-4 pt-2 border-t border-slate-100">
                                        <div>
                                            <h3 className="font-heading text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                                                <ShieldCheck size={18} className="text-emerald-500" />
                                                Business Verification
                                            </h3>
                                            <p className="text-[13px] text-slate-500 mt-1.5 font-medium leading-relaxed">
                                                You can save your NTN number here anytime. Upload your NTN document, business license, and registration certificate when you are ready to submit your verification request.
                                            </p>
                                        </div>
                                        <VerificationStatusBanner
                                            user={user}
                                            notSubmittedDescription="Complete business verification to unlock full platform access. Submit your documents when ready."
                                            compact
                                        />
                                    </div>
                                )}

                                {/* Row 5: Business Address (multi-line textarea) */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 font-body font-black text-[10px] uppercase tracking-widest text-slate-400">
                                        <MapPin size={14} className="text-emerald-500 shrink-0" /> Business Address
                                    </label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        rows="3"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none hover:border-slate-300 focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all duration-200 font-body text-slate-900 font-bold text-sm placeholder:text-slate-400 disabled:opacity-60 disabled:cursor-not-allowed resize-none"
                                        placeholder="Enter corporate office, warehouse, or factory location details"
                                    />
                                </div>



                                {isEditing && (
                                    <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-3">
                                        <div className="p-1.5 bg-amber-600 text-white rounded">
                                            <AlertCircle size={14} className="stroke-[3]" />
                                        </div>
                                        <div>
                                            <h4 className="font-body font-black text-[9px] uppercase tracking-widest text-amber-900 mb-0.5">Profile Modification Mode</h4>
                                            <p className="font-body text-amber-800/80 text-xs font-medium">Modifying your verified Business Name, Address, or Mobile Number will automatically return your account verification status to Pending for Admin re-approval.</p>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
                ) : (
                /* Settings & Security Section */
                <div className="mt-8 space-y-6">
                    <div className="flex flex-col items-center text-center gap-3 mb-8">
                        <div>
                            <h2 className="text-[24px] font-[800] text-[#0F172A] leading-tight tracking-tight">Security Settings</h2>
                            <p className="text-[15px] text-[#64748B] mt-1 font-medium">Manage your password and account security preferences.</p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 text-[12px] font-bold mt-1">
                            <ShieldCheck size={14} /> High Security Active
                        </div>
                    </div>

                    {user?.authProvider !== 'google' && (
                        <div className="bg-white rounded-[16px] border border-[#E5E7EB] shadow-[0_8px_24px_rgba(15,23,42,0.05)] overflow-hidden">
                            {/* Toggle Header */}
                            <button
                                type="button"
                                onClick={() => { setShowChangePassword(!showChangePassword); setPwError(null); setPwSuccess(null); }}
                                className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors duration-200 select-none group"
                            >
                                <div className="flex items-start md:items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-600 shadow-sm group-hover:bg-[#00A878] group-hover:text-white group-hover:border-[#00A878] transition-colors duration-200 shrink-0">
                                        <KeyRound size={20} strokeWidth={2} />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-[16px] font-bold text-slate-900 tracking-tight">Change Password</h3>
                                        <p className="text-[13px] text-slate-500 font-medium mt-0.5">Regularly updating your password helps secure your enterprise data.</p>
                                        <p className="text-[11px] text-slate-400 font-medium mt-1 flex items-center gap-1.5">
                                            <CheckCircle size={12} className="text-[#00A878]" /> Last updated: Recently
                                        </p>
                                    </div>
                                </div>
                                <div className={`w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 transition-all duration-300 ${showChangePassword ? 'rotate-180 bg-slate-100' : 'bg-white'}`}>
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </div>
                            </button>

                            {/* Expandable Password Form */}
                            {showChangePassword && (
                                <div className="px-7 pb-7 pt-1 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <form onSubmit={handleChangePassword} className="space-y-5 max-w-xl">
                                        {pwError && (
                                            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-red-600 font-body font-black text-[9px] uppercase tracking-widest animate-in fade-in duration-200">
                                                <AlertCircle size={14} className="shrink-0" />
                                                <span>{pwError}</span>
                                            </div>
                                        )}
                                        {pwSuccess && (
                                            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-600 font-body font-black text-[9px] uppercase tracking-widest animate-in fade-in duration-200">
                                                <CheckCircle size={14} className="shrink-0" />
                                                <span>{pwSuccess}</span>
                                            </div>
                                        )}

                                        {/* Current Password */}
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 font-body font-black text-[10px] uppercase tracking-widest text-slate-400">
                                                <KeyRound size={13} className="text-slate-500 shrink-0" /> Current Password
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showCurrentPw ? 'text' : 'password'}
                                                    value={passwordForm.currentPassword}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                                    className="w-full px-4 py-3 pr-12 bg-slate-50 border border-slate-200 rounded-xl outline-none hover:border-slate-300 focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all duration-200 font-body text-slate-900 font-bold text-sm placeholder:text-slate-400"
                                                    placeholder="Enter current password"
                                                />
                                                <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1">
                                                    {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* New Password */}
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 font-body font-black text-[10px] uppercase tracking-widest text-slate-400">
                                                <Lock size={13} className="text-emerald-500 shrink-0" /> New Password
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showNewPw ? 'text' : 'password'}
                                                    value={passwordForm.newPassword}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                    className={`w-full px-4 py-3 pr-12 bg-slate-50 border rounded-xl outline-none hover:border-slate-300 focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all duration-200 font-body text-slate-900 font-bold text-sm placeholder:text-slate-400 ${
                                                        passwordForm.newPassword && passwordForm.newPassword.length < 6 ? 'border-red-300' :
                                                        passwordForm.newPassword && passwordForm.newPassword.length >= 6 ? 'border-emerald-300' : 'border-slate-200'
                                                    }`}
                                                    placeholder="Enter new password (min 6 chars)"
                                                />
                                                <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1">
                                                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                            {passwordForm.newPassword && passwordForm.newPassword.length < 6 && (
                                                <p className="text-[9px] font-body font-bold text-red-500 uppercase tracking-wider">Minimum 6 characters required</p>
                                            )}
                                        </div>

                                        {/* Confirm New Password */}
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 font-body font-black text-[10px] uppercase tracking-widest text-slate-400">
                                                <Lock size={13} className="text-emerald-500 shrink-0" /> Confirm New Password
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showConfirmPw ? 'text' : 'password'}
                                                    value={passwordForm.confirmPassword}
                                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                    className={`w-full px-4 py-3 pr-12 bg-slate-50 border rounded-xl outline-none hover:border-slate-300 focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all duration-200 font-body text-slate-900 font-bold text-sm placeholder:text-slate-400 ${
                                                        passwordForm.confirmPassword && passwordForm.confirmPassword !== passwordForm.newPassword ? 'border-red-300' :
                                                        passwordForm.confirmPassword && passwordForm.confirmPassword === passwordForm.newPassword ? 'border-emerald-300' : 'border-slate-200'
                                                    }`}
                                                    placeholder="Re-enter new password"
                                                />
                                                <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1">
                                                    {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                            {passwordForm.confirmPassword && passwordForm.confirmPassword !== passwordForm.newPassword && (
                                                <p className="text-[9px] font-body font-bold text-red-500 uppercase tracking-wider">Passwords do not match</p>
                                            )}
                                        </div>

                                        {/* Submit Button */}
                                        <div className="flex items-center gap-3 pt-2">
                                            <button
                                                type="submit"
                                                disabled={changingPassword}
                                                className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl font-body font-bold text-[11px] uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {changingPassword ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Lock size={13} strokeWidth={2.5} />}
                                                {changingPassword ? 'Updating...' : 'Update Password'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setShowChangePassword(false); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); setPwError(null); setPwSuccess(null); }}
                                                className="px-5 py-3 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl font-body font-bold text-[11px] uppercase tracking-wider transition-all"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                )}
            </div>

            {/* Redesigned Premium Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-100 max-w-[420px] w-full p-8 shadow-2xl text-center select-none animate-in fade-in zoom-in-95 duration-200">
                        {/* Red Trash Icon Badge */}
                        <div className="w-14 h-14 bg-red-50 text-red-500 border border-red-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
                            <Trash2 size={26} />
                        </div>
                        
                        {/* Text Content */}
                        <h3 className="font-heading text-xl font-black text-slate-900 uppercase italic tracking-tight mb-2.5">
                            Remove Profile Photo?
                        </h3>
                        <p className="font-body text-slate-500 text-[13px] font-medium leading-relaxed mb-8 max-w-[320px] mx-auto">
                            Are you sure you want to remove your profile photo? This action cannot be undone.
                        </p>
                        
                        {/* Action Buttons Row */}
                        <div className="flex gap-3 justify-center">
                            <button
                                type="button"
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 px-5 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-2xl font-body font-black text-[10px] uppercase tracking-widest transition-all select-none"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleRemoveAvatar}
                                className="flex-1 px-5 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-body font-black text-[10px] uppercase tracking-widest transition-all shadow-md shadow-red-500/10 select-none"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default function UserProfile(props) {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
        }>
            <UserProfileInner {...props} />
        </Suspense>
    );
}
