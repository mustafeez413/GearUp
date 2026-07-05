'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { getApiBaseUrl } from '@/lib/api';
import toast from 'react-hot-toast';
import EscrowDashboardPanel from '@/components/admin/escrow/EscrowDashboardPanel';
import EscrowListPanel from '@/components/admin/escrow/EscrowListPanel';
import {
  heroShell,
  pageShell,
  tabShell,
  tabBtn,
  tabCountBadge,
} from '@/components/admin/escrow/escrowTheme';
import { mapEscrowAdminStatus } from '@/lib/adminOperationsUtils';
import { Shield, LayoutDashboard, Lock, CheckCircle, RotateCcw } from 'lucide-react';

function EscrowPageInner() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [escrowMetrics, setEscrowMetrics] = useState(null);
  const [operationsSummary, setOperationsSummary] = useState(null);
  const [walletEscrows, setWalletEscrows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const escrowRes = await fetch(`${getApiBaseUrl()}/api/wallet/admin/escrows`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const escrowData = await escrowRes.json();

      if (escrowData.success) {
        setWalletEscrows(escrowData.data || []);
        setEscrowMetrics(escrowData.metrics || null);
        setOperationsSummary(escrowData.operationsSummary || null);
      }
    } catch {
      toast.error('Failed to load escrow data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const counts = {
    active: escrowMetrics?.active ?? walletEscrows.filter((e) => mapEscrowAdminStatus(e.resolvedEscrowStatus || e.status) === 'Active').length,
    released: escrowMetrics?.released ?? walletEscrows.filter((e) => mapEscrowAdminStatus(e.resolvedEscrowStatus || e.status) === 'Released').length,
    refunded: operationsSummary?.refundedOrders ?? escrowMetrics?.refunded ?? walletEscrows.filter((e) => mapEscrowAdminStatus(e.resolvedEscrowStatus || e.status) === 'Refunded').length,
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'active', label: 'Active Escrows', icon: Lock, count: counts.active },
    { id: 'released', label: 'Released Escrows', icon: CheckCircle, count: counts.released },
    { id: 'refunded', label: 'Refunded To Buyer', icon: RotateCcw, count: counts.refunded },
  ];

  return (
    <div className={`${pageShell} max-w-[1400px] mx-auto px-6 pb-20`}>
      <section className={heroShell}>
        <div className="flex items-center gap-5">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shrink-0">
            <Shield className="text-slate-700 w-8 h-8" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Escrow Management</h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Monitor escrow funds, lifecycle status, and automatic settlement. Payment reviews and disputes are managed in their dedicated modules.
            </p>
          </div>
        </div>
      </section>

      <section className={tabShell}>
        <div className="flex gap-0 border-b border-[#E2E8F0] px-3 sm:px-4 overflow-x-auto" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={tabBtn(activeTab === tab.id)}
            >
              <tab.icon size={15} strokeWidth={2} className="shrink-0 opacity-70" />
              <span>{tab.label}</span>
              {tab.count > 0 && <span className={tabCountBadge}>{tab.count}</span>}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-[#F1F5F9] rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <EscrowDashboardPanel metrics={escrowMetrics} operationsSummary={operationsSummary} />
              )}
              {activeTab === 'active' && (
                <EscrowListPanel
                  title="Active Escrows"
                  escrows={walletEscrows}
                  statusFilter="Active"
                  refundedOrderIds={operationsSummary?.refundedOrderIds || []}
                  emptyMessage="No active escrows at this time."
                />
              )}
              {activeTab === 'released' && (
                <EscrowListPanel
                  title="Released Escrows"
                  escrows={walletEscrows}
                  statusFilter="Released"
                  refundedOrderIds={operationsSummary?.refundedOrderIds || []}
                  emptyMessage="No released escrows yet."
                />
              )}
              {activeTab === 'refunded' && (
                <EscrowListPanel
                  title="Refunded Orders (Escrow)"
                  escrows={walletEscrows}
                  statusFilter="Refunded"
                  refundedOrderIds={operationsSummary?.refundedOrderIds || []}
                  emptyMessage="No escrow records linked to refunded orders."
                />
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default function EnterpriseEscrowDashboard() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-sm text-[#64748B]">Loading escrow center…</div>}>
      <EscrowPageInner />
    </Suspense>
  );
}
