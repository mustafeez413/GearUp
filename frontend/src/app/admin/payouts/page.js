'use client';

import { useState, useEffect, useMemo } from 'react';
import { getApiBaseUrl } from '@/lib/api';
import toast from 'react-hot-toast';
import { Banknote, Eye } from 'lucide-react';
import AdminPageShell from '@/components/admin/AdminPageShell';
import AdminFilterBar from '@/components/admin/ui/AdminFilterBar';
import AdminResponsiveTable, {
  AdminTableHead,
  AdminTableTh,
  AdminTableRow,
  AdminTableTd,
} from '@/components/admin/ui/AdminResponsiveTable';
import { EnterpriseKpiGrid, EnterpriseKpiTile } from '@/components/admin/ui/EnterpriseKpi';
import SellerPayoutReceiptModal from '@/components/admin/SellerPayoutReceiptModal';
import {
  PAYOUT_STATUS,
  normalizePayoutStatus,
  getPayoutStatusLabel,
  getPayoutDisplayAmounts,
  formatPKR,
  matchesSearch,
  inDateRange,
  inAmountRange,
} from '@/lib/adminOperationsUtils';

const DEFAULT_FILTERS = {
  search: '',
  payoutId: '',
  sellerName: '',
  orderId: '',
  status: 'all',
  dateFrom: '',
  dateTo: '',
  amountMin: '',
  amountMax: '',
};

function PayoutStatusBadge({ payout }) {
  const normalized = normalizePayoutStatus(payout.status, payout);
  const label = getPayoutStatusLabel(payout);
  const styles = {
    [PAYOUT_STATUS.HOLDING]: 'bg-amber-50 text-amber-800 border-amber-200',
    [PAYOUT_STATUS.APPROVED]: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    [PAYOUT_STATUS.REFUNDED]: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${styles[normalized] || styles[PAYOUT_STATUS.HOLDING]}`}>
      {label}
    </span>
  );
}

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState([]);
  const [payoutStats, setPayoutStats] = useState(null);
  const [operationsSummary, setOperationsSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const fetchPayouts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${getApiBaseUrl()}/api/admin/payouts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setPayouts(data.data || []);
        setPayoutStats(data.stats || null);
        setOperationsSummary(data.operationsSummary || null);
      } else {
        toast.error('Failed to load payouts');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const stats = useMemo(() => {
    const holding = payouts.filter((p) => normalizePayoutStatus(p.status, p) === PAYOUT_STATUS.HOLDING).length;
    const approved = payouts.filter((p) => normalizePayoutStatus(p.status, p) === PAYOUT_STATUS.APPROVED).length;
    const payoutRefunded = payouts.filter((p) => normalizePayoutStatus(p.status, p) === PAYOUT_STATUS.REFUNDED).length;
    const totalNet = payouts.reduce((sum, p) => sum + getPayoutDisplayAmounts(p).net, 0);
    const refunded = operationsSummary?.refundedOrders ?? payoutStats?.refunded ?? payoutRefunded;
    return payoutStats
      ? { ...payoutStats, refunded, totalNet }
      : { holding, approved, refunded, total: payouts.length, totalNet };
  }, [payouts, payoutStats, operationsSummary]);

  const filteredPayouts = useMemo(() => {
    return payouts.filter((p) => {
      const status = normalizePayoutStatus(p.status, p);
      const amounts = getPayoutDisplayAmounts(p);
      const createdAt = p.createdAt;

      const orderRefunded = operationsSummary?.refundedOrderIds?.includes(String(p.order?._id || p.order || ''));
      const effectiveStatus = orderRefunded ? PAYOUT_STATUS.REFUNDED : status;
      if (filters.status !== 'all' && effectiveStatus !== filters.status) return false;
      if (filters.payoutId && !String(p._id).toLowerCase().includes(filters.payoutId.toLowerCase())) return false;
      if (filters.sellerName && !String(p.seller?.name || '').toLowerCase().includes(filters.sellerName.toLowerCase())) return false;
      if (filters.orderId && !String(p.order?._id || '').toLowerCase().includes(filters.orderId.toLowerCase())) return false;
      if (!inDateRange(createdAt, filters.dateFrom, filters.dateTo)) return false;
      if (!inAmountRange(amounts.net, filters.amountMin, filters.amountMax)) return false;

      return matchesSearch(filters.search, [
        p._id,
        p.seller?.name,
        p.order?._id,
        status,
        p.sellerTransactionId,
        p.buyerTransactionId,
      ]);
    });
  }, [payouts, filters]);

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto w-full px-6">
        <div className="h-96 rounded-2xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto w-full px-6 space-y-6 pb-20">
      <AdminPageShell
        title="Seller Payouts"
        description="Track automatic settlement status for seller payouts. Funds are released automatically after delivery confirmation."
        align="center"
      />

      <EnterpriseKpiGrid cols="grid-cols-2 lg:grid-cols-5">
        <EnterpriseKpiTile label="Total Payouts" value={stats.total} icon={Banknote} />
        <EnterpriseKpiTile label="Holding" value={stats.holding} icon={Banknote} variant="warning" />
        <EnterpriseKpiTile label="Approved" value={stats.approved} icon={Banknote} variant="success" />
        <EnterpriseKpiTile label="Refunded To Buyer" value={stats.refunded} icon={Banknote} />
        <EnterpriseKpiTile label="Net Payable" value={formatPKR(stats.totalNet)} icon={Banknote} featured />
      </EnterpriseKpiGrid>

      <AdminFilterBar
        search={filters.search}
        onSearchChange={(v) => setFilter('search', v)}
        searchPlaceholder="Search payouts, sellers, orders…"
        onReset={() => setFilters(DEFAULT_FILTERS)}
        fields={[
          { id: 'payoutId', label: 'Payout ID', value: filters.payoutId, onChange: (v) => setFilter('payoutId', v) },
          { id: 'sellerName', label: 'Seller Name', value: filters.sellerName, onChange: (v) => setFilter('sellerName', v) },
          { id: 'orderId', label: 'Order ID', value: filters.orderId, onChange: (v) => setFilter('orderId', v) },
          {
            id: 'status',
            label: 'Status',
            type: 'select',
            value: filters.status,
            onChange: (v) => setFilter('status', v),
            options: [
              { value: 'all', label: 'All Statuses' },
              { value: 'Holding', label: 'Holding' },
              { value: 'Approved', label: 'Approved' },
              { value: 'Refunded', label: 'Refunded To Buyer' },
            ],
          },
          { id: 'dateFrom', label: 'Date From', type: 'date', value: filters.dateFrom, onChange: (v) => setFilter('dateFrom', v) },
          { id: 'dateTo', label: 'Date To', type: 'date', value: filters.dateTo, onChange: (v) => setFilter('dateTo', v) },
          { id: 'amountMin', label: 'Min Net', type: 'number', value: filters.amountMin, onChange: (v) => setFilter('amountMin', v) },
          { id: 'amountMax', label: 'Max Net', type: 'number', value: filters.amountMax, onChange: (v) => setFilter('amountMax', v) },
        ]}
      />

      <AdminResponsiveTable
        isEmpty={filteredPayouts.length === 0}
        emptyMessage="No payouts match your filters."
      >
        <AdminTableHead>
          <AdminTableTh>Payout ID</AdminTableTh>
          <AdminTableTh>Seller</AdminTableTh>
          <AdminTableTh>Order ID</AdminTableTh>
          <AdminTableTh align="right">Gross</AdminTableTh>
          <AdminTableTh align="right">Commission</AdminTableTh>
          <AdminTableTh align="right">Net Payable</AdminTableTh>
          <AdminTableTh>Status</AdminTableTh>
          <AdminTableTh align="center">Actions</AdminTableTh>
        </AdminTableHead>
        <tbody>
          {filteredPayouts.map((p) => {
            const amounts = getPayoutDisplayAmounts(p);
            return (
              <AdminTableRow key={p._id}>
                <AdminTableTd mono>
                  <span className="font-bold">#{p._id.slice(-8).toUpperCase()}</span>
                </AdminTableTd>
                <AdminTableTd>
                  <span className="font-semibold">{p.seller?.name || 'Unknown'}</span>
                </AdminTableTd>
                <AdminTableTd mono>
                  #{p.order?._id?.slice(-8) || 'N/A'}
                </AdminTableTd>
                <AdminTableTd align="right">
                  <span className="tabular-nums">{formatPKR(amounts.gross)}</span>
                </AdminTableTd>
                <AdminTableTd align="right">
                  <span className="tabular-nums text-rose-600">- {formatPKR(amounts.commission)}</span>
                </AdminTableTd>
                <AdminTableTd align="right">
                  <span className="font-bold tabular-nums text-[#10B981]">{formatPKR(amounts.net)}</span>
                </AdminTableTd>
                <AdminTableTd>
                  <PayoutStatusBadge
                    payout={{
                      ...p,
                      resolvedPayoutStatus: operationsSummary?.refundedOrderIds?.includes(String(p.order?._id || p.order || ''))
                        ? PAYOUT_STATUS.REFUNDED
                        : p.resolvedPayoutStatus,
                    }}
                  />
                </AdminTableTd>
                <AdminTableTd align="center">
                  <button
                    type="button"
                    onClick={() => setSelectedPayout(p)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] text-[12px] font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
                  >
                    <Eye size={14} /> Details
                  </button>
                </AdminTableTd>
              </AdminTableRow>
            );
          })}
        </tbody>
      </AdminResponsiveTable>

      <SellerPayoutReceiptModal
        payout={selectedPayout}
        onClose={() => setSelectedPayout(null)}
      />
    </div>
  );
}
