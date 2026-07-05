"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import VerificationStatusView from '@/components/shared/VerificationStatusView';
import { getVerificationDisplayState } from '@/lib/verificationStats';

export default function VerificationStatusPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const state = getVerificationDisplayState(user);

  useEffect(() => {
    if (authLoading || !user) return;
    if (state === 'not_submitted') {
      router.replace('/verify-business');
    }
  }, [authLoading, user, state, router]);

  if (authLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
          <Loader2 size={40} className="animate-spin text-emerald-500" />
        </div>
      </ProtectedRoute>
    );
  }

  if (!user || state === 'not_submitted') {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
          <Loader2 size={40} className="animate-spin text-emerald-500" />
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
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 to-emerald-900/85 mix-blend-multiply" />
        </div>

        <div className="relative z-10 w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl p-8 sm:p-10">
          <VerificationStatusView user={user} />
        </div>
      </div>
    </ProtectedRoute>
  );
}
