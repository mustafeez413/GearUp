"use client";

import React, { useEffect, useState } from 'react';
import {
  Building2,
  Store,
  FileText,
  Eye,
  ExternalLink,
  Download,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Phone,
  MapPin,
  Hash,
  FileWarning,
} from 'lucide-react';
import {
  openSecureAdminUpload,
  downloadSecureAdminUpload,
  fetchSecureAdminUploadBlobUrl,
} from '@/lib/secureUpload';
import {
  getApplicantStatus,
  getVerificationId,
  getBusinessName,
  getSubmittedDate,
  formatDate,
  getDocumentMeta,
  getTrustBadges,
  computeCompleteness,
} from '@/lib/verificationCenterUtils';
import {
  cardInteractive,
  btnApprovePrimary,
  btnRejectSm,
  btnNeutralSm,
  btnGhost,
  sectionTitle,
} from './verificationTheme';
import UserAvatar from '@/components/ui/UserAvatar';

const STATUS_ACCENT = {
  pending: 'border-l-[#F59E0B]',
  approved: 'border-l-[#10B981]',
  rejected: 'border-l-[#EF4444]',
};

const STATUS_BADGE = {
  pending: {
    label: 'Pending Review',
    className: 'bg-amber-50 text-amber-900 border-amber-300',
    dot: 'bg-[#F59E0B]',
  },
  approved: {
    label: 'Approved',
    className: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    dot: 'bg-[#10B981]',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-50 text-red-900 border-red-200',
    dot: 'bg-[#EF4444]',
  },
};

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getConfidenceLabel(percent) {
  if (percent >= 80) return { label: 'High Confidence', tone: 'text-emerald-800 bg-emerald-50 border-emerald-200' };
  if (percent >= 60) return { label: 'Moderate Confidence', tone: 'text-amber-900 bg-amber-50 border-amber-200' };
  return { label: 'Low Confidence', tone: 'text-red-800 bg-red-50 border-red-200' };
}

export default function VerificationApplicationCard({
  user,
  onApprove,
  onReject,
  onViewDocument,
  onViewProfile,
  actionId,
}) {
  const status = getApplicantStatus(user);
  const badge = STATUS_BADGE[status] || STATUS_BADGE.pending;
  const accent = STATUS_ACCENT[status] || STATUS_ACCENT.pending;
  const doc = getDocumentMeta(user);
  const bd = user.businessDetails || {};
  const isPending = status === 'pending';
  const trustBadges = getTrustBadges(user);
  const completeness = computeCompleteness(user);
  const confidence = getConfidenceLabel(completeness.percent);
  const businessName = getBusinessName(user);
  const isMfr = user.role === 'manufacturer';

  return (
    <article className={`group relative ${cardInteractive} overflow-hidden border-l-4 ${accent}`}>
      {/* ── Enterprise review header ── */}
      <div className="px-5 py-2.5 border-b border-[#E2E8F0]">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
          {/* Left — identity block */}
          <div className="flex items-start gap-3.5 min-w-0 flex-1">
            <CompanyAvatar user={user} name={businessName} isManufacturer={isMfr} />
            <div className="min-w-0 flex-1">
              <h3 className="text-[28px] font-bold text-[#0B1F3A] tracking-[-0.03em] leading-[1.15] truncate">
                {businessName}
              </h3>
              <p className="text-[13px] font-medium text-[#64748B] mt-0.5">
                {isMfr ? 'Manufacturer' : 'Wholesaler'}
              </p>
              <p className="text-[12px] text-[#64748B] mt-1 leading-relaxed">
                <span className="text-slate-400">ID</span>{' '}
                <span className="font-mono font-semibold text-[#0B1F3A]">{getVerificationId(user)}</span>
                <span className="text-slate-300 mx-1.5">·</span>
                <span className="text-slate-400">Submitted</span>{' '}
                <span className="font-semibold text-[#0B1F3A]">{formatDate(getSubmittedDate(user))}</span>
              </p>

              {/* Status badges — under company info */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <StatusBadge badge={badge} />
                <RolePill role={user.role} />
              </div>

              {/* Confidence metrics — same row under badges */}
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <ConfidencePill label={confidence.label} tone={confidence.tone} />
                <MetricPill percent={completeness.percent} />
              </div>
            </div>
          </div>

          {/* Right — actions */}
          <div className="flex flex-row lg:flex-col items-center lg:items-end gap-2 shrink-0 lg:pt-1">
            <button type="button" onClick={() => onViewProfile(user)} className={btnNeutralSm}>
              <User size={15} />
              Review Profile
            </button>
            {isPending && (
              <>
                <button
                  type="button"
                  disabled={actionId === user._id}
                  onClick={() => onReject(user)}
                  className={btnRejectSm}
                >
                  <XCircle size={15} />
                  Reject
                </button>
                <button
                  type="button"
                  disabled={actionId === user._id}
                  onClick={() => onApprove(user)}
                  className={btnApprovePrimary}
                >
                  <CheckCircle size={16} />
                  Approve
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Trust chips ── */}
      <div className="px-5 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]/80">
        <div className="flex flex-wrap gap-2">
          {trustBadges.map((item) => (
            <TrustBadge key={item.key} item={item} />
          ))}
        </div>
      </div>

      {/* ── Two-column review layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 lg:gap-0">
        {/* Left 40% — Business information */}
        <div className="lg:col-span-2 px-5 py-4 border-b lg:border-b-0 lg:border-r border-[#E2E8F0]">
          <h4 className={`${sectionTitle} mb-3`}>Business Information</h4>
          <div className="space-y-2.5">
            <DetailCell icon={Mail} label="Email" value={user.email} />
            <DetailCell icon={Phone} label="Phone" value={bd.phone} />
            <DetailCell icon={MapPin} label="City" value={bd.city} />
            <DetailCell icon={Hash} label="NTN" value={bd.taxId} mono />
          </div>
        </div>

        {/* Right 60% — Document review panel */}
        <div className="lg:col-span-3 px-5 py-4 bg-gradient-to-br from-[#F8FAFC] to-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <h4 className={sectionTitle}>Document Review</h4>
            {doc && (
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => onViewDocument(user)} className={btnGhost}>
                  <Eye size={14} />
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => doc && openSecureAdminUpload(doc.path)}
                  className={btnGhost}
                >
                  <ExternalLink size={14} />
                  Open
                </button>
                <button
                  type="button"
                  onClick={() => doc && downloadSecureAdminUpload(doc.path, doc.name)}
                  className={btnGhost}
                >
                  <Download size={14} />
                  Download
                </button>
              </div>
            )}
          </div>

          {doc ? (
            <div className="rounded-[16px] border border-[#E2E8F0] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                  <FileText size={20} className="text-[#10B981]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-[#0B1F3A] truncate">{doc.name}</p>
                  <p className="text-[13px] text-[#64748B] mt-0.5">
                    {doc.type}
                    <span className="text-slate-300 mx-1.5">·</span>
                    Uploaded {formatDate(getSubmittedDate(user))}
                  </p>
                </div>
              </div>
              <DocumentPreview doc={doc} filePath={doc.path} onExpand={() => onViewDocument(user)} />
            </div>
          ) : (
            <DocumentPlaceholder />
          )}
        </div>
      </div>
    </article>
  );
}

function DocumentPreview({ doc, filePath, onExpand }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    let objectUrl = null;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        objectUrl = await fetchSecureAdminUploadBlobUrl(filePath);
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
  }, [filePath]);

  const isPdf = doc.ext === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(doc.ext);

  if (loading) {
    return (
      <div className="h-64 sm:h-72 bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs font-medium text-[#64748B]">Loading document…</p>
        </div>
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div className="px-6 py-10 text-center bg-[#F8FAFC]">
        <FileWarning size={32} className="mx-auto text-slate-300 mb-3" />
        <p className="text-sm font-semibold text-[#0B1F3A]">Preview unavailable</p>
        <p className="text-xs text-[#64748B] mt-1">{error || 'Use Open or Download to view this document.'}</p>
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className="relative bg-[#102A43]/5">
        <iframe
          src={blobUrl}
          title={doc.name}
          className="w-full h-64 sm:h-72 border-0 bg-white"
        />
        <button
          type="button"
          onClick={onExpand}
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1F3A]/90 text-white text-xs font-semibold hover:bg-[#102A43] transition-colors shadow-lg"
        >
          <Eye size={13} />
          Full preview
        </button>
      </div>
    );
  }

  if (isImage) {
    return (
      <div className="relative bg-[#F8FAFC] p-3">
        <img
          src={blobUrl}
          alt={doc.name}
          className="w-full max-h-72 object-contain rounded-lg border border-[#E2E8F0] bg-white mx-auto cursor-pointer"
          onClick={onExpand}
        />
      </div>
    );
  }

  return (
    <div className="px-6 py-10 text-center bg-[#F8FAFC]">
      <FileWarning size={32} className="mx-auto text-slate-300 mb-3" />
      <p className="text-sm font-semibold text-[#0B1F3A]">Preview unavailable</p>
      <p className="text-xs text-[#64748B] mt-1">Use Open or Download to view this document.</p>
    </div>
  );
}

function DocumentPlaceholder() {
  return (
    <div className="rounded-[16px] border-2 border-dashed border-[#E2E8F0] bg-white px-6 py-12 text-center shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center">
        <FileText size={24} className="text-slate-300" />
      </div>
      <p className="text-sm font-semibold text-[#0B1F3A]">No document uploaded</p>
      <p className="text-[13px] text-[#64748B] mt-1">Business license has not been submitted yet.</p>
    </div>
  );
}

function CompanyAvatar({ user, name, isManufacturer }) {
  return (
    <UserAvatar
      user={user}
      name={name}
      size="md"
      rounded="md"
      variant={isManufacturer ? 'navy' : 'teal'}
      bordered={false}
    />
  );
}

function StatusBadge({ badge }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badge.dot}`} />
      {badge.label}
    </span>
  );
}

function RolePill({ role }) {
  const isMfr = role === 'manufacturer';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-[0.04em] text-white ${
        isMfr ? 'bg-[#0B1F3A]' : 'bg-[#0D9488]'
      }`}
    >
      {isMfr ? <Building2 size={10} /> : <Store size={10} />}
      {isMfr ? 'Manufacturer' : 'Wholesaler'}
    </span>
  );
}

function ConfidencePill({ label, tone }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${tone}`}>
      {label}
    </span>
  );
}

function MetricPill({ percent }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-[#E2E8F0] bg-white text-[#64748B]">
      <span className="font-bold text-[#0B1F3A]">{percent}%</span>
      <span className="ml-1">Complete</span>
    </span>
  );
}

function TrustBadge({ item }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border shadow-[0_2px_6px_rgba(15,23,42,0.04)] ${
        item.ok
          ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
          : 'bg-white text-slate-400 border-[#E2E8F0]'
      }`}
    >
      {item.ok ? (
        <CheckCircle size={13} className="text-[#10B981] shrink-0" />
      ) : (
        <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-200 shrink-0" />
      )}
      <span className={item.ok ? '' : 'line-through decoration-slate-300'}>{item.label}</span>
    </span>
  );
}

function DetailCell({ icon: Icon, label, value, mono }) {
  return (
    <div className="rounded-[14px] border border-[#E2E8F0] bg-white px-4 py-3.5 shadow-[0_4px_12px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_20px_rgba(15,23,42,0.07)] hover:-translate-y-px transition-all duration-150">
      <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#64748B] mb-1.5 flex items-center gap-2">
        <span className="w-6 h-6 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center shrink-0">
          <Icon size={12} className="text-[#64748B]" />
        </span>
        {label}
      </p>
      <p className={`text-[15px] text-[#0B1F3A] font-semibold truncate ${mono ? 'font-mono text-[14px]' : ''}`}>
        {value || '—'}
      </p>
    </div>
  );
}
