'use client';

import { commandHero, btnPrimary, btnAccent, btnOutline } from './escrowTheme';
import { Inbox, ArrowRightLeft, AlertTriangle, Lock, CheckCircle, Scale, FileText } from 'lucide-react';

function LiveStat({ icon: Icon, label, value, tone, pulse }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tone}`}>
        <Icon size={16} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-[#64748B] truncate">{label}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-lg font-semibold tabular-nums text-[#0F172A]">{value}</p>
          {pulse && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" title="Needs attention" />}
        </div>
      </div>
    </div>
  );
}

export default function EscrowCommandHero({
  pendingVerifications,
  pendingSettlements,
  activeDisputes,
  escrowFunds,
  onNavigate,
}) {
  const quickActions = [
    { label: 'Verify Payments', icon: CheckCircle, tab: 'verifications', variant: 'primary' },
    { label: 'Release Funds', icon: ArrowRightLeft, tab: 'settlements', variant: 'accent' },
    { label: 'Review Disputes', icon: Scale, tab: 'disputes', variant: 'outline' },
    { label: 'View Ledger', icon: FileText, tab: 'transactions', variant: 'outline' },
  ];

  return (
    <section className={commandHero}>
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#10B981]">Admin command center</p>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#0F172A] tracking-tight mt-1">
            Enterprise Escrow Center
          </h1>
          <p className="text-sm text-[#64748B] mt-2 max-w-2xl leading-relaxed">
            Manage payment verification, settlements, escrow funds, and dispute resolution.
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5 pt-5 border-t border-[#F1F5F9]">
            <LiveStat
              icon={Inbox}
              label="Pending Verifications"
              value={pendingVerifications}
              tone="bg-amber-50 text-amber-700"
              pulse={pendingVerifications > 0}
            />
            <LiveStat
              icon={ArrowRightLeft}
              label="Pending Settlements"
              value={pendingSettlements}
              tone="bg-blue-50 text-blue-700"
              pulse={pendingSettlements > 0}
            />
            <LiveStat
              icon={AlertTriangle}
              label="Active Disputes"
              value={activeDisputes}
              tone="bg-red-50 text-red-700"
              pulse={activeDisputes > 0}
            />
            <LiveStat
              icon={Lock}
              label="Escrow Funds"
              value={escrowFunds}
              tone="bg-emerald-50 text-emerald-700"
              pulse={false}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:flex-col lg:min-w-[200px] shrink-0">
          {quickActions.map((action) => {
            const cls = action.variant === 'primary' ? btnPrimary : action.variant === 'accent' ? btnAccent : btnOutline;
            return (
              <button
                key={action.tab}
                type="button"
                onClick={() => onNavigate(action.tab)}
                className={`${cls} w-full sm:w-auto lg:w-full justify-center py-2.5`}
              >
                <action.icon size={14} />
                {action.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
