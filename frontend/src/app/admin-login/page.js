"use client";

import { getApiBaseUrl } from '@/lib/api';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { Lock, ShieldAlert, BadgeCheck, ArrowLeft } from 'lucide-react';

const AdminLogin = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to authenticate');
            }

            if (data.user.role !== 'admin') {
                throw new Error('Access denied. Not an admin account.');
            }

            await login(data.user, data.token);
            router.replace('/admin/dashboard');
        } catch (err) {
            setError(err.message || 'Invalid admin credentials. Please check your password.');
        } finally {
            setLoading(false);
        }
    };

    const inputClass =
        'w-full min-h-[48px] box-border px-4 py-3 rounded-xl border border-gray-600 bg-gray-800/90 text-white text-base placeholder:text-gray-500 shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-shadow';

    return (
        <div className="min-h-screen w-full bg-gradient-to-b from-slate-950 via-gray-900 to-slate-950 flex flex-col items-center justify-center px-4 py-10 sm:py-14">
            {/* Explicit width at ALL breakpoints — avoids collapsed column when sm:* only applies ≥640px */}
            <div className="w-full max-w-[460px] mx-auto shrink-0">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm font-body font-medium text-gray-400 hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 shrink-0" />
                    Back to site
                </Link>

                <div className="text-center mb-8 px-2">
                    <div className="inline-flex p-4 bg-gray-800/80 rounded-2xl border border-gray-700 shadow-lg mb-6">
                        <Lock className="w-10 h-10 text-emerald-500" aria-hidden />
                    </div>
                    <h1 className="font-heading text-2xl sm:text-3xl font-black text-white tracking-tight">
                        Admin portal access
                    </h1>
                    <p className="mt-3 font-body text-sm text-gray-400 leading-relaxed text-center w-full max-w-none break-normal">
                        Authorized administrators only. Use your platform admin credentials.
                    </p>
                </div>

                <div className="w-full rounded-2xl border border-gray-700/80 bg-gray-800/60 backdrop-blur-sm shadow-2xl p-6 sm:p-8">
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="admin-email" className="block text-sm font-body font-semibold text-gray-300 mb-2">
                                Admin email
                            </label>
                            <input
                                id="admin-email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="admin@gearup.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="admin-password" className="block text-sm font-body font-semibold text-gray-300 mb-2">
                                Password
                            </label>
                            <input
                                id="admin-password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder="Enter your password"
                            />
                        </div>

                        {error && (
                            <div
                                role="alert"
                                className="rounded-xl bg-red-950/60 p-4 border border-red-800/80 flex gap-3"
                            >
                                <ShieldAlert className="h-5 w-5 text-red-400 shrink-0 mt-0.5" aria-hidden />
                                <p className="text-sm font-body text-red-200 leading-snug">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full min-h-[48px] flex items-center justify-center rounded-xl font-body font-bold text-sm uppercase tracking-widest text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-emerald-500 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {loading ? 'Authenticating…' : 'Authenticate'}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-700/80">
                        <p className="text-center text-xs font-body text-gray-500 uppercase tracking-wider mb-4">
                            System status
                        </p>
                        <div className="flex flex-wrap justify-center items-center gap-2 text-xs font-body text-gray-500">
                            <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden />
                            <span>Secure connection · Encrypted session</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
