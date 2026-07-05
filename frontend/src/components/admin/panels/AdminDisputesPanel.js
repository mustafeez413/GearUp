'use client';

import { useMemo, useState } from 'react';
import { Eye, X } from 'lucide-react';
import AdminFilterBar from '@/components/admin/ui/AdminFilterBar';
import AdminResponsiveTable, {
  AdminTableHead,
  AdminTableTh,
  AdminTableRow,
  AdminTableTd,
} from '@/components/admin/ui/AdminResponsiveTable';
import { EnterpriseKpiGrid, EnterpriseKpiTile } from '@/components/admin/ui/EnterpriseKpi';
import DisputeResolutionCard from '@/components/disputes/DisputeResolutionCard';
import {
  getDisputeStatusLabel,
  formatPKR,
  matchesSearch,
  inDateRange,
} from '@/lib/adminOperationsUtils';
import { AlertTriangle } from 'lucide-react';

const DEFAULT_FILTERS = {
  search: '',
  disputeId: '',
  buyer: '',
  seller: '',
  orderId: '',
  status: 'all',
  dateFrom: '',
  dateTo: '',
};

const STATUS_STYLES = {
  open: 'bg-amber-50 text-amber-800 border-amber-200',
  awaiting_seller: 'bg-amber-50 text-amber-800 border-amber-200',
  seller_responded: 'bg-blue-50 text-blue-800 border-blue-200',
  under_review: 'bg-blue-50 text-blue-800 border-blue-200',
  investigating: 'bg-blue-50 text-blue-800 border-blue-200',
  refunded: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  rejected: 'bg-red-50 text-red-800 border-red-200',
  resolved: 'bg-slate-50 text-slate-600 border-slate-200',
  closed: 'bg-slate-50 text-slate-600 border-slate-200',
};

function DisputeStatusBadge({ status }) {
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold border ${STATUS_STYLES[status] || STATUS_STYLES.open}`}>
      {getDisputeStatusLabel(status)}
    </span>
  );
}

export default function AdminDisputesPanel({ disputes = [], loading, onRefresh }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const stats = useMemo(() => ({
    open: disputes.filter((d) => d.status === 'open').length,
    underReview: disputes.filter((d) => ['under_review', 'investigating'].includes(d.status)).length,
    resolved: disputes.filter((d) => d.status === 'resolved' || d.status === 'closed').length,
    refunded: disputes.filter((d) => d.status === 'refunded').length,
    rejected: disputes.filter((d) => d.status === 'rejected').length,
  }), [disputes]);

  const filtered = useMemo(() => {
    return disputes.filter((d) => {
      if (filters.status !== 'all' && d.status !== filters.status) return false;
      if (filters.disputeId && !String(d._id).toLowerCase().includes(filters.disputeId.toLowerCase())) return false;
      if (filters.buyer && !String(d.buyer?.name || '').toLowerCase().includes(filters.buyer.toLowerCase())) return false;
      if (filters.seller && !String(d.seller?.name || '').toLowerCase().includes(filters.seller.toLowerCase())) return false;
      if (filters.orderId && !String(d.order?._id || d.order || '').toLowerCase().includes(filters.orderId.toLowerCase())) return false;
      if (!inDateRange(d.createdAt, filters.dateFrom, filters.dateTo)) return false;

      return matchesSearch(filters.search, [
        d._id,
        d.buyer?.name,
        d.seller?.name,
        d.order?._id,
        d.reason,
        getDisputeStatusLabel(d.status),
      ]);
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [disputes, filters]);

  return (
    <div className="space-y-6 pb-12">
      <EnterpriseKpiGrid cols="grid-cols-2 lg:grid-cols-5">
        <EnterpriseKpiTile label="Open Cases" value={stats.open} icon={AlertTriangle} variant="warning" />
        <EnterpriseKpiTile label="Under Review" value={stats.underReview} icon={AlertTriangle} />
        <EnterpriseKpiTile label="Resolved" value={stats.resolved} icon={AlertTriangle} variant="success" />
        <EnterpriseKpiTile label="Refunded" value={stats.refunded} icon={AlertTriangle} />
        <EnterpriseKpiTile label="Rejected" value={stats.rejected} icon={AlertTriangle} variant="warning" />
      </EnterpriseKpiGrid>

      <AdminFilterBar
        search={filters.search}
        onSearchChange={(v) => setFilter('search', v)}
        searchPlaceholder="Search disputes, parties, orders…"
        onReset={() => setFilters(DEFAULT_FILTERS)}
        fields={[
          { id: 'disputeId', label: 'Dispute ID', value: filters.disputeId, onChange: (v) => setFilter('disputeId', v) },
          { id: 'buyer', label: 'Buyer', value: filters.buyer, onChange: (v) => setFilter('buyer', v) },
          { id: 'seller', label: 'Seller', value: filters.seller, onChange: (v) => setFilter('seller', v) },
          { id: 'orderId', label: 'Order ID', value: filters.orderId, onChange: (v) => setFilter('orderId', v) },
          {
            id: 'status',
            label: 'Status',
            type: 'select',
            value: filters.status,
            onChange: (v) => setFilter('status', v),
            options: [
              { value: 'all', label: 'All Statuses' },
              { value: 'open', label: 'Open' },
              { value: 'under_review', label: 'Under Review' },
              { value: 'awaiting_seller', label: 'Waiting Seller Response' },
              { value: 'seller_responded', label: 'Waiting Buyer Response' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'refunded', label: 'Refunded' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'closed', label: 'Closed' },
            ],
          },
          { id: 'dateFrom', label: 'Date From', type: 'date', value: filters.dateFrom, onChange: (v) => setFilter('dateFrom', v) },
          { id: 'dateTo', label: 'Date To', type: 'date', value: filters.dateTo, onChange: (v) => setFilter('dateTo', v) },
        ]}
      />

      {loading ? (
        <p className="text-slate-400 text-sm">Loading disputes…</p>
      ) : (
        <AdminResponsiveTable
          isEmpty={filtered.length === 0}
          emptyMessage="No disputes match your filters."
        >
          <AdminTableHead>
            <AdminTableTh>Dispute ID</AdminTableTh>
            <AdminTableTh>Order ID</AdminTableTh>
            <AdminTableTh>Buyer</AdminTableTh>
            <AdminTableTh>Seller</AdminTableTh>
            <AdminTableTh align="right">Amount</AdminTableTh>
            <AdminTableTh>Status</AdminTableTh>
            <AdminTableTh>Created</AdminTableTh>
            <AdminTableTh align="center">Actions</AdminTableTh>
          </AdminTableHead>
          <tbody>
            {filtered.map((d) => (
              <AdminTableRow key={d._id}>
                <AdminTableTd mono>#{String(d._id).slice(-6).toUpperCase()}</AdminTableTd>
                <AdminTableTd mono>#{String(d.order?._id || d.order || '').slice(-6).toUpperCase()}</AdminTableTd>
                <AdminTableTd>{d.buyer?.name || '—'}</AdminTableTd>
                <AdminTableTd>{d.seller?.name || '—'}</AdminTableTd>
                <AdminTableTd align="right">
                  <span className="font-semibold tabular-nums">{formatPKR(d.refundAmount || 0)}</span>
                </AdminTableTd>
                <AdminTableTd><DisputeStatusBadge status={d.status} /></AdminTableTd>
                <AdminTableTd className="text-[#64748B] whitespace-nowrap">
                  {new Date(d.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </AdminTableTd>
                <AdminTableTd align="center">
                  <button
                    type="button"
                    onClick={() => setSelectedDispute(d)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] border border-[#E2E8F0] bg-white text-[12px] font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
                  >
                    <Eye size={14} /> View Details
                  </button>
                </AdminTableTd>
              </AdminTableRow>
            ))}
          </tbody>
        </AdminResponsiveTable>
      )}

      {selectedDispute && (
        <DisputeDetailDrawer
          dispute={selectedDispute}
          onClose={() => setSelectedDispute(null)}
          onRefresh={() => {
            onRefresh?.();
            setSelectedDispute(null);
          }}
        />
      )}
    </div>
  );
}

function DisputeDetailDrawer({ dispute, onClose, onRefresh }) {
  return (
    <div className="fixed inset-0 z-[9998] flex justify-end">
      <button type="button" className="absolute inset-0 bg-[#0F172A]/50 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <div className="relative w-full max-w-[720px] h-full bg-[#F8FAFC] shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-[#E2E8F0] shrink-0">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Dispute Details</p>
            <h2 className="text-lg font-bold text-[#0F172A]">#{String(dispute._id).slice(-6).toUpperCase()}</h2>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC]" aria-label="Close drawer">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <DisputeResolutionCard dispute={dispute} role="admin" onRefresh={onRefresh} />
        </div>
      </div>
    </div>
  );
}
