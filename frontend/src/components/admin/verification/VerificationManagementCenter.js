"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getApiBaseUrl } from '@/lib/api';
import {
  parseVerificationOverviewPayload,
  filterApplicants,
  getUniqueCities,
  PAGE_SIZE,
  getBusinessName,
} from '@/lib/verificationCenterUtils';
import VerificationApplicationCard from './VerificationApplicationCard';
import {
  ConfirmActionModal,
  RejectReasonModal,
  DocumentViewerModal,
  BusinessProfileModal,
} from './VerificationModals';
import {
  pageShell,
  cardInteractive,
  toolbarBase,
  inputToolbar,
  selectToolbar,
  sectionLabel,
} from './verificationTheme';
import toast from 'react-hot-toast';
import {
  Search,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  XCircle,
  Inbox,
  BarChart3,
} from 'lucide-react';

export default function VerificationManagementCenter() {
  const [stats, setStats] = useState({
    approved: 0,
    pending: 0,
    rejected: 0,
    totalApplications: 0,
    approvalRate: 0,
  });
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionId, setActionId] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [roleFilter, setRoleFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [page, setPage] = useState(1);

  const [confirmModal, setConfirmModal] = useState({ open: false, type: 'approve', user: null });
  const [rejectModal, setRejectModal] = useState({ open: false, user: null, reason: '', notes: '' });
  const [docModal, setDocModal] = useState({ open: false, user: null });
  const [profileModal, setProfileModal] = useState({ open: false, user: null });

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        setApplicants([]);
        setError('Session expired. Please sign in again.');
        return;
      }

      const res = await fetch(`${getApiBaseUrl()}/api/admin/verifications/overview`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.success) {
        setApplicants([]);
        setError(json.error || `Could not load verification data (${res.status}).`);
        return;
      }

      const overview = parseVerificationOverviewPayload(json.data);
      setStats(overview.stats);
      setApplicants(overview.applicants?.length ? overview.applicants : overview.pendingUsers);
    } catch {
      setApplicants([]);
      setError('Could not reach the server. Verification data is unavailable.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    const onFocus = () => fetchOverview();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchOverview]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, roleFilter, cityFilter, sortOrder]);

  const cities = useMemo(() => getUniqueCities(applicants), [applicants]);

  const filtered = useMemo(
    () => filterApplicants(applicants, { search, statusFilter, roleFilter, cityFilter, sortOrder }),
    [applicants, search, statusFilter, roleFilter, cityFilter, sortOrder]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const runVerify = async (userId, isVerified, rejectionReason) => {
    const normalizedId = userId != null ? String(userId).trim() : '';
    if (!normalizedId || normalizedId === 'undefined') {
      console.error('[Verification] Missing user id for approval/rejection');
      toast.error('Invalid verification request. Please refresh the page and try again.');
      return false;
    }

    setActionId(normalizedId);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Session expired. Please sign in again.');
        return false;
      }

      const response = await fetch(`${getApiBaseUrl()}/api/admin/users/${normalizedId}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          isVerified,
          rejectionReason: isVerified ? undefined : rejectionReason,
        }),
      });

      let data = {};
      try {
        data = await response.json();
      } catch (parseErr) {
        console.error('[Verification] Invalid JSON response:', parseErr);
        toast.error('Unexpected server response. Please try again.');
        return false;
      }

      if (!response.ok || !data?.success) {
        const message = data?.error || `Action failed (${response.status}).`;
        console.error('[Verification] API error:', { userId: normalizedId, isVerified, status: response.status, message });
        toast.error(message);
        return false;
      }

      toast.success(isVerified ? 'Verification approved' : 'Verification rejected');
      await fetchOverview();
      window.dispatchEvent(new Event('gearup-notifications-refresh'));
      return true;
    } catch (err) {
      console.error('[Verification] Network error:', err);
      toast.error('Network error. Please try again.');
      return false;
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <div className={pageShell}>
        <PageSkeleton />
      </div>
    );
  }

  const kpis = [
    {
      label: 'Pending Reviews',
      value: stats.pending,
      icon: Clock,
      accent: 'bg-[#F59E0B]',
      iconBg: 'bg-amber-50 text-[#F59E0B] ring-amber-100',
      valueClass: 'text-[#F59E0B]',
      hint: stats.pending > 0 ? 'Needs action' : 'Queue clear',
    },
    {
      label: 'Approved',
      value: stats.approved,
      icon: CheckCircle,
      accent: 'bg-[#10B981]',
      iconBg: 'bg-emerald-50 text-[#10B981] ring-emerald-100',
      valueClass: 'text-[#10B981]',
      hint: 'Verified businesses',
    },
    {
      label: 'Rejected',
      value: stats.rejected,
      icon: XCircle,
      accent: 'bg-[#EF4444]',
      iconBg: 'bg-red-50 text-[#EF4444] ring-red-100',
      valueClass: 'text-[#EF4444]',
      hint: 'Declined applications',
    },
    {
      label: 'Total Applications',
      value: stats.totalApplications,
      icon: Inbox,
      accent: 'bg-[#0B1F3A]',
      iconBg: 'bg-slate-100 text-[#0B1F3A] ring-slate-200',
      valueClass: 'text-[#0B1F3A]',
      hint: 'All time',
    },
    {
      label: 'Approval Rate',
      value: `${stats.approvalRate}%`,
      icon: BarChart3,
      accent: 'bg-[#0D9488]',
      iconBg: 'bg-teal-50 text-[#0D9488] ring-teal-100',
      valueClass: 'text-[#0D9488]',
      hint: 'Of processed apps',
    },
  ];

  return (
    <div className={pageShell}>
      <div className="space-y-6 w-full min-w-0">
        <header className="border-b border-[#E2E8F0] pb-4">
          <h1 className="text-xl font-semibold text-[#0F172A] tracking-tight">Business Verification Center</h1>
          <p className="text-sm text-[#64748B] mt-1">
            Review and approve manufacturer and wholesaler credentials.
          </p>
        </header>

        {error && (
          <div className="rounded-xl border border-red-200/80 bg-white px-4 py-3 text-sm font-medium text-[#EF4444] shadow-sm">
            {error}
          </div>
        )}

        <section aria-label="Verification metrics">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {kpis.map((kpi) => (
              <KpiCard key={kpi.label} {...kpi} />
            ))}
          </div>
        </section>

        <section aria-label="Search and filters">
          <div className={toolbarBase}>
            <div className="flex flex-col xl:flex-row xl:items-stretch">
              <div className="relative flex items-center min-w-0 border-b xl:border-b-0 xl:border-r border-slate-100 xl:w-[58%] xl:shrink-0">
                <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search business name, email, NTN, verification ID…"
                  className={inputToolbar}
                />
              </div>
              <div className="flex flex-wrap xl:flex-nowrap items-stretch flex-1 divide-y xl:divide-y-0 xl:divide-x divide-slate-100">
                <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'all', label: 'All status' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' },
                ]} />
                <FilterSelect label="Role" value={roleFilter} onChange={setRoleFilter} options={[
                  { value: 'all', label: 'All roles' },
                  { value: 'manufacturer', label: 'Manufacturer' },
                  { value: 'wholesaler', label: 'Wholesaler' },
                ]} />
                {cities.length > 0 && (
                  <FilterSelect label="City" value={cityFilter} onChange={setCityFilter} options={[
                    { value: 'all', label: 'All cities' },
                    ...cities.map((c) => ({ value: c, label: c })),
                  ]} />
                )}
                <FilterSelect label="Sort" value={sortOrder} onChange={setSortOrder} options={[
                  { value: 'newest', label: 'Newest first' },
                  { value: 'oldest', label: 'Oldest first' },
                ]} />
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Verification queue">
          <div className="flex items-center justify-between mb-4">
            <h2 className={sectionLabel}>
              Verification requests
              <span className="ml-2 normal-case tracking-normal text-[#0B1F3A] font-bold text-sm">{filtered.length}</span>
            </h2>
            {statusFilter === 'pending' && stats.pending > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-900 bg-white border border-amber-200/80 px-3 py-1 rounded-full shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse" />
                {stats.pending} awaiting review
              </span>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className={`${cardInteractive} px-8 py-14 text-center`}>
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm">
                <CheckCircle size={26} className="text-[#10B981]" />
              </div>
              <p className="text-base font-bold text-[#0B1F3A]">All caught up</p>
              <p className="text-sm text-[#64748B] mt-1.5 max-w-xs mx-auto">
                No verification requests match this view. Adjust filters or check back later.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-5">
                {paginated.map((user) => (
                  <VerificationApplicationCard
                    key={user._id}
                    user={user}
                    onApprove={(u) => setConfirmModal({ open: true, type: 'approve', user: u })}
                    onReject={(u) => setRejectModal({ open: true, user: u, reason: '', notes: '' })}
                    onViewDocument={(u) => setDocModal({ open: true, user: u })}
                    onViewProfile={(u) => setProfileModal({ open: true, user: u })}
                    actionId={actionId}
                  />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-8">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-[#64748B] shadow-sm hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 transition-all"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-semibold text-[#64748B] tabular-nums px-2">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-[#64748B] shadow-sm hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 transition-all"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        <ConfirmActionModal
          open={confirmModal.open}
          type={confirmModal.type}
          businessName={getBusinessName(confirmModal.user)}
          loading={Boolean(actionId)}
          onCancel={() => setConfirmModal({ open: false, type: 'approve', user: null })}
          onConfirm={async () => {
            if (!confirmModal.user?._id) {
              toast.error('Invalid verification request. Please refresh and try again.');
              return;
            }
            const ok = await runVerify(confirmModal.user._id, confirmModal.type === 'approve');
            if (ok) setConfirmModal({ open: false, type: 'approve', user: null });
          }}
        />

        <RejectReasonModal
          open={rejectModal.open}
          reason={rejectModal.reason}
          notes={rejectModal.notes}
          onReasonChange={(r) => setRejectModal((p) => ({ ...p, reason: r }))}
          onNotesChange={(n) => setRejectModal((p) => ({ ...p, notes: n }))}
          onCancel={() => setRejectModal({ open: false, user: null, reason: '', notes: '' })}
          loading={Boolean(actionId)}
          onConfirm={async () => {
            if (!rejectModal.user?._id) {
              toast.error('Invalid verification request. Please refresh and try again.');
              return;
            }
            const reason = rejectModal.reason === 'Other' ? rejectModal.notes : rejectModal.reason;
            const ok = await runVerify(rejectModal.user._id, false, reason);
            if (ok) setRejectModal({ open: false, user: null, reason: '', notes: '' });
          }}
        />

        <DocumentViewerModal open={docModal.open} user={docModal.user} onClose={() => setDocModal({ open: false, user: null })} />
        <BusinessProfileModal open={profileModal.open} user={profileModal.user} onClose={() => setProfileModal({ open: false, user: null })} />
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, accent, iconBg, valueClass, hint }) {
  return (
    <div className={`${cardInteractive} relative overflow-hidden`}>
      <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
      <div className="p-5 pt-6">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ring-1 ${iconBg}`}>
          <Icon size={18} strokeWidth={2} />
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#64748B]">{label}</p>
        <p className={`text-[1.75rem] font-bold tracking-[-0.03em] mt-2 tabular-nums leading-none ${valueClass}`}>
          {value}
        </p>
        <p className="text-[11px] text-slate-400 mt-2.5">{hint}</p>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="relative flex-1 xl:flex-none min-w-[128px]">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className={`w-full ${selectToolbar}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6 w-full min-w-0 animate-pulse">
      <div className="flex gap-4">
        <div className="w-11 h-11 bg-slate-200 rounded-xl" />
        <div className="space-y-2 flex-1">
          <div className="h-6 w-64 bg-slate-200 rounded-lg" />
          <div className="h-4 w-80 bg-slate-100 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-32 bg-white rounded-xl border border-slate-200/60" />
        ))}
      </div>
      <div className="h-14 bg-white rounded-xl border border-slate-200/60" />
      <div className="h-52 bg-white rounded-xl border border-slate-200/60" />
    </div>
  );
}
