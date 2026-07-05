"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getApiBaseUrl } from '@/lib/api';
import { Mail, CheckCircle, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const VerifyEmailContent = () => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [timer, setTimer] = useState(60);
    const searchParams = useSearchParams();
    const email = searchParams.get('email');
    const router = useRouter();
    const { user, updateUser } = useAuth();

    useEffect(() => {
        if (!email) {
            router.push('/register');
        }
    }, [email, router]);

    useEffect(() => {
        // Clear any stale errors on mount
        setError('');
    }, []);

    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleChange = (element, index) => {
        if (isNaN(element.value)) return false;

        setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

        // Focus next input
        if (element.nextSibling && element.value !== '') {
            element.nextSibling.focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !otp[index] && e.target.previousSibling) {
            e.target.previousSibling.focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }

        setError('');
        setLoading(true);

        try {
            // Force absolute URL to bypass any Next.js proxying issues
            const targetUrl = `${getApiBaseUrl()}/api/auth/verify-email?t=${Date.now()}`;

            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email, otp: otpCode })
            });

            // Check if response is actually JSON before parsing
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await response.text();
                console.error("Received non-JSON response:", text);
                throw new Error("Server returned an invalid response (HTML instead of JSON). Please ensure the backend is running on port 5000.");
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Verification failed');
            }

            // Update Auth Context with verified status
            updateUser(data.user);

            setSuccess(true);

            // Wait 2 seconds then redirect
            setTimeout(() => {
                const role = data.user?.role || user?.role;
                if (role === 'manufacturer') {
                    router.replace('/manufacturer/dashboard');
                } else if (role === 'wholesaler') {
                    router.replace('/wholesaler/dashboard');
                } else {
                    router.replace('/');
                }
            }, 2000);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (timer > 0) return;

        setResending(true);
        setError('');
        try {
            const targetUrl = `${getApiBaseUrl()}/api/auth/resend-otp?t=${Date.now()}`;

            const response = await fetch(targetUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Server returned an invalid response. Please check if the backend is running.");
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to resend code');
            }

            setTimer(60);
            alert('A new verification code has been sent to your email.');
        } catch (err) {
            setError(err.message);
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="fixed inset-0 w-full h-full bg-[#0F172A] flex items-center justify-center p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#064E3B]"></div>
            {/* Background Decor */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            </div>

            <div className="w-full max-w-[450px] relative z-10 animate-fadeIn">
                <div className="bg-white shadow-2xl rounded-[2.5rem] overflow-hidden border border-white/20 p-8 md:p-12">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <Mail size={40} />
                        </div>
                        <h1 className="font-heading text-3xl font-bold text-slate-900 mb-2">Verify Your Email</h1>
                        <p className="text-slate-600">
                            We've sent a 6-digit verification code to <br />
                            <span className="font-bold text-slate-800">{email}</span>
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 animate-shake">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            <p className="text-sm text-red-600 font-medium">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 animate-bounceIn">
                            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                            <p className="text-sm text-emerald-600 font-medium">Verification successful! Redirecting...</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="flex justify-between gap-2 sm:gap-4">
                            {otp.map((data, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    maxLength="1"
                                    value={data}
                                    onChange={(e) => handleChange(e.target, index)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all bg-white text-slate-800 shadow-sm"
                                    autoFocus={index === 0}
                                />
                            ))}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || success || otp.join('').length !== 6}
                            className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="animate-spin" size={20} />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    Verify Account
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 text-center">
                        <p className="text-slate-500 text-sm mb-2">Didn't receive the code?</p>
                        <button
                            onClick={handleResend}
                            disabled={timer > 0 || resending}
                            className={`text-sm font-bold transition-colors ${timer > 0 || resending ? 'text-slate-400 cursor-not-allowed' : 'text-emerald-600 hover:text-emerald-700 underline underline-offset-4'}`}
                        >
                            {resending ? 'Resending...' : timer > 0 ? `Resend in ${timer}s` : 'Resend Code Now'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>}>
            <VerifyEmailContent />
        </Suspense>
    );
}
