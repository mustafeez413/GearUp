'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getApiBaseUrl } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  tableWrap,
  tableHead,
  tableRow,
  sectionTitle,
  btnPrimary,
  btnAccent,
  btnOutline,
  innerStatCard,
} from '@/components/admin/escrow/escrowTheme';
import {
  Search,
  Lock,
  CheckCircle,
  Clock,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Unlock,
  CalendarPlus,
  X,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  CircleDot,
  FileText,
  Activity,
} from 'lucide-react';

const HOLD_EXT_KEY = 'gearup_hold_extensions';
const PAGE_SIZE = 10;
const DEFAULT_HOLD_DAYS = 7;

const STATUS_META = {
  Pending: { label: 'Pending', tone: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-500' },
  Processing: { label: 'Processing', tone: 'bg-blue-50 text-blue-700 border-blue-100', dot: 'bg-blue-500' },
  Completed: { label: 'Completed', tone: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500' },
  Failed: { label: 'Failed', tone: 'bg-red-50 text-red-700 border-red-100', dot: 'bg-red-500' },
  'On Hold': { label: 'On Hold', tone: 'bg-sky-50 text-sky-700 border-sky-100', dot: 'bg-sky-500' },
  Refunded: { label: 'Refunded', tone: 'bg-teal-50 text-teal-700 border-teal-100', dot: 'bg-teal-500' },
};

function getOrderId(order) {
  if (!order) return '';
  return typeof order === 'object' ? String(order._id || '') : String(order);
}

function orderShortRef(order) {
  const id = getOrderId(order);
  return id ? `#${id.slice(-6).toUpperCase()}` : '—';
}

function partyName(user, fallback = '—') {
  if (!user) return fallback;
  if (typeof user === 'object') {
    return user.businessDetails?.businessName || user.name || fallback;
  }
  return fallback;
}

function formatMoney(n) {
  return `PKR ${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function normalizeSettlementStatus(tx) {
  const s = tx?.status;
  if (s === 'Hold') return 'On Hold';
  if (s === 'Paid') return 'Processing';
  if (s === 'Refunded') return 'Refunded';
  if (STATUS_META[s]) return s;
  return s || 'Pending';
}

function readHoldExtensions() {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(HOLD_EXT_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeHoldExtension(id, payload) {
  const all = readHoldExtensions();
  all[id] = { ...payload, extendedAt: new Date().toISOString() };
  localStorage.setItem(HOLD_EXT_KEY, JSON.stringify(all));
  return all;
}

function getHoldReason(escrow) {
  const map = {
    PENDING: 'Awaiting payment verification',
    PAID: 'Payment received — escrow allocation in progress',
    IN_ESCROW: 'Funds secured in escrow pending release conditions',
    DELIVERED: 'Delivery confirmed — settlement release pending',
  };
  return map[escrow.status] || `Escrow status: ${escrow.status}`;
}

function defaultReleaseDate(createdAt) {
  const d = new Date(createdAt || Date.now());
  d.setDate(d.getDate() + DEFAULT_HOLD_DAYS);
  return d;
}

function getExpectedReleaseDate(id, createdAt, extensions) {
  const ext = extensions[id];
  if (ext?.extendedUntil) return new Date(ext.extendedUntil);
  return defaultReleaseDate(createdAt);
}

function settlementProgress(status) {
  const steps = ['Created', 'Verified', 'Processing', 'Released'];
  const map = {
    Pending: 1,
    'On Hold': 1,
    Processing: 2,
    Completed: 3,
    Failed: 3,
    Refunded: 3,
  };
  const idx = map[status] ?? 0;
  return { steps, activeIndex: idx };
}

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.Pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${meta.tone}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function Th({ children, align = 'left' }) {
  const alignClass = align === 'right' ? 'text-right' : 'text-left';
  return <th className={`px-5 py-3.5 ${alignClass} text-[11px] font-medium text-[#64748B]`}>{children}</th>;
}

function KpiCard({ label, value, icon: Icon, trend, trendUp }) {
  return (
    <div className={`${innerStatCard} transition-all duration-150 hover:shadow-sm hover:border-[#CBD5E1]`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-[#64748B]">{label}</p>
          <p className="text-xl sm:text-2xl font-semibold tabular-nums text-[#0F172A] mt-2">{value}</p>
          {trend && (
            <p className={`inline-flex items-center gap-1 text-[11px] font-medium mt-2 ${trendUp ? 'text-emerald-600' : 'text-[#64748B]'}`}>
              {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {trend}
            </p>
          )}
        </div>
        <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center shrink-0">
          <Icon size={18} className="text-[#64748B]" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-[#F1F5F9] rounded-xl" />
        ))}
      </div>
      <div className="h-12 bg-[#F1F5F9] rounded-xl" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 bg-[#F1F5F9] rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function EmptyBlock({ icon: Icon, title, description }) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]/50 px-6 py-12 text-center">
      <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center">
        <Icon size={22} className="text-[#94A3B8]" />
      </div>
      <p className="text-sm font-semibold text-[#0F172A]">{title}</p>
      <p className="text-sm text-[#64748B] mt-1.5 max-w-md mx-auto">{description}</p>
    </div>
  );
}

function SettlementDetailModal({ item, type, extensions, orders, onClose, onRelease, onExtend, releasing }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!item || !mounted) return null;

  const isSettlement = type === 'settlement';
  const status = isSettlement ? normalizeSettlementStatus(item) : item._holdDisplayStatus || 'On Hold';
  const { steps, activeIndex } = settlementProgress(status);

  const orderId = isSettlement ? getOrderId(item.order) : getOrderId(item.order);
  const linkedOrder = orders.find((o) => o._id === orderId);
  const paymentVerified =
    linkedOrder?.paymentStatus === 'verified' ||
    linkedOrder?.paymentStatus === 'Payment Verified' ||
    linkedOrder?.isPaymentVerified;

  const timeline = [];
  const created = isSettlement ? item.timestamp || item.createdAt : item.createdAt;
  timeline.push({ label: 'Hold / settlement created', at: created, tone: 'bg-[#F8FAFC]' });
  if (linkedOrder?.createdAt) {
    timeline.push({ label: 'Order placed', at: linkedOrder.createdAt, tone: 'bg-white' });
  }
  if (paymentVerified) {
    timeline.push({ label: 'Payment verified', at: linkedOrder?.updatedAt || created, tone: 'bg-emerald-50/80' });
  }
  if (item.status === 'Paid' || status === 'Processing') {
    timeline.push({ label: 'Processing payout', at: item.updatedAt, tone: 'bg-blue-50/80' });
  }
  if (status === 'Completed') {
    timeline.push({ label: 'Settlement released', at: item.updatedAt || item.paidDate, tone: 'bg-emerald-50/80' });
  }
  if (item.releasedAt) {
    timeline.push({ label: 'Escrow released', at: item.releasedAt, tone: 'bg-emerald-50/80' });
  }
  const ext = extensions[isSettlement ? item._id : item._id];
  if (ext?.extendedUntil) {
    timeline.push({
      label: `Hold extended until ${formatDate(ext.extendedUntil)}${ext.reason ? ` — ${ext.reason}` : ''}`,
      at: ext.extendedAt,
      tone: 'bg-purple-50/80',
    });
  }

  const canRelease = isSettlement && item.status === 'Pending';

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4">
      <button type="button" className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-[2px]" onClick={onClose} aria-label="Close" />
      <div
        className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-xl overflow-hidden flex flex-col max-h-[min(92vh,880px)]"
        style={{ width: 'min(720px, calc(100vw - 24px))' }}
      >
        <div className="px-5 sm:px-6 py-4 border-b border-[#E2E8F0] flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              {isSettlement ? 'Settlement details' : 'Hold details'}
            </p>
            <h3 className="text-lg font-semibold text-[#0F172A] mt-1">{orderShortRef(item.order)}</h3>
            <div className="mt-2">
              <StatusBadge status={status} />
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-[#F8FAFC] text-[#64748B]">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 sm:px-6 py-5 space-y-6">
          {/* Progress tracker */}
          <div>
            <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-3">Settlement progress</p>
            <div className="flex items-center gap-1">
              {steps.map((step, i) => (
                <div key={step} className="flex-1 min-w-0">
                  <div className={`h-1.5 rounded-full ${i <= activeIndex ? 'bg-[#10B981]' : 'bg-[#E2E8F0]'}`} />
                  <p className={`text-[10px] mt-1.5 truncate ${i <= activeIndex ? 'text-[#0F172A] font-medium' : 'text-[#94A3B8]'}`}>
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Summary grid */}
          <div className="grid grid-cols-2 gap-3">
            <DetailCell label="Amount" value={formatMoney(isSettlement ? item.sellerAmount : item.amount)} />
            <DetailCell label="Gross" value={formatMoney(isSettlement ? item.totalAmount : item.order?.totalAmount || item.amount)} />
            <DetailCell label="Seller" value={partyName(isSettlement ? item.seller : item.seller, 'Seller')} />
            <DetailCell label="Buyer" value={partyName(isSettlement ? item.buyer : item.buyer, 'Buyer')} />
            <DetailCell label="Commission" value={formatMoney(item.deductedCommission || 0)} />
            <DetailCell
              label="Payment verification"
              value={paymentVerified ? 'Verified' : linkedOrder?.paymentStatus || 'Pending review'}
            />
            <DetailCell label="Reference" value={isSettlement ? String(item._id).slice(-8).toUpperCase() : orderShortRef(item.order)} />
            <DetailCell
              label="Expected release"
              value={formatDate(getExpectedReleaseDate(item._id, created, extensions))}
            />
          </div>

          {/* Timeline */}
          <div>
            <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-3">Activity timeline</p>
            <div className="space-y-0 border-l-2 border-[#E2E8F0] ml-2">
              {timeline.map((ev, i) => (
                <div key={`${ev.label}-${i}`} className="relative pl-5 pb-4 last:pb-0">
                  <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-[#10B981] ring-2 ring-white" />
                  <div className={`rounded-lg border border-[#E2E8F0] px-3 py-2.5 ${ev.tone}`}>
                    <p className="text-sm font-medium text-[#0F172A]">{ev.label}</p>
                    <p className="text-[11px] text-[#64748B] mt-0.5 tabular-nums">{formatDateTime(ev.at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 sm:px-6 py-4 border-t border-[#E2E8F0] bg-[#FAFBFC] flex flex-wrap gap-2 justify-end">
          <button type="button" className={btnOutline} onClick={() => onExtend(item, type)}>
            <CalendarPlus size={14} /> Extend hold
          </button>
          {canRelease && (
            <button type="button" className={btnAccent} disabled={releasing} onClick={() => onRelease(item._id)}>
              <Unlock size={14} /> {releasing ? 'Releasing…' : 'Release hold'}
            </button>
          )}
          <button type="button" className={btnPrimary} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

function DetailCell({ label, value }) {
  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-[#FAFBFC] px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#94A3B8]">{label}</p>
      <p className="text-sm font-medium text-[#0F172A] mt-1 break-words">{value}</p>
    </div>
  );
}

function ExtendHoldModal({ target, onClose, onSave }) {
  const [mounted, setMounted] = useState(false);
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    setMounted(true);
    if (target?.item) {
      const base = target.item.createdAt || target.item.timestamp || new Date();
      const d = defaultReleaseDate(base);
      d.setDate(d.getDate() + 7);
      setDate(d.toISOString().slice(0, 10));
    }
  }, [target]);

  if (!target || !mounted) return null;

  const content = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6">
      <button type="button" className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-[2px] transition-opacity" onClick={onClose} aria-label="Close" />
      <div className="relative bg-white rounded-[24px] border border-[#E2E8F0] shadow-2xl w-full max-w-[600px] flex flex-col animate-in fade-in zoom-in-[0.98] duration-200">
        
        {/* Header */}
        <div className="px-6 sm:px-8 py-6 border-b border-[#E2E8F0] flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[20px] font-bold text-[#0F172A] whitespace-nowrap">Extend Hold Period</h3>
            <p className="text-[14px] text-[#64748B] mt-1.5 leading-relaxed">
              Update the expected release date for order {orderShortRef(target.item.order)}. This is recorded for admin tracking and audit logs.
            </p>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 p-2 rounded-xl text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <label className="block w-full">
            <span className="block text-[13px] font-bold text-[#475569] mb-2">New expected release date</span>
            <div className="relative">
              <CalendarPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#FAFBFC] border border-[#E2E8F0] rounded-[14px] text-[15px] font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] focus:bg-white transition-all"
              />
            </div>
          </label>
          <label className="block w-full">
            <span className="block text-[13px] font-bold text-[#475569] mb-2">Reason for extension (optional)</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. Awaiting additional dispute review and evidence from the buyer."
              className="w-full px-4 py-3 bg-[#FAFBFC] border border-[#E2E8F0] rounded-[14px] text-[15px] text-[#0F172A] resize-none focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] focus:bg-white transition-all placeholder:text-[#94A3B8]"
            />
          </label>
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-8 py-5 border-t border-[#E2E8F0] bg-[#F8FAFC] rounded-b-[24px] flex justify-end gap-3">
          <button type="button" className={btnOutline} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={btnAccent}
            onClick={() => {
              if (!date) {
                toast.error('Select a release date');
                return;
              }
              onSave(target.item._id, { extendedUntil: new Date(date).toISOString(), reason: reason.trim() });
              onClose();
            }}
          >
            Save Extension
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

export default function SettlementsHoldsPanel({ transactions = [], walletEscrows = [], walletStats = null, orders = [], onRefresh, loading = false, embedded = false }) {
  const [section, setSection] = useState('settlements');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [holdPage, setHoldPage] = useState(1);
  const [detail, setDetail] = useState(null);
  const [extendTarget, setExtendTarget] = useState(null);
  const [extensions, setExtensions] = useState({});
  const [releasingId, setReleasingId] = useState(null);

  useEffect(() => {
    setExtensions(readHoldExtensions());
  }, []);

  const settlementRows = useMemo(() => {
    return transactions
      .filter((t) => t.type !== 'refund' && t.type !== 'chargeback')
      .map((t) => ({
        ...t,
        _displayStatus: normalizeSettlementStatus(t),
        _sortDate: new Date(t.timestamp || t.createdAt || 0).getTime(),
        _sortAmount: Number(t.sellerAmount) || 0,
      }));
  }, [transactions]);

  const activeHolds = useMemo(() => {
    const activeStatuses = ['PENDING', 'PAID', 'IN_ESCROW', 'DELIVERED'];
    return walletEscrows
      .filter((e) => activeStatuses.includes(e.status))
      .map((e) => ({
        ...e,
        _holdDisplayStatus: 'On Hold',
        _holdReason: getHoldReason(e),
        _expectedRelease: getExpectedReleaseDate(e._id, e.createdAt, extensions),
      }));
  }, [walletEscrows, extensions]);

  const kpis = useMemo(() => {
    const pending = settlementRows.filter((t) => t._displayStatus === 'Pending');
    const completed = settlementRows.filter((t) => t._displayStatus === 'Completed');
    const pendingAmount = pending.reduce((s, t) => s + (Number(t.sellerAmount) || 0), 0);
    const releasedAmount =
      walletStats?.totalReleasedFunds ??
      completed.reduce((s, t) => s + (Number(t.sellerAmount) || 0), 0);

    return {
      pendingCount: pending.length,
      pendingAmount,
      releasedAmount,
      activeHolds: activeHolds.length,
      completedCount: completed.length,
    };
  }, [settlementRows, activeHolds, walletStats]);

  const filteredSettlements = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = settlementRows;

    if (statusFilter !== 'all') {
      rows = rows.filter((t) => t._displayStatus === statusFilter);
    }

    if (q) {
      rows = rows.filter((t) => {
        const hay = [
          partyName(t.seller),
          partyName(t.buyer),
          orderShortRef(t.order),
          getOrderId(t.order),
          t._id,
          t.status,
        ]
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
    }

    rows = [...rows].sort((a, b) => {
      const av = sortKey === 'amount' ? a._sortAmount : a._sortDate;
      const bv = sortKey === 'amount' ? b._sortAmount : b._sortDate;
      return sortDir === 'asc' ? av - bv : bv - av;
    });

    return rows;
  }, [settlementRows, search, statusFilter, sortKey, sortDir]);

  const filteredHolds = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeHolds;
    return activeHolds.filter((h) => {
      const hay = [
        partyName(h.buyer),
        partyName(h.seller),
        orderShortRef(h.order),
        h._holdReason,
        h.status,
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [activeHolds, search]);

  const settlementPages = Math.max(1, Math.ceil(filteredSettlements.length / PAGE_SIZE));
  const holdPages = Math.max(1, Math.ceil(filteredHolds.length / PAGE_SIZE));
  const pagedSettlements = filteredSettlements.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pagedHolds = filteredHolds.slice((holdPage - 1) * PAGE_SIZE, holdPage * PAGE_SIZE);

  const recentActivity = useMemo(() => {
    const events = [];
    for (const t of settlementRows.slice(0, 30)) {
      events.push({
        id: t._id,
        label: `Settlement ${t._displayStatus.toLowerCase()} — ${orderShortRef(t.order)}`,
        at: t.updatedAt || t.timestamp || t.createdAt,
        status: t._displayStatus,
      });
    }
    for (const h of activeHolds.slice(0, 15)) {
      events.push({
        id: h._id,
        label: `Escrow hold active — ${orderShortRef(h.order)}`,
        at: h.updatedAt || h.createdAt,
        status: 'On Hold',
      });
    }
    return events.sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 8);
  }, [settlementRows, activeHolds]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const handleReleaseSettlement = useCallback(
    async (txId) => {
      if (!confirm('Release this settlement to the seller? This marks the transaction as completed.')) return;
      setReleasingId(txId);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${getApiBaseUrl()}/api/transactions/admin/settlements/${txId}/release`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          toast.success('Settlement released successfully');
          setDetail(null);
          onRefresh?.();
        } else {
          toast.error(data.error || 'Failed to release settlement');
        }
      } catch {
        toast.error('Connection error');
      } finally {
        setReleasingId(null);
      }
    },
    [onRefresh]
  );

  const handleReleaseHold = useCallback(
    async (hold) => {
      const orderId = getOrderId(hold.order);
      const sellerId = typeof hold.seller === 'object' ? hold.seller._id : hold.seller;
      const linked = transactions.find((t) => {
        const tOrder = getOrderId(t.order);
        const tSeller = typeof t.seller === 'object' ? t.seller._id : t.seller;
        return tOrder === orderId && String(tSeller) === String(sellerId);
      });

      if (linked?.status === 'Hold') {
        toast.error('Settlement is frozen due to an open dispute. Resolve the dispute first.');
        return;
      }
      if (linked?.status === 'Pending') {
        await handleReleaseSettlement(linked._id);
        return;
      }
      toast.error('No pending settlement linked to this hold. Escrow wallet releases follow the order delivery workflow.');
    },
    [transactions, handleReleaseSettlement]
  );

  const handleDownloadSettlement = (tx) => {
    downloadCsv(`settlement-${getOrderId(tx.order).slice(-6)}.csv`, [
      ['Field', 'Value'],
      ['Settlement ID', tx._id],
      ['Order', orderShortRef(tx.order)],
      ['Seller', partyName(tx.seller)],
      ['Buyer', partyName(tx.buyer)],
      ['Gross', tx.totalAmount],
      ['Commission', tx.deductedCommission],
      ['Net payout', tx.sellerAmount],
      ['Status', normalizeSettlementStatus(tx)],
      ['Created', formatDateTime(tx.timestamp || tx.createdAt)],
    ]);
    toast.success('Record downloaded');
  };

  const handleDownloadHold = (hold) => {
    downloadCsv(`hold-${getOrderId(hold.order).slice(-6)}.csv`, [
      ['Field', 'Value'],
      ['Escrow ID', hold._id],
      ['Order', orderShortRef(hold.order)],
      ['Buyer', partyName(hold.buyer)],
      ['Seller', partyName(hold.seller)],
      ['Amount', hold.amount],
      ['Status', hold.status],
      ['Hold reason', hold._holdReason],
      ['Hold date', formatDateTime(hold.createdAt)],
      ['Expected release', formatDate(hold._expectedRelease)],
    ]);
    toast.success('Record downloaded');
  };

  const handleSaveExtension = (id, payload) => {
    const next = writeHoldExtension(id, payload);
    setExtensions(next);
    toast.success('Hold period extended');
  };

  if (loading) return <PanelSkeleton />;

  const mainPanel = (
    <div className={embedded ? 'space-y-4' : 'xl:col-span-2 space-y-4'}>
          {/* Section toggle + filters */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="inline-flex rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-1">
              {[
                { id: 'settlements', label: 'Settlements', icon: FileText },
                { id: 'holds', label: 'Active Holds', icon: Lock },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSection(tab.id);
                    setPage(1);
                    setHoldPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    section === tab.id ? 'bg-white text-[#0F172A] shadow-sm border border-[#E2E8F0]' : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={15} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                    setHoldPage(1);
                  }}
                  placeholder="Search settlements or holds…"
                  className="w-full pl-9 pr-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/15 focus:border-[#10B981]"
                />
              </div>
              {section === 'settlements' && (
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#10B981]/15"
                >
                  <option value="all">All statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Completed">Completed</option>
                  <option value="Failed">Failed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              )}
            </div>
          </div>

          {section === 'settlements' ? (
            <>
              {filteredSettlements.length === 0 ? (
                <EmptyBlock
                  icon={FileText}
                  title="No settlements found"
                  description="Adjust your search or filters, or settlements will appear here when orders generate payout records."
                />
              ) : (
                <>
                  <div className={tableWrap}>
                    <table className="w-full min-w-[980px] text-left">
                      <thead className={tableHead}>
                        <tr>
                          <Th>
                            <button type="button" className="inline-flex items-center gap-1 hover:text-[#0F172A]" onClick={() => toggleSort('date')}>
                              Date <ArrowUpDown size={12} />
                            </button>
                          </Th>
                          <Th>Seller</Th>
                          <Th>Order</Th>
                          <Th>
                            <button type="button" className="inline-flex items-center gap-1 hover:text-[#0F172A]" onClick={() => toggleSort('amount')}>
                              Net payout <ArrowUpDown size={12} />
                            </button>
                          </Th>
                          <Th>Commission</Th>
                          <Th>Status</Th>
                          <Th align="right">Actions</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedSettlements.map((tx) => (
                          <tr key={tx._id} className={tableRow}>
                            <td className="px-5 py-4 text-[11px] text-[#64748B] tabular-nums whitespace-nowrap">
                              {formatDateTime(tx.timestamp || tx.createdAt)}
                            </td>
                            <td className="px-5 py-4">
                              <div className="text-sm font-medium text-[#0F172A]">{partyName(tx.seller, 'Seller')}</div>
                              <div className="text-[11px] text-[#64748B]">{tx.seller?.email || ''}</div>
                            </td>
                            <td className="px-5 py-4 font-mono text-xs text-[#64748B]">{orderShortRef(tx.order)}</td>
                            <td className="px-5 py-4 text-sm font-semibold tabular-nums text-[#0F172A]">{formatMoney(tx.sellerAmount)}</td>
                            <td className="px-5 py-4 text-sm tabular-nums text-[#10B981]">+{formatMoney(tx.deductedCommission)}</td>
                            <td className="px-5 py-4">
                              <StatusBadge status={tx._displayStatus} />
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                <button type="button" className={btnOutline} onClick={() => setDetail({ item: tx, type: 'settlement' })} title="View details">
                                  <Eye size={13} />
                                </button>
                                <button type="button" className={btnOutline} onClick={() => handleDownloadSettlement(tx)} title="Download record">
                                  <Download size={13} />
                                </button>
                                {tx.status === 'Pending' && (
                                  <button
                                    type="button"
                                    className={btnAccent}
                                    disabled={releasingId === tx._id}
                                    onClick={() => handleReleaseSettlement(tx._id)}
                                  >
                                    <Unlock size={12} /> {releasingId === tx._id ? '…' : 'Release'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination page={page} totalPages={settlementPages} total={filteredSettlements.length} onPage={setPage} />
                </>
              )}
            </>
          ) : (
            <>
              {filteredHolds.length === 0 ? (
                <EmptyBlock
                  icon={Lock}
                  title="No active holds"
                  description="Escrow holds appear here when buyer payments are secured pending release conditions."
                />
              ) : (
                <>
                  <div className={tableWrap}>
                    <table className="w-full min-w-[1020px] text-left">
                      <thead className={tableHead}>
                        <tr>
                          <Th>Hold date</Th>
                          <Th>Order</Th>
                          <Th>Buyer / Seller</Th>
                          <Th>Amount</Th>
                          <Th>Reason</Th>
                          <Th>Expected release</Th>
                          <Th align="right">Actions</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedHolds.map((hold) => (
                          <tr key={hold._id} className={tableRow}>
                            <td className="px-5 py-4 text-[11px] text-[#64748B] tabular-nums">{formatDateTime(hold.createdAt)}</td>
                            <td className="px-5 py-4 font-mono text-xs text-[#64748B]">{orderShortRef(hold.order)}</td>
                            <td className="px-5 py-4">
                              <div className="text-sm text-[#0F172A]">{partyName(hold.buyer, 'Buyer')}</div>
                              <div className="text-[11px] text-[#64748B]">→ {partyName(hold.seller, 'Seller')}</div>
                            </td>
                            <td className="px-5 py-4 text-sm font-semibold tabular-nums">{formatMoney(hold.amount)}</td>
                            <td className="px-5 py-4 text-xs text-[#64748B] max-w-[200px]">{hold._holdReason}</td>
                            <td className="px-5 py-4 text-xs tabular-nums text-[#0F172A]">{formatDate(hold._expectedRelease)}</td>
                            <td className="px-5 py-4">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                <button type="button" className={btnOutline} onClick={() => setDetail({ item: hold, type: 'hold' })}>
                                  <Eye size={13} />
                                </button>
                                <button type="button" className={btnOutline} onClick={() => setExtendTarget({ item: hold, type: 'hold' })}>
                                  <CalendarPlus size={13} />
                                </button>
                                <button type="button" className={btnOutline} onClick={() => handleDownloadHold(hold)}>
                                  <Download size={13} />
                                </button>
                                <button type="button" className={btnAccent} disabled={releasingId !== null} onClick={() => handleReleaseHold(hold)}>
                                  <Unlock size={12} /> Release
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination page={holdPage} totalPages={holdPages} total={filteredHolds.length} onPage={setHoldPage} />
                </>
              )}
            </>
          )}
    </div>
  );

  return (
    <div className="space-y-6 w-full min-w-0">
      {!embedded && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard label="Total Pending Settlements" value={kpis.pendingCount} icon={Clock} trend={formatMoney(kpis.pendingAmount)} trendUp={false} />
            <KpiCard label="Total Released Amount" value={formatMoney(kpis.releasedAmount)} icon={CheckCircle} trend="Platform escrow releases" trendUp />
            <KpiCard label="Active Holds" value={kpis.activeHolds} icon={Lock} trend={`${activeHolds.filter((h) => h.status === 'IN_ESCROW').length} in escrow`} trendUp={false} />
            <KpiCard label="Completed Settlements" value={kpis.completedCount} icon={ArrowRightLeft} trend="All time on this view" trendUp />
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-1 rounded-xl border border-[#E2E8F0] bg-white p-4 sm:p-5">
              <h3 className={`${sectionTitle} flex items-center gap-2 text-sm`}>
                <Activity size={16} className="text-[#64748B]" />
                Recent activity
              </h3>
              <div className="mt-4 space-y-3">
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-[#64748B]">No recent settlement activity.</p>
                ) : (
                  recentActivity.map((ev) => (
                    <div key={`${ev.id}-${ev.at}`} className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center shrink-0">
                        <CircleDot size={14} className="text-[#10B981]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-[#0F172A] leading-snug">{ev.label}</p>
                        <p className="text-[11px] text-[#94A3B8] mt-0.5 tabular-nums">{formatDateTime(ev.at)}</p>
                      </div>
                      <StatusBadge status={ev.status} />
                    </div>
                  ))
                )}
              </div>
            </div>
            {mainPanel}
          </div>
        </>
      )}
      {embedded && mainPanel}

      <SettlementDetailModal
        item={detail?.item}
        type={detail?.type}
        extensions={extensions}
        orders={orders}
        onClose={() => setDetail(null)}
        onRelease={handleReleaseSettlement}
        onExtend={(item, type) => setExtendTarget({ item, type })}
        releasing={releasingId === detail?.item?._id}
      />

      <ExtendHoldModal
        target={extendTarget}
        onClose={() => setExtendTarget(null)}
        onSave={handleSaveExtension}
      />
    </div>
  );
}

function Pagination({ page, totalPages, total, onPage }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      <p className="text-xs text-[#64748B]">
        Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button type="button" className={btnOutline} disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft size={14} />
        </button>
        <span className="text-xs font-medium text-[#0F172A] px-2 tabular-nums">
          {page} / {totalPages}
        </span>
        <button type="button" className={btnOutline} disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
