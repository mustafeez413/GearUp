"use client";

import Link from 'next/link';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#021018] flex items-center justify-center p-6 selection:bg-[#00A878]/30">
      <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-3xl p-10 text-center backdrop-blur-xl relative overflow-hidden shadow-2xl">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#00A878]/20 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mb-6 border border-white/10 shadow-lg rotate-3">
            <AlertTriangle size={36} className="text-[#00A878]" />
          </div>
          
          <h1 className="font-heading text-6xl font-extrabold text-white mb-2 tracking-tight">404</h1>
          <h2 className="font-heading text-xl font-bold text-slate-200 mb-4">Page Not Found</h2>
          
          <p className="text-sm text-slate-400 font-medium mb-10 leading-relaxed max-w-[280px]">
            The analytics dashboard or page you are looking for doesn't exist or has been moved.
          </p>
          
          <Link 
            href="/manufacturer/dashboard" 
            className="group relative inline-flex items-center justify-center gap-2.5 bg-[#00A878] hover:bg-[#0DBB85] text-white font-heading font-bold text-sm px-6 py-3.5 rounded-xl transition-all duration-300 w-full hover:-translate-y-1 hover:shadow-[0_12px_24px_-8px_rgba(0,200,117,0.5)] focus:ring-2 focus:ring-[#00A878] focus:ring-offset-2 focus:ring-offset-[#021018] outline-none"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
