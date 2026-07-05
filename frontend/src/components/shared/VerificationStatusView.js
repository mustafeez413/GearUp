"use client";

import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import ViewSubmittedDocumentButton from '@/components/shared/ViewSubmittedDocumentButton';
import {
  formatVerificationDate,
  getRoleDashboardPath,
  getVerificationDisplayState,
} from '@/lib/verificationStats';

function StatusBadge({ label, tone = 'amber' }) {
  const toneClass =
    tone === 'emerald'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
      : tone === 'rose'
        ? 'bg-rose-100 text-rose-800 border-rose-200'
        : 'bg-amber-100 text-amber-800 border-amber-200';

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${toneClass}`}>
      {label}
    </span>
  );
}

export default function VerificationStatusView({ user, showBackButton = true }) {
  const state = getVerificationDisplayState(user);
  const dashboardPath = getRoleDashboardPath(user?.role);
  const hasSubmittedDocument = Boolean(user?.businessDetails?.businessLicense);
  const verificationDate = formatVerificationDate(user?.verificationReviewedAt);

  if (state === 'pending') {
    return (
      <div className="w-full space-y-6">
        <div className="w-full">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Clock size={32} strokeWidth={2.5} />
          </div>
          <div className="w-full max-w-xl mx-auto text-center">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 mb-4 w-full">
              Verification Request Submitted
            </h1>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed w-full">
              Your business verification documents have been received successfully and are currently under review.
              Please wait for approval from our verification team.
            </p>
          </div>
        </div>

        <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-body text-sm font-semibold text-amber-900">Status</span>
            <StatusBadge label="Pending Review" tone="amber" />
          </div>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm font-medium text-emerald-700">
              <CheckCircle size={16} /> Documents Submitted
            </li>
            <li className="flex items-center gap-2 text-sm font-medium text-emerald-700">
              <CheckCircle size={16} /> Verification Request Received
            </li>
            <li className="flex items-center gap-2 text-sm font-medium text-amber-800">
              <Clock size={16} /> Under Admin Review
            </li>
          </ul>
          <p className="font-body text-sm font-semibold text-amber-900">
            Estimated Review Time: 3–5 Business Days
          </p>
          <p className="font-body text-sm text-amber-800">
            You will be notified once your verification has been reviewed.
          </p>
        </div>

        <div className="w-full flex flex-col sm:flex-row gap-3">
          {hasSubmittedDocument && (
            <div className="flex-1 min-w-0">
              <ViewSubmittedDocumentButton
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-white border border-amber-200 text-amber-900 hover:bg-amber-50 rounded-xl font-heading font-bold text-sm transition-all disabled:opacity-70"
              />
            </div>
          )}
          {showBackButton && (
            <Link
              href={dashboardPath}
              className="flex-1 min-w-0 inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#021018] text-white hover:bg-[#00A878] rounded-xl font-heading font-bold text-sm transition-all"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (state === 'approved') {
    return (
      <div className="w-full space-y-6">
        <div className="w-full max-w-xl mx-auto text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <ShieldCheck size={32} strokeWidth={2.5} />
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 mb-4 w-full">
            Business Verified
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed w-full">
            Your verification has been approved successfully.
          </p>
          {verificationDate && (
            <p className="font-body text-sm font-semibold text-emerald-700 mt-3">
              Verification Date: {verificationDate}
            </p>
          )}
        </div>

        {showBackButton && (
          <Link
            href={dashboardPath}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#021018] text-white hover:bg-[#00A878] rounded-xl font-heading font-bold text-sm transition-all"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
        )}
      </div>
    );
  }

  if (state === 'rejected') {
    return (
      <div className="w-full space-y-6">
        <div className="w-full max-w-xl mx-auto text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
            <AlertCircle size={32} strokeWidth={2.5} />
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 mb-4 w-full">
            Verification Requires Action
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed w-full">
            Your verification request needs additional information.
          </p>
        </div>

        {user?.verificationRejectionReason && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5">
            <p className="font-body text-sm font-semibold text-rose-900 mb-1">Reason</p>
            <p className="font-body text-sm text-rose-800">{user.verificationRejectionReason}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/verify-business"
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#021018] text-white hover:bg-[#00A878] rounded-xl font-heading font-bold text-sm transition-all"
          >
            Resubmit Verification
            <ArrowRight size={16} />
          </Link>
          {showBackButton && (
            <Link
              href={dashboardPath}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-heading font-bold text-sm transition-all"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>
          )}
        </div>
      </div>
    );
  }

  return null;
}
