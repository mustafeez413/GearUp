"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, CheckCircle2, XCircle, Megaphone, FileText, Banknote, Calendar, ShieldCheck, Box } from 'lucide-react';
import PageShell from '@/components/dashboard/PageShell';
import PageHeader from '@/components/dashboard/PageHeader';
import Card from '@/components/common/Card';
import { formatPKR } from '@/lib/financeUtils';
import { fetchCampaignById, approveCampaign, rejectCampaign } from '@/lib/advertisingApi';

export default function AdminAdvertisementDetailsPage({ params }) {
  const router = useRouter();
  const { id } = React.use(params);
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetchCampaignById(id);
        setAd(res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleApprove = async () => {
    try {
      setProcessing(true);
      await approveCampaign(ad._id);
      const res = await fetchCampaignById(id);
      setAd(res.data);
    } catch (e) {
      alert(e.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    try {
      setProcessing(true);
      await rejectCampaign(ad._id, rejectReason || 'Does not meet platform guidelines');
      setRejectId(null);
      const res = await fetchCampaignById(id);
      setAd(res.data);
    } catch (e) {
      alert(e.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <PageShell><div className="p-8 text-center text-sm font-bold text-slate-500">Loading details...</div></PageShell>;
  if (error || !ad) return <PageShell><div className="p-8 text-center text-sm font-bold text-red-500">{error || 'Campaign not found'}</div></PageShell>;

  const DetailItem = ({ label, value }) => (
    <div className="flex flex-col gap-1 py-2 border-b border-slate-100 last:border-0">
      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value || '—'}</span>
    </div>
  );

  return (
    <PageShell>
      <PageHeader
        title={`Advertisement Details`}
        subtitle={`ID: #${ad._id.slice(-6).toUpperCase()}`}
        actions={
          <Link href="/admin/advertisements" className="px-4 py-2 border border-slate-200 text-sm font-bold rounded-xl hover:border-emerald-500 hover:text-emerald-500 flex items-center gap-2">
            <ChevronLeft size={16} /> Back to Advertisements
          </Link>
        }
      />

      {ad.paymentStatus === 'paid' && ad.approvalStatus === 'pending_review' && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-bold text-amber-900">Campaign Requires Approval</p>
            <p className="text-sm text-amber-700 mt-1">This campaign has been paid for successfully and is waiting for your review.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              disabled={processing}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 size={16} /> Approve
            </button>
            <button
              onClick={() => setRejectId(ad._id)}
              disabled={processing}
              className="px-5 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-sm font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <XCircle size={16} /> Reject
            </button>
          </div>
        </div>
      )}

      {ad.approvalStatus === 'rejected' && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200">
          <p className="font-bold text-red-900 flex items-center gap-2"><XCircle size={16} /> Campaign Rejected</p>
          <p className="text-sm text-red-700 mt-1">Reason: {ad.rejectionReason}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="Product & Manufacturer">
          <div className="grid grid-cols-2 gap-6 mt-4">
            <div>
              <div className="flex items-center gap-2 mb-3 text-slate-700"><Box size={16} /> <span className="font-bold">Product</span></div>
              <DetailItem label="Product Name" value={ad.productId?.name} />
              <DetailItem label="Category" value={ad.productId?.category} />
              <DetailItem label="Base Price" value={formatPKR(ad.productId?.price)} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3 text-slate-700"><ShieldCheck size={16} /> <span className="font-bold">Manufacturer</span></div>
              <DetailItem label="Company Name" value={ad.manufacturerId?.name} />
              <DetailItem label="Email" value={ad.manufacturerId?.email} />
              <DetailItem label="Location" value={`${ad.manufacturerId?.businessDetails?.city || ''} ${ad.manufacturerId?.businessDetails?.country || ''}`} />
            </div>
          </div>
        </Card>

        <Card title="Campaign Details">
          <div className="grid grid-cols-2 gap-6 mt-4">
            <div>
              <div className="flex items-center gap-2 mb-3 text-slate-700"><Megaphone size={16} /> <span className="font-bold">Package</span></div>
              <DetailItem label="Package Plan" value={<span className="capitalize">{ad.plan}</span>} />
              <DetailItem label="Campaign Type" value={<span className="capitalize">{ad.campaignType?.replace('_', ' ')}</span>} />
              <DetailItem label="Total Cost" value={<span className="font-bold text-emerald-600">{formatPKR(ad.amountPaid || ad.budget)}</span>} />
              <DetailItem label="Campaign Status" value={<span className="capitalize">{ad.status}</span>} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3 text-slate-700"><Calendar size={16} /> <span className="font-bold">Dates</span></div>
              <DetailItem label="Start Date" value={ad.startDate ? new Date(ad.startDate).toLocaleDateString() : '—'} />
              <DetailItem label="End Date" value={ad.endDate ? new Date(ad.endDate).toLocaleDateString() : '—'} />
              <DetailItem label="Created At" value={new Date(ad.createdAt).toLocaleString()} />
            </div>
          </div>
        </Card>

        <Card title="Payment & Stripe Information">
          <div className="grid grid-cols-2 gap-6 mt-4">
            <div>
              <div className="flex items-center gap-2 mb-3 text-slate-700"><Banknote size={16} /> <span className="font-bold">Payment</span></div>
              <DetailItem label="Payment Status" value={
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${ad.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                  {ad.paymentStatus?.replace('_', ' ') || 'pending'}
                </span>
              } />
              <DetailItem label="Amount Paid" value={formatPKR(ad.amountPaid)} />
              <DetailItem label="Payment Date" value={ad.paidAt ? new Date(ad.paidAt).toLocaleString() : '—'} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3 text-slate-700"><FileText size={16} /> <span className="font-bold">Stripe Details</span></div>
              <DetailItem label="Payment Intent ID" value={ad.stripePaymentIntentId ? <span className="font-mono text-xs">{ad.stripePaymentIntentId}</span> : '—'} />
              <DetailItem label="Checkout Session ID" value={ad.stripeCheckoutSessionId ? <span className="font-mono text-xs">{ad.stripeCheckoutSessionId}</span> : '—'} />
            </div>
          </div>
        </Card>

        <Card title="Approval Workflow">
          <div className="mt-4 space-y-2">
            <DetailItem label="Approval Status" value={
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${ad.approvalStatus === 'approved' ? 'bg-emerald-100 text-emerald-700' : ad.approvalStatus === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                {ad.approvalStatus?.replace('_', ' ') || 'pending review'}
              </span>
            } />
            {ad.approvedBy && <DetailItem label="Approved By" value={ad.approvedBy.name} />}
            {ad.approvedAt && <DetailItem label="Approved At" value={new Date(ad.approvedAt).toLocaleString()} />}
            {ad.rejectedBy && <DetailItem label="Rejected By" value={ad.rejectedBy.name} />}
            {ad.rejectedAt && <DetailItem label="Rejected At" value={new Date(ad.rejectedAt).toLocaleString()} />}
            {ad.rejectionReason && <DetailItem label="Rejection Reason" value={ad.rejectionReason} />}
          </div>
        </Card>
      </div>

      {rejectId && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-bold text-lg mb-2">Reject Campaign</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (sent to manufacturer)"
              className="w-full h-24 p-3 border rounded-xl text-sm mb-4 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setRejectId(null)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">Cancel</button>
              <button type="button" disabled={processing || !rejectReason.trim()} onClick={handleReject} className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 disabled:opacity-50">Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
