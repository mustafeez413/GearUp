'use client';

import { priorityCard, sectionTitle, btnAccent } from './escrowTheme';
import { Inbox, ArrowRightLeft, AlertTriangle, ChevronRight } from 'lucide-react';

function PriorityItem({ icon: Icon, title, count, priority, actionLabel, onAction, tone }) {
  if (count === 0) return null;

  return (
    <div className={priorityCard}>
      <div className="flex items-start gap-3 min-w-0">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tone}`}>
          <Icon size={18} strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-[#0F172A]">{title}</p>
            <span
              className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md ${
                priority === 'high' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
              }`}
            >
              {priority === 'high' ? 'High priority' : 'Action needed'}
            </span>
          </div>
          <p className="text-2xl font-semibold tabular-nums text-[#0F172A] mt-1">{count}</p>
          <p className="text-xs text-[#64748B] mt-0.5">Requires admin review</p>
        </div>
      </div>
      <button type="button" onClick={onAction} className={`${btnAccent} shrink-0`}>
        {actionLabel}
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

export default function EscrowPrioritySection({ pendingVerifications, pendingSettlements, activeDisputes, onNavigate }) {
  const total = pendingVerifications + pendingSettlements + activeDisputes;

  if (total === 0) {
    return (
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/50 px-5 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200 flex items-center justify-center text-emerald-600">
          ✓
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-900">All clear</p>
          <p className="text-xs text-emerald-700 mt-0.5">No pending verifications, settlements, or disputes need attention.</p>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Requires attention">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className={sectionTitle}>Requires Attention</h2>
        <span className="text-xs font-semibold text-[#64748B] tabular-nums">{total} item{total !== 1 ? 's' : ''}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        <PriorityItem
          icon={Inbox}
          title="Pending Verifications"
          count={pendingVerifications}
          priority={pendingVerifications > 3 ? 'high' : 'medium'}
          actionLabel="Review proofs"
          onAction={() => onNavigate('verifications')}
          tone="bg-amber-50 text-amber-700"
        />
        <PriorityItem
          icon={ArrowRightLeft}
          title="Pending Settlements"
          count={pendingSettlements}
          priority={pendingSettlements > 5 ? 'high' : 'medium'}
          actionLabel="Release funds"
          onAction={() => onNavigate('settlements')}
          tone="bg-blue-50 text-blue-700"
        />
        <PriorityItem
          icon={AlertTriangle}
          title="Open Disputes"
          count={activeDisputes}
          priority="high"
          actionLabel="Resolve"
          onAction={() => onNavigate('disputes')}
          tone="bg-red-50 text-red-700"
        />
      </div>
    </section>
  );
}
