'use client';

import { useMemo, useState } from 'react';
import AdminFilterBar from '@/components/admin/ui/AdminFilterBar';
import AdminResponsiveTable, {
  AdminTableHead,
  AdminTableTh,
  AdminTableRow,
  AdminTableTd,
} from '@/components/admin/ui/AdminResponsiveTable';
import { tableWrap, tableRow, badge, sectionTitle } from './escrowTheme';
import { mapEscrowAdminStatus, formatPKR, matchesSearch, inDateRange, inAmountRange } from '@/lib/adminOperationsUtils';

const DEFAULT_FILTERS = {
  search: '',
  orderId: '',
  sellerName: '',
  buyerName: '',
  dateFrom: '',
  dateTo: '',
  amountMin: '',
  amountMax: '',
};

function EscrowStatusBadge({ status, orderRefunded = false }) {
  const mapped = mapEscrowAdminStatus(status, orderRefunded);
  const styles = {
    Active: 'bg-amber-50 text-amber-800 border-amber-200',
    Released: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    Refunded: 'bg-slate-100 text-slate-600 border-slate-200',
    Disputed: 'bg-red-50 text-red-800 border-red-200',
  };
  return (
    <span className={`${badge} normal-case ${styles[mapped] || styles.Active}`}>{mapped}</span>
  );
}

export default function EscrowListPanel({
  title,
  escrows = [],
  statusFilter,
  refundedOrderIds = [],
  emptyMessage = 'No escrow records found.',
}) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const filtered = useMemo(() => {
    return escrows
      .filter((e) => {
        const orderId = String(e.order?._id || e.order || '');
        const orderRefunded = refundedOrderIds.includes(orderId);
        const mapped = mapEscrowAdminStatus(e.resolvedEscrowStatus || e.status, orderRefunded);
        if (statusFilter === 'disputed') return mapped === 'Disputed' || e.status === 'DISPUTED';
        if (statusFilter === 'Refunded') return orderRefunded || mapped === 'Refunded';
        if (statusFilter && mapped !== statusFilter) return false;

        const amount = mapped === 'Refunded' ? 0 : (e.amount || 0);
        if (!inDateRange(e.createdAt, filters.dateFrom, filters.dateTo)) return false;
        if (!inAmountRange(amount, filters.amountMin, filters.amountMax)) return false;
        if (filters.orderId && !String(e.order?._id || e.order || '').toLowerCase().includes(filters.orderId.toLowerCase())) return false;
        if (filters.sellerName && !String(e.seller?.name || '').toLowerCase().includes(filters.sellerName.toLowerCase())) return false;
        if (filters.buyerName && !String(e.buyer?.name || '').toLowerCase().includes(filters.buyerName.toLowerCase())) return false;

        return matchesSearch(filters.search, [
          e._id,
          e.order?._id,
          e.seller?.name,
          e.buyer?.name,
          e.status,
        ]);
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [escrows, filters, statusFilter]);

  const displayAmount = (escrow) => {
    if (mapEscrowAdminStatus(escrow.resolvedEscrowStatus || escrow.status) === 'Refunded') return 0;
    return escrow.amount || 0;
  };

  return (
    <div className="space-y-5">
      <h2 className={sectionTitle}>{title}</h2>

      <AdminFilterBar
        search={filters.search}
        onSearchChange={(v) => setFilter('search', v)}
        searchPlaceholder="Search escrows, orders, parties…"
        onReset={() => setFilters(DEFAULT_FILTERS)}
        fields={[
          { id: 'orderId', label: 'Order ID', value: filters.orderId, onChange: (v) => setFilter('orderId', v) },
          { id: 'sellerName', label: 'Seller', value: filters.sellerName, onChange: (v) => setFilter('sellerName', v) },
          { id: 'buyerName', label: 'Buyer', value: filters.buyerName, onChange: (v) => setFilter('buyerName', v) },
          { id: 'dateFrom', label: 'Date From', type: 'date', value: filters.dateFrom, onChange: (v) => setFilter('dateFrom', v) },
          { id: 'dateTo', label: 'Date To', type: 'date', value: filters.dateTo, onChange: (v) => setFilter('dateTo', v) },
          { id: 'amountMin', label: 'Min Amount', type: 'number', value: filters.amountMin, onChange: (v) => setFilter('amountMin', v) },
          { id: 'amountMax', label: 'Max Amount', type: 'number', value: filters.amountMax, onChange: (v) => setFilter('amountMax', v) },
        ]}
      />

      <div className={tableWrap}>
        <AdminResponsiveTable isEmpty={filtered.length === 0} emptyMessage={emptyMessage}>
          <AdminTableHead>
            <AdminTableTh>Escrow ID</AdminTableTh>
            <AdminTableTh>Order ID</AdminTableTh>
            <AdminTableTh>Seller</AdminTableTh>
            <AdminTableTh>Buyer</AdminTableTh>
            <AdminTableTh align="right">Amount</AdminTableTh>
            <AdminTableTh>Status</AdminTableTh>
            <AdminTableTh>Created</AdminTableTh>
          </AdminTableHead>
          <tbody>
            {filtered.map((e) => (
              <AdminTableRow key={e._id} className={tableRow}>
                <AdminTableTd mono>#{String(e._id).slice(-6).toUpperCase()}</AdminTableTd>
                <AdminTableTd mono>#{String(e.order?._id || e.order || '').slice(-6).toUpperCase()}</AdminTableTd>
                <AdminTableTd>{e.seller?.name || '—'}</AdminTableTd>
                <AdminTableTd>{e.buyer?.name || '—'}</AdminTableTd>
                <AdminTableTd align="right">
                  <span className="font-semibold tabular-nums">{formatPKR(displayAmount(e))}</span>
                </AdminTableTd>
                <AdminTableTd>
                  <EscrowStatusBadge
                    status={e.resolvedEscrowStatus || e.status}
                    orderRefunded={refundedOrderIds.includes(String(e.order?._id || e.order || ''))}
                  />
                </AdminTableTd>
                <AdminTableTd className="text-[#64748B] whitespace-nowrap">
                  {new Date(e.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </AdminTableTd>
              </AdminTableRow>
            ))}
          </tbody>
        </AdminResponsiveTable>
      </div>
    </div>
  );
}
