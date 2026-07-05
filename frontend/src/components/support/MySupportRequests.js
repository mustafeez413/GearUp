'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getApiBaseUrl } from '@/lib/api';
import PageShell from '@/components/dashboard/PageShell';
import PageHeader from '@/components/dashboard/PageHeader';
import Card from '@/components/common/Card';
import { MessageSquare, Calendar, Mail, Building2, Clock, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

function StatusBadge({ status }) {
  const styles = {
    open: 'bg-amber-50 text-amber-700 border-amber-200',
    in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
    replied: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    closed: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  const labels = {
    open: 'Open',
    in_progress: 'In Progress',
    replied: 'Replied',
    closed: 'Closed',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
        styles[status] || styles.open
      }`}
    >
      {labels[status] || 'Open'}
    </span>
  );
}

export default function MySupportRequests({ contactHref = '/contact' }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${getApiBaseUrl()}/api/contact/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setTickets(data.data || []);
      } else {
        toast.error(data.error || 'Could not load support requests');
      }
    } catch {
      toast.error('Failed to load support requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return (
    <PageShell>
      <PageHeader
        title="My Support Requests"
        subtitle="Track your support submissions and read replies from the GearUp team."
        actions={
          <Link
            href={contactHref}
            className="inline-flex items-center gap-2 rounded-[12px] bg-[#00A878] px-4 py-2.5 text-[13px] font-bold text-white hover:bg-[#009166] transition-colors"
          >
            <Plus size={16} />
            New Request
          </Link>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 animate-pulse">
          <div className="h-40 rounded-[18px] bg-[#F8FAFC] border border-[#E5E7EB]" />
          <div className="h-40 rounded-[18px] bg-[#F8FAFC] border border-[#E5E7EB]" />
        </div>
      ) : tickets.length === 0 ? (
        <Card className="p-10 text-center">
          <MessageSquare size={32} className="mx-auto text-[#94A3B8] mb-4" />
          <h3 className="text-[18px] font-bold text-[#0F172A] mb-2">No support requests yet</h3>
          <p className="text-[14px] text-[#64748B] mb-6">
            When you contact support, your requests and admin replies will appear here.
          </p>
          <Link
            href={contactHref}
            className="inline-flex items-center gap-2 rounded-[12px] bg-[#00A878] px-5 py-3 text-[13px] font-bold text-white hover:bg-[#009166]"
          >
            Contact Support
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => {
            const isExpanded = expandedId === ticket._id;
            const latestReply =
              ticket.replies?.length > 0
                ? ticket.replies[ticket.replies.length - 1]
                : ticket.latestReply;

            return (
              <Card key={ticket._id} className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : ticket._id)}
                  className="w-full text-left p-5 sm:p-6 hover:bg-[#F8FAFC] transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="text-[14px] font-bold text-[#0F172A]">
                          {ticket.ticketId ||
                            `SUP-${String(ticket._id).slice(-6).toUpperCase()}`}
                        </span>
                        <StatusBadge status={ticket.status || (ticket.isReplied ? 'replied' : 'open')} />
                        {ticket.category && (
                          <span className="text-[11px] font-bold uppercase tracking-wide text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
                            {ticket.category}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-[12px] text-[#64748B]">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar size={13} />
                          {new Date(ticket.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Mail size={13} />
                          {ticket.subject || ticket.type}
                        </span>
                      </div>
                    </div>
                    <div className="text-[13px] font-semibold text-[#00A878]">
                      {isExpanded ? 'Hide details' : 'View details'}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-[#E5E7EB] px-5 sm:px-6 pb-6 pt-5 space-y-5">
                    {ticket.company && (
                      <div className="flex items-center gap-2 text-[13px] text-[#64748B]">
                        <Building2 size={14} />
                        {ticket.company}
                      </div>
                    )}

                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-2">
                        Original Message
                      </div>
                      <div className="rounded-[14px] border border-[#E5E7EB] bg-[#F8FAFC] p-4 text-[14px] leading-relaxed text-[#334155] whitespace-pre-wrap">
                        {ticket.message}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-2">
                        Admin Reply
                      </div>
                      {latestReply ? (
                        <div className="rounded-[14px] border border-emerald-100 bg-emerald-50/60 p-4">
                          <div className="flex items-center gap-2 text-[12px] font-semibold text-emerald-700 mb-2">
                            <Clock size={13} />
                            {latestReply.adminName || 'GearUp Support Team'} ·{' '}
                            {new Date(latestReply.createdAt).toLocaleString('en-GB')}
                          </div>
                          <p className="text-[14px] leading-relaxed text-[#334155] whitespace-pre-wrap">
                            {latestReply.message}
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-[14px] border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-4 py-5 text-[14px] font-medium text-[#64748B]">
                          Waiting for Support Team
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
