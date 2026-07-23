"use client";

import { getApiBaseUrl } from '@/lib/api';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    CreditCard,
    CheckCircle2,
    XCircle,
    Building2,
    Wallet,
    Save,
    Loader2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const PAKISTAN_BANKS = [
    'Habib Bank Limited (HBL)',
    'Bank Alfalah',
    'Meezan Bank',
    'Faysal Bank',
    'Allied Bank',
    'United Bank Limited (UBL)',
    'MCB Bank',
    'Standard Chartered Bank',
    'Bank of Punjab',
    'Askari Bank',
];

const inputClass =
    'w-full mt-1.5 px-4 py-3 bg-[#FAFCFD] border border-[#E2E8F0] rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#0F172A] focus:ring-2 focus:ring-slate-900/5 transition-all';

const PayoutSettingsPage = () => {
    const { user } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Form fields
    const [method, setMethod] = useState(''); // 'Bank Transfer', 'JazzCash', 'EasyPaisa'
    const [bankName, setBankName] = useState('');
    const [accountTitle, setAccountTitle] = useState('');
    const [iban, setIban] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [walletNumber, setWalletNumber] = useState('');
    const [isConfigured, setIsConfigured] = useState(false);

    useEffect(() => {
        const fetchPayoutSettings = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${getApiBaseUrl()}/api/auth/payout-settings`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success && data.data) {
                    const settings = data.data;
                    setIsConfigured(settings.isConfigured || false);
                    setMethod(settings.method || '');
                    setBankName(settings.bankName || '');
                    setAccountTitle(settings.accountTitle || '');
                    setIban(settings.iban || '');
                    setAccountNumber(settings.accountNumber || '');
                    setWalletNumber(settings.walletNumber || '');
                }
            } catch (err) {
                console.error('Failed to fetch payout settings:', err);
                setError('Failed to load payout settings.');
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchPayoutSettings();
        }
    }, [user]);

    const handleSave = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
        setSubmitting(true);

        // Validation
        if (!method) {
            setError('Please select a payout method.');
            setSubmitting(false);
            return;
        }

        if (method === 'Bank Transfer') {
            if (!bankName || !accountTitle || !iban || !accountNumber) {
                setError('All bank transfer fields are required.');
                setSubmitting(false);
                return;
            }
        } else {
            if (!accountTitle || !walletNumber) {
                setError('Account holder name and mobile number are required.');
                setSubmitting(false);
                return;
            }
            // Pakistan phone validation
            const plainNumber = walletNumber.replace(/[\s-]/g, '');
            if (!/^(03\d{9})$|^(\+923\d{9})$/.test(plainNumber)) {
                setError('Please enter a valid Pakistan mobile number starting with 03 or +923 (e.g. 03001234567).');
                setSubmitting(false);
                return;
            }
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${getApiBaseUrl()}/api/auth/payout-settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    method,
                    bankName: method === 'Bank Transfer' ? bankName : '',
                    accountTitle,
                    iban: method === 'Bank Transfer' ? iban : '',
                    accountNumber: method === 'Bank Transfer' ? accountNumber : '',
                    walletNumber: (method === 'JazzCash' || method === 'EasyPaisa') ? walletNumber : ''
                })
            });

            const data = await res.json();
            if (data.success) {
                setSuccessMessage('Payout settings saved successfully.');
                setIsConfigured(true);
            } else {
                setError(data.error || 'Failed to save payout settings.');
            }
        } catch (err) {
            console.error('Error saving payout settings:', err);
            setError('An error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-8 w-full animate-in fade-in duration-300 pb-10">
                <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg mb-2"></div>
                <div className="h-4 w-72 bg-slate-200 animate-pulse rounded-lg mb-8"></div>
                <div className="bg-white rounded-3xl p-6 border border-slate-200 h-96 w-full animate-pulse"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 w-full animate-in fade-in duration-500 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 border-b border-slate-100 pb-5">
                <div>
                    <h1 className="font-heading text-3xl font-black text-[#0F172A] tracking-tight">Payout Settings</h1>
                    <p className="text-slate-500 font-medium text-sm mt-1 max-w-xl leading-relaxed">
                        Configure how you wish to receive payments from GearUp.
                    </p>
                </div>
                <div>
                    <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase border flex items-center gap-2 ${
                        isConfigured
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : 'text-amber-700 bg-amber-50 border-amber-200'
                    }`}>
                        <span className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                        Status: {isConfigured ? 'Configured' : 'Not Configured'}
                    </div>
                </div>
            </div>

            <div className="max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 md:p-8 border-b border-slate-100 bg-[#FAFCFD]">
                    <h3 className="font-heading text-lg font-black text-[#0F172A] tracking-tight flex items-center gap-2">
                        <CreditCard className="text-[#00A878]" size={20} />
                        Payout Information
                    </h3>
                    <p className="text-slate-500 text-xs mt-1">
                        Select a preferred method and provide your transfer details. Platform payouts are executed manually by administrators.
                    </p>
                </div>

                <form onSubmit={handleSave} className="p-6 md:p-8 space-y-6">
                    {error && (
                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 font-sans font-bold text-xs uppercase tracking-wider">
                            <XCircle size={16} className="shrink-0" /> {error}
                        </div>
                    )}

                    {successMessage && (
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-700 font-sans font-bold text-xs uppercase tracking-wider">
                            <CheckCircle2 size={16} className="shrink-0" /> {successMessage}
                        </div>
                    )}

                    {/* Method Selector */}
                    <div className="space-y-3">
                        <label className="font-body text-[10px] font-black uppercase tracking-widest text-slate-500">
                            Preferred Payout Method <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex flex-col sm:flex-row gap-4 mt-2">
                            {[
                                { id: 'Bank Transfer', label: 'Bank Transfer', icon: Building2 },
                                { id: 'JazzCash', label: 'JazzCash', icon: Wallet },
                                { id: 'EasyPaisa', label: 'EasyPaisa', icon: Wallet }
                            ].map((opt) => {
                                const Icon = opt.icon;
                                const isSelected = method === opt.id;
                                return (
                                    <label
                                        key={opt.id}
                                        className={`flex-1 flex items-center gap-3 px-4 py-3.5 rounded-xl border cursor-pointer transition-all ${
                                            isSelected
                                                ? 'border-[#00A878] bg-emerald-50/20 ring-2 ring-[#00A878]/10'
                                                : 'border-[#E2E8F0] bg-[#FAFCFD] hover:border-slate-300'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="payoutMethod"
                                            value={opt.id}
                                            checked={isSelected}
                                            onChange={(e) => setMethod(e.target.value)}
                                            className="accent-[#00A878] h-4 w-4"
                                        />
                                        <Icon size={16} className={isSelected ? 'text-[#00A878]' : 'text-slate-400'} />
                                        <span className="text-sm font-bold text-slate-800">{opt.label}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bank Transfer Fields */}
                    {method === 'Bank Transfer' && (
                        <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in duration-300">
                            <div>
                                <label className="font-body text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    Bank Name <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    required
                                    value={bankName}
                                    onChange={(e) => setBankName(e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="">Select Bank</option>
                                    {PAKISTAN_BANKS.map((bank) => (
                                        <option key={bank} value={bank}>{bank}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="font-body text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    Account Title <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={accountTitle}
                                    onChange={(e) => setAccountTitle(e.target.value)}
                                    placeholder="Account Holder's Name"
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className="font-body text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    IBAN / Account Number <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={iban}
                                    onChange={(e) => setIban(e.target.value.toUpperCase())}
                                    placeholder="e.g. PK00MEZN0000000000000000"
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className="font-body text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    Account Number <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                                    placeholder="e.g. 10 to 20 digits"
                                    className={inputClass}
                                />
                            </div>
                        </div>
                    )}

                    {/* JazzCash / EasyPaisa Fields */}
                    {(method === 'JazzCash' || method === 'EasyPaisa') && (
                        <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in duration-300">
                            <div>
                                <label className="font-body text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    Account Holder Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={accountTitle}
                                    onChange={(e) => setAccountTitle(e.target.value)}
                                    placeholder="Account Holder Name"
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className="font-body text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    Mobile Number <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={walletNumber}
                                    onChange={(e) => setWalletNumber(e.target.value.replace(/[^\d+-]/g, ''))}
                                    placeholder="e.g. 03001234567 or +923001234567"
                                    className={inputClass}
                                />
                            </div>
                        </div>
                    )}

                    {/* Current Status and Save Button */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-xs font-semibold text-slate-500 uppercase">
                            Current Status: <span className={isConfigured ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>{isConfigured ? 'Configured' : 'Not Configured'}</span>
                        </div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex items-center gap-2 bg-[#00A878] hover:bg-[#0DBB85] disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-[0_4px_12px_-4px_rgba(0,200,117,0.4)] outline-none cursor-pointer"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" /> Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={14} /> Save Payout Settings
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PayoutSettingsPage;
