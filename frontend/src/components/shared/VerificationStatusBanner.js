"use client";

import Link from 'next/link';
import { AlertCircle, ArrowRight, CheckCircle, Clock, ShieldCheck } from 'lucide-react';
import ViewSubmittedDocumentButton from '@/components/shared/ViewSubmittedDocumentButton';
import {
  formatVerificationDate,
  getVerificationDisplayState,
} from '@/lib/verificationStats';

function ChecklistItem({ icon: Icon, label, tone = 'emerald' }) {
  const toneClass =
    tone === 'amber'
      ? 'text-amber-700'
      : tone === 'slate'
        ? 'text-slate-600'
        : 'text-emerald-700';

  return (
    <li className={`flex items-center gap-2 text-xs font-medium ${toneClass}`}>
      <Icon size={14} className="shrink-0" />
      <span>{label}</span>
    </li>
  );
}

export default function VerificationStatusBanner({
  user,
  notSubmittedDescription = 'Complete your business verification to unlock all platform features.',
  compact = false,
}) {
  const state = getVerificationDisplayState(user);
  if (!state) return null;

  const hasSubmittedDocument = Boolean(user?.businessDetails?.businessLicense);
  const verificationDate = formatVerificationDate(user?.verificationReviewedAt);

  if (state === 'approved') {
    return (
      <div className="p-5 rounded-2xl border shadow-[0_1px_3px_rgba(0,0,0,0.01)] bg-emerald-50/80 border-emerald-200/70 text-emerald-950">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl shrink-0 mt-0.5 bg-emerald-100/80 border border-emerald-200/40 text-emerald-700">
            <ShieldCheck size={18} className="stroke-[2.5]" />
          </div>
          <div className="flex-1">
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 leading-none mt-1">
              <CheckCircle size={15} /> Business Verified
            </h3>
            <p className="font-body text-xs text-emerald-800 font-medium leading-relaxed mt-2.5">
              Your business account has been successfully verified.
            </p>
            {verificationDate && (
              <p className="font-body text-xs text-emerald-700 font-semibold mt-2">
                Verification Date: {verificationDate}
              </p>
            )}
            <Link
              href="/verification-status"
              className="inline-flex items-center gap-1.5 mt-4 px-4.5 py-2.5 bg-emerald-700 text-white hover:bg-emerald-800 rounded-xl transition-all font-heading font-bold text-xs shadow-sm"
            >
              View Verification Details
              <ArrowRight size={13} className="stroke-[2.5]" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'pending') {
    return (
      <div className="p-5 rounded-2xl border shadow-[0_1px_3px_rgba(0,0,0,0.01)] bg-amber-50/75 border-amber-200/60 text-amber-900">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl shrink-0 mt-0.5 bg-amber-100/80 border border-amber-200/40 text-amber-700">
            <Clock size={18} className="stroke-[2.5]" />
          </div>
          <div className="flex-1">
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider leading-none mt-1">
              Verification Status: Pending Review
            </h3>
            <p className="font-body text-xs text-amber-900/90 font-medium leading-relaxed mt-2.5">
              Your business verification documents have been successfully submitted and are currently under review by our verification team.
            </p>
            <ul className="mt-3 space-y-1.5">
              <ChecklistItem icon={CheckCircle} label="Documents Submitted" />
              <ChecklistItem icon={CheckCircle} label="Verification Request Received" />
              <ChecklistItem icon={Clock} label="Under Admin Review" tone="amber" />
            </ul>
            <p className="font-body text-xs text-amber-800 font-semibold mt-3">
              Expected Review Time: 3–5 Business Days
            </p>
            <p className="font-body text-xs text-amber-800/90 font-medium mt-1.5">
              You will receive a notification once the review is completed.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {hasSubmittedDocument ? (
                <ViewSubmittedDocumentButton
                  className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-white border border-amber-200 text-amber-900 hover:bg-amber-100 rounded-xl transition-all font-heading font-bold text-xs shadow-sm disabled:opacity-70"
                  showArrow
                />
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-amber-100 text-amber-800 border border-amber-200 rounded-xl font-heading font-bold text-xs cursor-not-allowed opacity-90"
                >
                  Verification Submitted
                </button>
              )}
              <Link
                href="/verification-status"
                className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-[#021018] text-white hover:bg-[#00A878] rounded-xl transition-all font-heading font-bold text-xs shadow-sm hover:shadow"
              >
                View Status
                <ArrowRight size={13} className="stroke-[2.5]" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'rejected') {
    return (
      <div className="p-5 rounded-2xl border shadow-[0_1px_3px_rgba(0,0,0,0.01)] bg-rose-50/75 border-rose-200/60 text-rose-950">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl shrink-0 mt-0.5 bg-rose-100/80 border border-rose-200/40 text-rose-700">
            <AlertCircle size={18} className="stroke-[2.5]" />
          </div>
          <div className="flex-1">
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider leading-none mt-1">
              Verification Status: Action Required
            </h3>
            <p className="font-body text-xs text-rose-900 font-medium leading-relaxed mt-2.5">
              Your verification request requires additional information.
            </p>
            {user?.verificationRejectionReason && (
              <p className="font-body text-xs text-rose-800 font-semibold mt-2.5">
                Reason: {user.verificationRejectionReason}
              </p>
            )}
            <Link
              href="/verify-business"
              className="inline-flex items-center gap-1.5 mt-4.5 px-4.5 py-2.5 bg-[#021018] text-white hover:bg-[#00A878] rounded-xl transition-all font-heading font-bold text-xs shadow-sm hover:shadow"
            >
              Resubmit Verification
              <ArrowRight size={13} className="stroke-[2.5]" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border shadow-[0_1px_3px_rgba(0,0,0,0.01)] bg-slate-50 border-slate-200 text-slate-900 ${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-xl shrink-0 mt-0.5 bg-slate-200 text-slate-700">
          <AlertCircle size={18} className="stroke-[2.5]" />
        </div>
        <div className="flex-1">
          <h3 className="font-heading text-sm font-bold uppercase tracking-wider leading-none mt-1">
            Verification Status: Not Submitted
          </h3>
          <p className="font-body text-xs text-[#475569] font-medium leading-relaxed mt-2.5">
            {notSubmittedDescription}
          </p>
          <Link
            href="/verify-business"
            className="inline-flex items-center gap-1.5 mt-4.5 px-4.5 py-2.5 bg-[#021018] text-white hover:bg-[#00A878] rounded-xl transition-all font-heading font-bold text-xs shadow-sm hover:shadow"
          >
            Verify Business Now
            <ArrowRight size={13} className="stroke-[2.5]" />
          </Link>
        </div>
      </div>
    </div>
  );
}
