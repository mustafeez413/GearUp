"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { MapPin, Phone, Building, ShieldCheck, ArrowRight } from 'lucide-react';

const WholesalerOnboardingPage = () => {
    const [formData, setFormData] = useState({
        businessName: '',
        city: '',
        phone: '',
        ntn: ''
    });
    const [error, setError] = useState('');
    const { user, updateUser } = useAuth();
    const router = useRouter();

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!formData.businessName || !formData.city || !formData.phone) {
            setError('Strategic parameters incomplete. Please fill in all required fields.');
            return;
        }

        // Strict Pakistan phone validation
        const plainPhone = formData.phone.replace(/[\s-]/g, '');
        if (!/^((\+92)|(0092))?3[0-9]{9}$|^03[0-9]{9}$/.test(plainPhone)) {
            setError('Please enter a valid Pakistan mobile number starting with 03 or +923 (e.g. 03001234567).');
            // Focus on phone input
            const phoneField = document.getElementById('phone');
            if (phoneField) phoneField.focus();
            return;
        }

        const updatedUser = {
            ...user,
            verified: true,
            wholesalerInfo: {
                businessName: formData.businessName,
                city: formData.city,
                phone: plainPhone,
                ntn: formData.ntn || null
            }
        };

        updateUser(updatedUser);
        router.replace('/wholesaler/dashboard');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Block alphabets inside phone in real-time
        if (name === 'phone' && value !== '' && !/^\+?[\d\s-]*$/.test(value)) {
            return;
        }

        setFormData({
            ...formData,
            [name]: value
        });
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center py-20 px-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px]"></div>
            </div>

            <div className="max-w-xl w-full relative z-10">
                <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden">
                    <div className="p-12">
                        <div className="text-center mb-10">
                            <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-600/20 mx-auto mb-6">
                                <ShieldCheck size={32} />
                            </div>
                            <h1 className="font-heading text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-3">
                                Entity Registry
                            </h1>
                            <p className="font-body text-slate-500 font-medium text-sm tracking-tight uppercase tracking-widest">
                                Complete your procurement profile
                            </p>
                        </div>

                        {error && (
                            <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-in fade-in duration-200">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mt-1.5 shrink-0"></div>
                                <p className="font-body text-xs font-bold text-red-600 leading-relaxed">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="businessName" className="flex items-center gap-3 font-body font-black text-[10px] uppercase tracking-widest text-slate-400 ml-4">
                                    <Building size={14} className="text-emerald-600" /> Legal Entity Name
                                </label>
                                <input
                                    type="text"
                                    id="businessName"
                                    name="businessName"
                                    value={formData.businessName}
                                    onChange={handleChange}
                                    placeholder="e.g. Acme Procurement Group"
                                    className="w-full px-8 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-emerald-50 focus:border-emerald-500 transition-all font-body text-slate-900 font-bold placeholder-slate-300"
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="city" className="flex items-center gap-3 font-body font-black text-[10px] uppercase tracking-widest text-slate-400 ml-4">
                                        <MapPin size={14} className="text-emerald-600" /> Operational Hub
                                    </label>
                                    <input
                                        type="text"
                                        id="city"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        placeholder="City"
                                        className="w-full px-8 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-emerald-50 focus:border-emerald-500 transition-all font-body text-slate-900 font-bold placeholder-slate-300"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="phone" className="flex items-center gap-3 font-body font-black text-[10px] uppercase tracking-widest text-slate-400 ml-4">
                                        <Phone size={14} className="text-emerald-600" /> Comms Link
                                    </label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="03001234567"
                                        className={`w-full px-8 py-4 bg-slate-50 border rounded-2xl outline-none focus:ring-8 focus:ring-emerald-50 focus:border-emerald-500 transition-all font-body text-slate-900 font-bold placeholder-slate-300 ${
                                            error && error.includes('phone') ? 'border-red-300 ring-4 ring-red-50 focus:border-red-500' : 'border-slate-100'
                                        }`}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="ntn" className="flex items-center gap-3 font-body font-black text-[10px] uppercase tracking-widest text-slate-400 ml-4">
                                    Fiscal ID / NTN
                                </label>
                                <input
                                    type="text"
                                    id="ntn"
                                    name="ntn"
                                    value={formData.ntn}
                                    onChange={handleChange}
                                    placeholder="Optional for low-volume accounts"
                                    className="w-full px-8 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-emerald-50 focus:border-emerald-500 transition-all font-body text-slate-900 font-bold placeholder-slate-300"
                                />
                            </div>

                            <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                    <p className="font-body font-black text-[10px] uppercase tracking-widest text-emerald-900">Immediate Authorization Grant</p>
                                </div>
                                <p className="font-body text-emerald-800/70 text-[10px] font-bold uppercase tracking-tight leading-relaxed">
                                    Wholesalers bypass standard document audit. Registry completion grants immediate marketplace access.
                                </p>
                            </div>

                            <button
                                type="submit"
                                className="w-full flex items-center justify-center gap-3 px-8 py-6 bg-emerald-600 text-white rounded-[2rem] font-body font-black text-xs uppercase tracking-[0.2em] italic hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-500/30 group"
                            >
                                Activate Profile <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WholesalerOnboardingPage;
