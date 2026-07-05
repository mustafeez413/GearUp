"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { getApiBaseUrl } from '@/lib/api';
import PublicLayout from '../../components/shared/PublicLayout';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageShell from '@/components/dashboard/PageShell';
import PageHeader from '@/components/dashboard/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { Mail, Phone, MapPin, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

function getProfileContactFields(user) {
    if (!user) {
        return { name: '', email: '', company: '' };
    }

    return {
        name: user.name || '',
        email: user.email || '',
        company: user.businessDetails?.businessName || '',
    };
}

const Contact = () => {
    const { user, isAuthenticated } = useAuth();
    const isManufacturerDashboard = user?.role === 'manufacturer';
    const profileContact = useMemo(() => getProfileContactFields(user), [user]);
    const hasProfileCompany = !!profileContact.company.trim();
    const useSessionIdentity = isAuthenticated && !!user;
    const readOnlyFieldClass =
        'bg-[#F1F5F9] text-[#475569] cursor-not-allowed border-transparent focus:border-transparent focus:ring-0';

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        company: '',
        message: '',
        type: 'general'
    });
    const [status, setStatus] = useState({ type: null, message: '' }); // 'success' | 'error' | null
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        if (!user) return;
        const nextProfile = getProfileContactFields(user);
        setFormData((prev) => ({
            ...prev,
            name: nextProfile.name,
            email: nextProfile.email,
            company: nextProfile.company || prev.company,
        }));
    }, [user]);

    const inquiryOptions = [
        { value: 'general', label: 'General Inquiry' },
        { value: 'verification', label: 'Account Verification / Support' },
        { value: 'sales', label: 'Sales & Partnership' },
        { value: 'support', label: 'Technical Support / Bug Report' },
        { value: 'advertising', label: 'Advertising & Sponsorships' },
        { value: 'other', label: 'Other' }
    ];

    const isGibberish = (text) => {
        // Prevent 4 or more identical consecutive characters (e.g. 'aaaa')
        if (/(.)\1{3,}/.test(text)) return true;
        // Prevent 6 or more consecutive consonants (blocks keyboard mashing like 'cvsqkdmc')
        if (/[bcdfghjklmnpqrstvwxz]{6,}/i.test(text)) return true;
        // Prevent single words longer than 30 characters
        if (/[^\s]{30,}/.test(text)) return true;
        return false;
    };

    const isSpam = (text) => {
        if (/(https?:\/\/|www\.)/i.test(text)) return true; // URLs
        if (/<[^>]*>/i.test(text)) return true; // HTML tags
        if (/\b(crypto|bitcoin|usdt|eth|wallet|seo services)\b/i.test(text)) return true; // Spam keywords
        return false;
    };



    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: null, message: '' });

        const submissionIdentity = useSessionIdentity
            ? {
                name: profileContact.name,
                email: profileContact.email,
                company: hasProfileCompany ? profileContact.company : formData.company,
            }
            : {
                name: formData.name,
                email: formData.email,
                company: formData.company,
            };

        // Strict validation rules
        let newErrors = {};

        // Name Validation
        if (!submissionIdentity.name.trim()) {
            newErrors.name = 'Full Name is required.';
        } else if (submissionIdentity.name.trim().length < 2) {
            newErrors.name = 'Name must be at least 2 characters.';
        } else if (!/^[A-Za-z\s\-]+$/.test(submissionIdentity.name)) {
            newErrors.name = 'Name can only contain letters, spaces, and hyphens.';
        } else if (isGibberish(submissionIdentity.name)) {
            newErrors.name = 'Please enter a valid real name.';
        }

        // Email Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!submissionIdentity.email.trim()) {
            newErrors.email = 'Email Address is required.';
        } else if (!emailRegex.test(submissionIdentity.email)) {
            newErrors.email = 'Please enter a valid email address.';
        }

        // Company Name Validation
        if (!submissionIdentity.company.trim()) {
            newErrors.company = 'Company Name is required.';
        } else if (submissionIdentity.company.trim().length < 2) {
            newErrors.company = 'Company name must be at least 2 characters.';
        } else if (submissionIdentity.company.trim().length > 80) {
            newErrors.company = 'Company name cannot exceed 80 characters.';
        } else if (!/^[A-Za-z0-9\s&.,'\-()]+$/.test(submissionIdentity.company.trim())) {
            newErrors.company = 'Company name contains invalid characters.';
        } else if (isGibberish(submissionIdentity.company)) {
            newErrors.company = 'Please enter a valid company name.';
        } else if (isSpam(submissionIdentity.company)) {
            newErrors.company = 'Company name contains blocked content (URLs or spam keywords).';
        }

        // Message Validation
        if (!formData.message.trim()) {
            newErrors.message = 'Message is required.';
        } else if (formData.message.trim().length < 10) {
            newErrors.message = 'Message must be at least 10 characters long.';
        } else if (formData.message.length > 500) {
            newErrors.message = 'Message cannot exceed 500 characters.';
        } else if (isGibberish(formData.message)) {
            newErrors.message = 'Please enter a valid message (keyboard mashing detected).';
        } else if (isSpam(formData.message)) {
            newErrors.message = 'Message contains blocked content (URLs or spam keywords).';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setStatus({ type: 'error', message: 'Please fix the errors below.' });
            setLoading(false);
            return;
        }

        setErrors({});

        const payload = {
            name: submissionIdentity.name.trim(),
            email: submissionIdentity.email.trim(),
            company: submissionIdentity.company.trim(),
            message: formData.message.trim(),
            type: formData.type,
        };

        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            const response = await fetch(`${getApiBaseUrl()}/api/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(payload),
            });

            let data = null;
            try {
                data = await response.json();
            } catch {
                data = null;
            }

            if (response.ok && data?.success) {
                setStatus({
                    type: 'success',
                    message: data.message || 'Thank you! Your message has been sent. We will respond soon.',
                });
                setFormData({
                    ...getProfileContactFields(user),
                    message: '',
                    type: 'general',
                });
            } else {
                const errMsg = data?.error || 'We could not send your message. Please try again or email us directly.';
                setStatus({ type: 'error', message: errMsg });
            }
        } catch {
            setStatus({
                type: 'error',
                message: 'Network error. Check your connection or try again later.',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (useSessionIdentity && (name === 'name' || name === 'email')) {
            return;
        }
        if (useSessionIdentity && name === 'company' && hasProfileCompany) {
            return;
        }

        setFormData({
            ...formData,
            [name]: value
        });
        if (errors[name]) {
            setErrors({ ...errors, [name]: null });
        }
    };

    const contactInfoItems = [
        {
            icon: Mail,
            label: 'Email',
            value: 'admin@gearup.com',
            href: 'mailto:admin@gearup.com',
            color: 'text-emerald-600',
            bg: 'bg-emerald-50'
        },
        {
            icon: Phone,
            label: 'Phone',
            value: '03365137542',
            href: 'tel:+923365137542',
            color: 'text-blue-600',
            bg: 'bg-blue-50'
        },
        {
            icon: MapPin,
            label: 'Offices',
            value: 'Rawalpindi',
            href: null,
            color: 'text-purple-600',
            bg: 'bg-purple-50'
        },
    ];

    const formSection = (
        <div className="grid lg:grid-cols-2 gap-10 items-start">
            {/* Left — Contact Info Premium Card */}
            <div className="relative overflow-hidden rounded-[24px] bg-[#0B1121] text-white p-8 md:p-10 shadow-2xl border border-white/10">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-gradient-to-br from-[#00A878]/30 to-[#00A878]/0 blur-3xl" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/0 blur-3xl" />

                <div className="relative z-10">
                    <div>
                        <h2 className="text-[32px] font-[800] leading-tight tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            Let's Build Something Great
                        </h2>
                        <p className="text-[16px] text-slate-400 font-medium leading-relaxed mb-8">
                            Big opportunities start with the right connections. Let's build, trade, and grow together.
                        </p>
                    </div>



                    {/* Contact Items */}
                    <div className="space-y-4 mb-10">
                        {contactInfoItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <div key={item.label} className="group flex items-center gap-5 p-4 bg-white/5 border border-white/10 rounded-[16px] hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer backdrop-blur-md">
                                    <div className="w-12 h-12 bg-white/10 rounded-[12px] flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-[#00A878]/20 transition-all duration-300">
                                        <Icon className="text-white group-hover:text-[#00A878] transition-colors" size={22} strokeWidth={2} />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                                        {item.href ? (
                                            <a href={item.href} className="font-bold text-[16px] text-white hover:text-[#00A878] transition-colors">
                                                {item.value}
                                            </a>
                                        ) : (
                                            <p className="font-bold text-[16px] text-white">{item.value}</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>


                </div>
            </div>

            {/* Right — Contact Form Premium Card */}
            <div id="gearup-contact-form" className="bg-white/80 backdrop-blur-xl rounded-[24px] border border-white/40 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-8 md:p-10 relative scroll-mt-28">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00A878] to-emerald-400 rounded-t-[24px]" />

                {status.type === 'success' && (
                    <div className="mb-8 p-4 bg-[#00A878]/10 border border-[#00A878]/20 rounded-2xl flex items-start gap-3 animate-in fade-in zoom-in duration-300">
                        <CheckCircle className="w-5 h-5 text-[#00A878] flex-shrink-0 mt-0.5" />
                        <p className="text-[15px] text-[#00A878] font-bold">{status.message}</p>
                    </div>
                )}
                {status.type === 'error' && (
                    <div className="mb-8 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 animate-in fade-in zoom-in duration-300">
                        <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                        <p className="text-[15px] text-rose-600 font-bold">{status.message}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                    <div>
                        <label htmlFor="type" className="block text-[11px] font-bold uppercase tracking-widest text-[#64748B] mb-2">
                            Inquiry Type
                        </label>
                        <div className="relative">
                            <div
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className={`w-full px-5 py-4 bg-[#F8FAFC] border-2 rounded-[16px] flex items-center justify-between cursor-pointer transition-all duration-300 ${isDropdownOpen ? 'border-[#00A878] bg-white ring-4 ring-[#00A878]/10' : 'border-transparent hover:bg-slate-100 focus:bg-white focus:border-[#00A878]'}`}
                            >
                                <span className="text-[#0F172A] font-semibold text-[15px]">
                                    {inquiryOptions.find(opt => opt.value === formData.type)?.label || 'Select...'}
                                </span>
                                <div className={`text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}>
                                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </div>
                            </div>

                            {/* Invisible overlay to close dropdown when clicking outside */}
                            {isDropdownOpen && (
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setIsDropdownOpen(false)}
                                />
                            )}

                            {/* Dropdown Menu */}
                            <div className={`absolute top-full left-0 right-0 mt-2 bg-white rounded-[16px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden z-50 transition-all duration-200 origin-top ${isDropdownOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'}`}>
                                <div className="p-2 space-y-1">
                                    {inquiryOptions.map((option) => (
                                        <div
                                            key={option.value}
                                            onClick={() => {
                                                setFormData({ ...formData, type: option.value });
                                                setIsDropdownOpen(false);
                                            }}
                                            className={`px-4 py-3 rounded-xl cursor-pointer font-semibold text-[14px] transition-all duration-200 ${formData.type === option.value ? 'bg-[#00A878]/10 text-[#00A878]' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                                        >
                                            {option.label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="name" className="block text-[11px] font-bold uppercase tracking-widest text-[#64748B] mb-2">
                                Full Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                readOnly={useSessionIdentity}
                                required
                                className={`w-full px-5 py-4 bg-[#F8FAFC] border-2 rounded-[16px] hover:bg-slate-100 focus:bg-white focus:ring-4 text-[#0F172A] font-semibold text-[15px] outline-none transition-all duration-300 placeholder:text-slate-400 placeholder:font-medium ${errors.name ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10' : useSessionIdentity ? readOnlyFieldClass : 'border-transparent focus:border-[#00A878] focus:ring-[#00A878]/10'}`}
                                placeholder="Your name"
                            />
                            {errors.name && <p className="text-rose-500 text-[12px] font-bold mt-2">{errors.name}</p>}
                        </div>
                        <div>
                            <label htmlFor="company" className="block text-[11px] font-bold uppercase tracking-widest text-[#64748B] mb-2">
                                Company Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="company"
                                name="company"
                                value={formData.company}
                                onChange={handleChange}
                                readOnly={useSessionIdentity && hasProfileCompany}
                                required
                                className={`w-full px-5 py-4 bg-[#F8FAFC] border-2 rounded-[16px] hover:bg-slate-100 focus:bg-white focus:ring-4 text-[#0F172A] font-semibold text-[15px] outline-none transition-all duration-300 placeholder:text-slate-400 placeholder:font-medium ${errors.company ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10' : useSessionIdentity && hasProfileCompany ? readOnlyFieldClass : 'border-transparent focus:border-[#00A878] focus:ring-[#00A878]/10'}`}
                                placeholder="Your Company Name"
                            />
                            {errors.company && <p className="text-rose-500 text-[12px] font-bold mt-2">{errors.company}</p>}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-[11px] font-bold uppercase tracking-widest text-[#64748B] mb-2">
                            Email Address <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            readOnly={useSessionIdentity}
                            required
                            className={`w-full px-5 py-4 bg-[#F8FAFC] border-2 rounded-[16px] hover:bg-slate-100 focus:bg-white focus:ring-4 text-[#0F172A] font-semibold text-[15px] outline-none transition-all duration-300 placeholder:text-slate-400 placeholder:font-medium ${errors.email ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10' : useSessionIdentity ? readOnlyFieldClass : 'border-transparent focus:border-[#00A878] focus:ring-[#00A878]/10'}`}
                            placeholder="name@company.com"
                        />
                        {errors.email && <p className="text-rose-500 text-[12px] font-bold mt-2">{errors.email}</p>}
                    </div>

                    <div>
                        <label htmlFor="message" className="block text-[11px] font-bold uppercase tracking-widest text-[#64748B] mb-2">
                            Message <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            id="message"
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            rows="5"
                            required
                            maxLength={500}
                            className={`w-full px-5 py-4 bg-[#F8FAFC] border-2 rounded-[16px] hover:bg-slate-100 focus:bg-white focus:ring-4 text-[#0F172A] font-semibold text-[15px] outline-none transition-all duration-300 resize-none placeholder:text-slate-400 placeholder:font-medium ${errors.message ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/10' : 'border-transparent focus:border-[#00A878] focus:ring-[#00A878]/10'}`}
                            placeholder="How can we help you today?"
                        ></textarea>
                        <div className="flex justify-between items-start mt-2">
                            <div className="flex-1">
                                {errors.message && <p className="text-rose-500 text-[12px] font-bold">{errors.message}</p>}
                            </div>
                            <div className={`text-[11px] font-bold pl-4 ${formData.message.length >= 500 ? 'text-rose-500' : 'text-slate-400'}`}>
                                {formData.message.length}/500
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-[#00A878] to-[#009166] text-white rounded-[16px] font-bold text-[16px] transition-all duration-300 shadow-[0_10px_30px_-10px_rgba(0,168,120,0.5)] hover:shadow-[0_20px_40px_-15px_rgba(0,168,120,0.6)] hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Sending Message...
                            </>
                        ) : (
                            <>
                                <Send size={20} />
                                Send Message
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );

    if (isManufacturerDashboard) {
        return (
            <ProtectedRoute allowedRoles={['manufacturer', 'wholesaler', 'admin']}>
                <DashboardLayout>
                    <PageShell>
                        <PageHeader
                            title="Help & Support"
                            subtitle="Contact our B2B merchant support team or send an inquiry"
                        />
                        {formSection}
                    </PageShell>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    return (
        <PublicLayout>
            <div className="min-h-screen relative pt-32 pb-24 overflow-hidden">
                {/* Modern Dynamic Background */}
                <div className="absolute inset-0 bg-[#F8FAFC] z-0" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-gradient-to-b from-[#00A878]/10 to-transparent rounded-[100%] blur-[100px] z-0" />
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] z-0" />
                <div className="absolute top-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] z-0" />

                <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16 animate-in slide-in-from-bottom-5 fade-in duration-700">
                        <span className="inline-block py-1.5 px-4 rounded-full bg-white border border-[#E5E7EB] text-[12px] font-bold text-[#00A878] tracking-widest uppercase mb-6 shadow-sm">
                            24/7 Support Center
                        </span>
                        <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold text-[#0F172A] mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#0F172A] to-slate-600">
                            Get in Touch
                        </h1>
                        <p className="font-body text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
                            We'd love to hear from you. Tell us how GearUp can transform your business.
                        </p>
                    </div>
                    <div className="animate-in slide-in-from-bottom-10 fade-in duration-1000 delay-150">
                        {formSection}
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
};

export default Contact;
