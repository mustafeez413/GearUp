"use client";

import { getApiBaseUrl } from '@/lib/api';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const LoginContent = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const from = searchParams.get('from') || '/';

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

    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

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
        throw new Error(data.error || 'Failed to sign in');
      }

      await login(data.user, data.token);

      // Smart Redirect Logic
      const role = data.user.role;
      if (role === 'manufacturer') {
        router.replace('/manufacturer/dashboard');
      } else if (role === 'wholesaler') {
        router.replace('/wholesaler/dashboard');
      } else if (role === 'admin') {
        router.replace('/admin/dashboard');
      } else {
        router.replace(from);
      }

    } catch (err) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#064E3B] flex items-center justify-center px-4 py-12 relative overflow-hidden">

      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
      </div>

      <div className="w-full max-w-md min-w-[320px] sm:min-w-[400px] shrink-0 mx-auto relative z-10 animate-fadeIn">
        <div suppressHydrationWarning className="bg-white/95 backdrop-blur shadow-2xl rounded-3xl overflow-hidden border border-white/20">

          {/* Header */}
          <div suppressHydrationWarning className="px-8 pt-10 pb-6 text-center">
            <h1 className="font-heading text-3xl font-bold text-slate-900 mb-2">Welcome Back</h1>
            <p className="text-slate-600">Secure access to your sports commerce workspace</p>
          </div>

          {/* Form */}
          <div className="px-8 pb-10">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-slate-700">Password</label>
                  <Link href="/forgot-password" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 cursor-pointer">
                  Remember me
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In Securely'}
                {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center">
              <span className="text-sm text-slate-500 font-medium">Or continue with</span>
            </div>

            <div className="mt-6 flex justify-center">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  try {
                    setError('');
                    setLoading(true);
                    const response = await fetch(`${getApiBaseUrl()}/api/auth/google`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ token: credentialResponse.credential })
                    });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.error || 'Google Sign In failed');
                    
                    await login(data.user, data.token);

                    const role = data.user.role;
                    if (role === 'manufacturer') router.replace('/manufacturer/dashboard');
                    else if (role === 'wholesaler') router.replace('/wholesaler/dashboard');
                    else if (role === 'admin') router.replace('/admin/dashboard');
                    else router.replace(from);
                  } catch (err) {
                    setError(err.message || 'Failed to sign in with Google.');
                  } finally {
                    setLoading(false);
                  }
                }}
                onError={() => {
                  setError('Google Sign In failed');
                }}
                useOneTap
              />
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <p className="text-center text-sm text-slate-600 mb-6">
                Your dashboard will open automatically based on your account role.
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
                  <Shield size={14} className="text-emerald-600" />
                  <span>Enterprise-grade security</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
                  <CheckCircle size={14} className="text-emerald-600" />
                  <span>Two-factor authentication supported</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
                  <CheckCircle size={14} className="text-emerald-600" />
                  <span>Verified business accounts only</span>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-slate-600">
                Don't have an account?{' '}
                <Link href="/register" className="font-bold text-emerald-600 hover:text-emerald-500 transition-colors">
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Login = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#064E3B] flex items-center justify-center px-4 py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-emerald-500 font-heading text-xl font-bold animate-pulse italic tracking-tighter">Establishing Secure Connection...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
};

export default Login;
