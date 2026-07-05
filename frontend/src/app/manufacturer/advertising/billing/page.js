"use client";

import React, { useEffect, useState } from 'react';
import { Receipt } from 'lucide-react';
import PageShell from '@/components/dashboard/PageShell';
import PageHeader from '@/components/dashboard/PageHeader';
import Card from '@/components/common/Card';
import { formatPKR } from '@/lib/financeUtils';
import { formatAdDate } from '@/lib/adDateUtils';
import { fetchBillingHistory } from '@/lib/advertisingApi';

export default function BillingHistoryPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillingHistory()
      .then((res) => setPayments(res.data || []))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  }, []);

  const total = payments.reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <PageShell>
      <PageHeader title="Billing History" subtitle="Advertisement payments and campaign invoices" />

      <div className="dashboard-card p-4 mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-[#64748B]">Lifetime Ad Spend</p>
          <p className="text-2xl font-black text-[#0F172A]">{formatPKR(total)}</p>
        </div>
        <p className="text-sm text-[#64748B]">{payments.length} transactions</p>
      </div>

      <Card title="Payment Records" loading={loading}>
        {payments.length === 0 ? (
          <p className="text-sm text-[#64748B] py-8 text-center">No billing records yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] font-black uppercase text-[#94A3B8] border-b">
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Reference</th>
                  <th className="pb-3 pr-4">Plan</th>
                  <th className="pb-3 pr-4">Method</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.map((p) => (
                  <tr key={p._id}>
                    <td className="py-3 pr-4">{formatAdDate(p.createdAt)}</td>
                    <td className="py-3 pr-4 font-mono text-xs">{p.ledgerReference || p._id.slice(-8)}</td>
                    <td className="py-3 pr-4 capitalize">{p.plan}</td>
                    <td className="py-3 pr-4 capitalize">{p.paymentMethod?.replace('_', ' ')}</td>
                    <td className="py-3 pr-4 capitalize">{p.status}</td>
                    <td className="py-3 font-black text-[#00A878]">{formatPKR(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageShell>
  );
}
