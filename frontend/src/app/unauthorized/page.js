"use client";

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function Unauthorized() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-12 text-center border border-slate-100">
                <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-8">
                    <ShieldAlert className="text-red-600" size={40} />
                </div>
                <h1 className="font-heading text-3xl font-black text-slate-900 mb-4 tracking-tighter">Access Denied</h1>
                <p className="font-body text-slate-500 mb-10 leading-relaxed font-medium">
                    You don't have the necessary permissions to access this section of the platform. Please contact your administrator if you believe this is an error.
                </p>
                <div className="space-y-4">
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 text-white rounded-2xl font-body font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20"
                    >
                        <ArrowLeft size={18} />
                        Back to Home
                    </Link>
                    <Link
                        href="/login"
                        className="block w-full py-4 text-slate-500 font-body font-bold hover:text-slate-900 transition-colors"
                    >
                        Sign in as different user
                    </Link>
                </div>
            </div>
        </div>
    );
}
