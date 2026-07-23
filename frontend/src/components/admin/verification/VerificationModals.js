"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Building2, Store } from 'lucide-react';
import {
  fetchSecureAdminUploadBlobUrl,
  openSecureAdminUpload,
} from '@/lib/secureUpload';
import {
  getBusinessName,
  getVerificationId,
  getApplicantStatus,
  computeCompleteness,
  buildTimeline,
  formatDate,
  getSubmittedDate,
  getDocumentMeta,
  REJECTION_REASONS,
} from '@/lib/verificationCenterUtils';
import { btnRejectSm as btnReject } from './verificationTheme';

export function ConfirmActionModal({ open, type, businessName, onConfirm, onCancel, loading }) {
  if (!open) return null;
  const isApprove = type === 'approve';

  return (
    <ModalShell onClose={onCancel} labelId="verification-confirm-title">
      <div className="px-6 pt-6 pb-4 border-b border-slate-100">
        <h3 id="verification-confirm-title" className="text-lg font-bold text-[#0B1F3A] tracking-tight">
          {isApprove ? 'Approve verification?' : 'Reject verification?'}
        </h3>
        <p className="text-sm font-medium text-[#64748B] mt-2 leading-relaxed">{businessName}</p>
      </div>
      <div className="px-6 py-5 bg-slate-50/60">
        <p className="text-sm text-[#64748B] leading-relaxed">
          {isApprove
            ? 'This business will be marked as verified and can access marketplace features.'
            : 'This application will be declined. The applicant can resubmit after addressing issues.'}
        </p>
      </div>
      <div className="px-6 py-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 h-11 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#64748B] hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={onConfirm}
          className={`flex-1 h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-colors shadow-sm ${
            isApprove ? 'bg-[#10B981] hover:bg-[#059669]' : 'bg-[#EF4444] hover:bg-red-600'
          }`}
        >
          {loading ? '…' : isApprove ? 'Approve' : 'Reject'}
        </button>
      </div>
    </ModalShell>
  );
}

export function RejectReasonModal({ open, reason, notes, onReasonChange, onNotesChange, onConfirm, onCancel, loading }) {
  if (!open) return null;

  return (
    <ModalShell onClose={onCancel} labelId="verification-reject-title">
      <div className="px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
        <h3 id="verification-reject-title" className="text-lg font-bold text-[#0B1F3A] tracking-tight">
          Rejection reason
        </h3>
        <p className="text-sm font-medium text-[#64748B] mt-1">Select why this application cannot be approved.</p>
      </div>
      <div className="px-6 py-5 overflow-y-auto flex-1 min-h-0">
        <div className="space-y-2 mb-4">
          {REJECTION_REASONS.map((r) => (
            <label
              key={r}
              className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer text-sm font-medium transition-colors ${
                reason === r ? 'border-[#EF4444] bg-red-50 text-[#0B1F3A]' : 'border-slate-200 text-[#64748B] hover:border-slate-300'
              }`}
            >
              <input type="radio" name="rejectReason" value={r} checked={reason === r} onChange={() => onReasonChange(r)} />
              {r}
            </label>
          ))}
        </div>
        {reason === 'Other' && (
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={2}
            placeholder="Additional notes…"
            className="w-full mb-4 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-[#0B1F3A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10B981]/15 focus:border-[#10B981] resize-none"
          />
        )}
      </div>
      <div className="px-6 py-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row gap-3 shrink-0 bg-white">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 h-11 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#64748B] hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={loading || !reason || (reason === 'Other' && !notes.trim())}
          onClick={onConfirm}
          className={`flex-1 ${btnReject} h-11 text-sm rounded-xl disabled:opacity-50`}
        >
          {loading ? '…' : 'Confirm reject'}
        </button>
      </div>
    </ModalShell>
  );
}

export function DocumentViewerModal({ open, user, onClose }) {
  const doc = open && user ? getDocumentMeta(user) : null;
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !doc?.path) {
      setBlobUrl(null);
      setError(null);
      setLoading(false);
      return undefined;
    }

    let active = true;
    let objectUrl = null;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        objectUrl = await fetchSecureAdminUploadBlobUrl(doc.path);
        if (active) setBlobUrl(objectUrl);
      } catch (err) {
        if (active) setError(err.message || 'Could not load document.');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, doc?.path]);

  if (!open || !user || !doc) return null;

  const isPdf = doc.ext === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(doc.ext);

  return (
    <ModalShell onClose={onClose} wide>
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <div>
          <h3 className="font-bold text-[#0B1F3A]">{doc.name}</h3>
          <p className="text-xs font-medium text-[#64748B]">{doc.type} · {getBusinessName(user)}</p>
        </div>
        <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-[#64748B]">
          <X size={20} />
        </button>
      </div>
      <div className="p-4 bg-slate-50 min-h-[320px] max-h-[70vh] overflow-auto">
        {loading ? (
          <div className="h-[60vh] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="h-[60vh] flex items-center justify-center text-sm text-[#64748B]">{error}</div>
        ) : isPdf ? (
          <iframe src={blobUrl} title={doc.name} className="w-full h-[60vh] rounded-xl border border-slate-200 bg-white shadow-sm" />
        ) : isImage ? (
          <img src={blobUrl} alt={doc.name} className="max-w-full mx-auto rounded-xl shadow-sm" />
        ) : (
          <div className="h-[60vh] flex items-center justify-center text-sm text-[#64748B]">
            Preview not available for this file type.
          </div>
        )}
      </div>
      <div className="px-6 py-3 border-t border-slate-200 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => openSecureAdminUpload(doc.path)}
          className="text-sm font-semibold text-[#10B981] hover:text-[#059669] transition-colors"
        >
          Open in new tab
        </button>
      </div>
    </ModalShell>
  );
}

export function BusinessProfileModal({ open, user, onClose }) {
  if (!open || !user) return null;
  const bd = user.businessDetails || {};
  const completeness = computeCompleteness(user);
  const timeline = buildTimeline(user);

  return (
    <ModalShell onClose={onClose} wide>
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0B1F3A] text-white flex items-center justify-center">
            {user.role === 'manufacturer' ? <Building2 size={18} /> : <Store size={18} />}
          </div>
          <div>
            <h3 className="font-bold text-[#0B1F3A]">{getBusinessName(user)}</h3>
            <p className="text-xs font-medium text-[#64748B]">Verification ID · {getVerificationId(user)}</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">
          <X size={20} />
        </button>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
        <Section title="Company">
          <Row label="Business type" value={user.role === 'manufacturer' ? 'Manufacturer' : 'Wholesaler'} />
          <Row label="Email" value={user.email} />
          <Row label="Phone" value={bd.phone} />
          <Row label="Location" value={[bd.city, bd.province].filter(Boolean).join(', ') || '—'} />
          <Row label="Registered" value={formatDate(user.createdAt)} />
          <Row label="Status" value={getApplicantStatus(user)} />
        </Section>
        <Section title="Profile completion">
          <p className="text-2xl font-bold text-[#10B981] mb-2">{completeness.percent}%</p>
          <ul className="space-y-1 text-sm font-medium text-[#64748B]">
            {completeness.checks.map((c) => (
              <li key={c.key}>{c.ok ? '✓' : '○'} {c.label}</li>
            ))}
          </ul>
        </Section>
        <Section title="Verification history" className="md:col-span-2">
          <ol className="space-y-2">
            {timeline.map((step) => (
              <li key={step.id} className="flex justify-between text-sm border-b border-slate-100 pb-2">
                <span className="font-semibold text-[#0B1F3A]">{step.label}</span>
                <span className="font-medium text-[#64748B]">{formatDate(step.at)}</span>
              </li>
            ))}
          </ol>
          {user.verificationRejectionReason && (
            <p className="mt-3 text-sm font-medium text-[#EF4444]">Last rejection: {user.verificationRejectionReason}</p>
          )}
        </Section>
        {user.role === 'manufacturer' && (
          <Section title="Payout Information" className="md:col-span-2">
            <Row label="Configuration Status" value={user.payoutDetails?.isConfigured ? 'Configured' : 'Not Configured'} />
            {user.payoutDetails?.isConfigured && (
              <>
                <Row label="Preferred Method" value={user.payoutDetails.method || '—'} />
                <Row label="Account Title" value={user.payoutDetails.accountTitle || '—'} />
                {user.payoutDetails.method === 'Bank Transfer' ? (
                  <>
                    <Row label="Bank Name" value={user.payoutDetails.bankName || '—'} />
                    <Row label="IBAN / Account Number" value={user.payoutDetails.iban || '—'} />
                    <Row label="Account Number" value={user.payoutDetails.accountNumber || '—'} />
                  </>
                ) : (
                  <Row label="Wallet Number" value={user.payoutDetails.walletNumber || '—'} />
                )}
              </>
            )}
          </Section>
        )}
        {user.verificationAdminNotes && (
          <Section title="Admin notes" className="md:col-span-2">
            <p className="text-sm font-medium text-[#64748B] whitespace-pre-wrap">{user.verificationAdminNotes}</p>
          </Section>
        )}
      </div>
    </ModalShell>
  );
}

function ModalShell({ children, onClose, wide, labelId }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mounted, onClose]);

  if (!mounted) return null;

  const panelWidth = wide ? 'min(896px, calc(100vw - 24px))' : 'min(448px, calc(100vw - 24px))';

  const shell = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#0B1F3A]/55 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close dialog"
      />
      <div
        className="relative z-10 flex flex-col shrink-0 bg-white rounded-2xl border border-slate-200/90 shadow-[0_24px_64px_rgba(11,31,58,0.18)] overflow-hidden max-h-[min(92vh,840px)] animate-fadeIn"
        style={{ width: panelWidth, minWidth: 'min(280px, calc(100vw - 24px))' }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );

  return createPortal(shell, document.body);
}

function Section({ title, children, className = '' }) {
  return (
    <div className={className}>
      <h4 className="text-[11px] font-bold uppercase tracking-wide text-[#64748B] mb-3">{title}</h4>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm border-b border-slate-50">
      <span className="font-medium text-[#64748B]">{label}</span>
      <span className="font-semibold text-[#0B1F3A] text-right truncate">{value || '—'}</span>
    </div>
  );
}
