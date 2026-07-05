'use client';

import Link from 'next/link';
import AdminPageShell from '@/components/admin/AdminPageShell';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export default function AdminVerificationSettingsPage() {
  return (
    <AdminPageShell
      title="Verification Settings"
      description="Business verification policies and review workflows for manufacturers and wholesalers."
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <p className="text-sm text-slate-600">
          Verification review rules and document approval workflows are managed through the Verifications center.
          Use the link below to review pending, approved, and rejected business submissions.
        </p>
        <Link
          href="/admin/verifications"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#021018] text-white text-sm font-bold hover:bg-[#00A878] transition-colors"
        >
          <ShieldCheck size={16} />
          Open Verifications Center
          <ArrowRight size={16} />
        </Link>
      </div>
    </AdminPageShell>
  );
}
