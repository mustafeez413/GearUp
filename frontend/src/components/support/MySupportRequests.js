'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getApiBaseUrl } from '@/lib/api';
import PageShell from '@/components/dashboard/PageShell';
import PageHeader from '@/components/dashboard/PageHeader';
import Card from '@/components/common/Card';
import {
  MessageSquare,
  Calendar,
  Mail,
  Clock,
  Plus,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Status config — covers existing and new statuses ─────────────────────────
const STATUS_CONFIG = {
  open:             { label: 'Open',              style: 'bg-amber-50 text-amber-700 border-amber-200' },
  in_progress:      { label: 'In Progress',       style: 'bg-blue-50 text-blue-700 border-blue-200' },
  replied:          { label: 'Replied',           style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  waiting_for_user: { label: 'Waiting for Reply', style: 'bg-purple-50 text-purple-700 border-purple-200' },
  resolved:         { label: 'Resolved',          style: 'bg-teal-50 text-teal-700 border-teal-200' },
  closed:           { label: 'Closed',            style: 'bg-slate-100 text-slate-600 border-slate-200' },
};

// User can reply when request is in any of these statuses
const ACTIVE_STATUSES = new Set(['open', 'in_progress', 'replied', 'waiting_for_user']);

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.open;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${cfg.style}`}>
      {cfg.label}
    </span>
  );
}

// ─── Conversation thread ───────────────────────────────────────────────────────
// Builds a chronological list from the original message + all replies.
// Old reply documents without a 'sender' field are treated as admin replies
// for full backward compatibility.
function buildThread(ticket) {
  const original = {
    id:        'original',
    sender:    'user',
    name:      ticket.name || 'You',
    roleLabel: 'Requester',
    message:   ticket.message,
    createdAt: ticket.createdAt,
  };

  const replies = (ticket.replies || []).map((reply, idx) => {
    const isUser = reply.sender === 'user';
    return {
      id:        reply._id || `reply-${idx}`,
      sender:    reply.sender || 'admin',
      name:      reply.adminName || (isUser ? ticket.name : 'GearUp Support'),
      roleLabel: isUser ? 'Requester' : 'GearUp Support',
      message:   reply.message,
      createdAt: reply.createdAt,
    };
  });

  return [original, ...replies].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );
}

function ConversationThread({ ticket }) {
  const thread = buildThread(ticket);

  return (
    <div className="space-y-3">
      {thread.map((msg) => {
        const isAdmin = msg.sender === 'admin';
        return (
          <div
            key={msg.id}
            className={`rounded-[14px] border p-4 ${
              isAdmin
                ? 'border-emerald-100 bg-emerald-50/60'
                : 'border-[#E5E7EB] bg-[#F8FAFC]'
            }`}
          >
            {/* Sender row */}
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
                    isAdmin
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {(msg.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-[#0F172A]">{msg.name}</span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wide ${
                      isAdmin ? 'text-emerald-600' : 'text-slate-500'
                    }`}
                  >
                    {msg.roleLabel}
                  </span>
                </div>
              </div>
              <span className="text-[11px] text-[#94A3B8] font-medium whitespace-nowrap">
                {new Date(msg.createdAt).toLocaleString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            {/* Message body */}
            <p className="text-[14px] leading-relaxed text-[#334155] whitespace-pre-wrap pl-9">
              {msg.message}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function MySupportRequests({ contactHref = '/contact' }) {
  const [tickets, setTickets]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [expandedId, setExpandedId]     = useState(null);
  const [replyText, setReplyText]       = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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

  const handleToggle = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
    setReplyText('');
  };

  const handleSendReply = async (ticketId) => {
    if (!replyText.trim()) {
      toast.error('Reply cannot be empty');
      return;
    }
    setIsSendingReply(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${getApiBaseUrl()}/api/contact/mine/${ticketId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: replyText.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Reply sent successfully');
        setReplyText('');
        await fetchTickets();
      } else {
        toast.error(data.error || 'Failed to send reply');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setIsSendingReply(false);
    }
  };

  // ── Client-side search + status filter ──────────────────────────────────────
  const filtered = tickets.filter((t) => {
    const effectiveStatus = t.status || (t.isReplied ? 'replied' : 'open');
    const matchesSearch =
      !search ||
      (t.ticketId || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.subject || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.type || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || effectiveStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <PageShell>
      <PageHeader
        title="My Support Requests"
        subtitle="Track your support submissions and continue the conversation with the GearUp team."
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

      {/* ── Search & filter bar (only shown when there are tickets) ── */}
      {!loading && tickets.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search by Request ID or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-[12px] border border-[#E5E7EB] bg-white text-[13px] text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#00A878] focus:ring-2 focus:ring-[#00A878]/10 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-[12px] border border-[#E5E7EB] bg-white px-3 py-2.5 text-[13px] font-semibold text-[#0F172A] outline-none focus:border-[#00A878] transition-all"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="replied">Replied</option>
            <option value="waiting_for_user">Waiting for Reply</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 animate-pulse">
          <div className="h-40 rounded-[18px] bg-[#F8FAFC] border border-[#E5E7EB]" />
          <div className="h-40 rounded-[18px] bg-[#F8FAFC] border border-[#E5E7EB]" />
        </div>
      ) : tickets.length === 0 ? (
        /* ── Empty state — no requests at all ── */
        <Card className="p-10 text-center">
          <MessageSquare size={32} className="mx-auto text-[#94A3B8] mb-4" />
          <h3 className="text-[18px] font-bold text-[#0F172A] mb-2">No support requests yet</h3>
          <p className="text-[14px] text-[#64748B] mb-6">
            When you contact support, your requests and replies will appear here.
          </p>
          <Link
            href={contactHref}
            className="inline-flex items-center gap-2 rounded-[12px] bg-[#00A878] px-5 py-3 text-[13px] font-bold text-white hover:bg-[#009166]"
          >
            Contact Support
          </Link>
        </Card>
      ) : filtered.length === 0 ? (
        /* ── Empty state — no results for current filter ── */
        <Card className="p-10 text-center">
          <Search size={32} className="mx-auto text-[#94A3B8] mb-4" />
          <h3 className="text-[18px] font-bold text-[#0F172A] mb-2">No requests found</h3>
          <p className="text-[14px] text-[#64748B]">Try adjusting your search or filter.</p>
        </Card>
      ) : (
        /* ── Request accordion list ── */
        <div className="space-y-4">
          {filtered.map((ticket) => {
            const isExpanded    = expandedId === ticket._id;
            const effectiveStatus = ticket.status || (ticket.isReplied ? 'replied' : 'open');
            const canReply      = ACTIVE_STATUSES.has(effectiveStatus);

            return (
              <Card key={ticket._id} className="overflow-hidden">
                {/* ── Collapsed header row ── */}
                <button
                  type="button"
                  onClick={() => handleToggle(ticket._id)}
                  className="w-full text-left p-5 sm:p-6 hover:bg-[#F8FAFC] transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="min-w-0">
                      {/* ID + badges */}
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="text-[14px] font-bold text-[#0F172A]">
                          {ticket.ticketId || `SUP-${String(ticket._id).slice(-6).toUpperCase()}`}
                        </span>
                        <StatusBadge status={effectiveStatus} />
                        {ticket.category && (
                          <span className="text-[11px] font-bold uppercase tracking-wide text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
                            {ticket.category}
                          </span>
                        )}
                      </div>
                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-4 text-[12px] text-[#64748B]">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar size={13} />
                          {new Date(ticket.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </span>
                        {ticket.updatedAt && ticket.updatedAt !== ticket.createdAt && (
                          <span className="inline-flex items-center gap-1.5">
                            <Clock size={13} />
                            Updated{' '}
                            {new Date(ticket.updatedAt).toLocaleDateString('en-GB', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5">
                          <Mail size={13} />
                          {ticket.subject || ticket.type}
                        </span>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#00A878] shrink-0">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      {isExpanded ? 'Hide details' : 'View details'}
                    </div>
                  </div>
                </button>

                {/* ── Expanded conversation panel ── */}
                {isExpanded && (
                  <div className="border-t border-[#E5E7EB] px-5 sm:px-6 pb-6 pt-5 space-y-5">
                    {/* Full chronological conversation thread */}
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-3">
                        Conversation
                      </div>
                      <ConversationThread ticket={ticket} />
                    </div>

                    {/* Reply box (active) or closed message */}
                    {canReply ? (
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-2">
                          Reply to this Request
                        </div>
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={4}
                          placeholder="Type your reply..."
                          className="w-full rounded-[14px] border border-[#E5E7EB] bg-white px-4 py-3 text-[14px] outline-none transition-all focus:border-[#00A878] focus:ring-4 focus:ring-[#00A878]/10 resize-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSendReply(ticket._id)}
                          disabled={isSendingReply}
                          className="mt-3 inline-flex items-center gap-2 rounded-[12px] bg-[#00A878] px-5 py-2.5 text-[13px] font-bold text-white hover:bg-[#009166] disabled:opacity-60 transition-colors"
                        >
                          {isSendingReply ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <Send size={15} />
                          )}
                          {isSendingReply ? 'Sending…' : 'Send Reply'}
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] font-medium text-slate-600">
                        {effectiveStatus === 'resolved'
                          ? 'This support request has been resolved and is no longer accepting replies.'
                          : 'This support request has been closed.'}
                      </div>
                    )}
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
