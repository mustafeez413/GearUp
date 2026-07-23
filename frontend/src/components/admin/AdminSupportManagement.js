'use client';

import { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl } from '@/lib/api';
import AdminPageShell from '@/components/admin/AdminPageShell';
import {
  MessageSquare,
  Eye,
  Reply,
  XCircle,
  Mail,
  Building2,
  Calendar,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'open',             label: 'Open' },
  { value: 'in_progress',      label: 'In Progress' },
  { value: 'waiting_for_user', label: 'Waiting for User' },
  { value: 'replied',          label: 'Replied' },
  { value: 'resolved',         label: 'Resolved' },
  { value: 'closed',           label: 'Closed' },
];

function StatusBadge({ status }) {
  const styles = {
    open:             'bg-amber-50 text-amber-700 border-amber-200',
    in_progress:      'bg-blue-50 text-blue-700 border-blue-200',
    replied:          'bg-emerald-50 text-emerald-700 border-emerald-200',
    waiting_for_user: 'bg-purple-50 text-purple-700 border-purple-200',
    resolved:         'bg-teal-50 text-teal-700 border-teal-200',
    closed:           'bg-slate-100 text-slate-600 border-slate-200',
  };
  const label = STATUS_OPTIONS.find((item) => item.value === status)?.label || status || 'Open';
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
        styles[status] || styles.open
      }`}
    >
      {label}
    </span>
  );
}

function formatType(type) {
  if (!type) return 'General';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function ticketIdsMatch(a, b) {
  if (!a || !b) return false;
  return String(a) === String(b);
}

// Builds a chronological conversation thread from the original message + all replies.
// reply.sender defaults to 'admin' for backward compatibility with old documents.
function buildThread(ticket) {
  if (!ticket) return [];
  const original = {
    id:        'original',
    sender:    'user',
    name:      ticket.name || 'Requester',
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
    <div className="space-y-3 max-h-[380px] overflow-y-auto pr-0.5">
      {thread.map((msg) => {
        const isAdmin = msg.sender === 'admin';
        return (
          <div
            key={msg.id}
            className={`rounded-[12px] border p-3.5 ${
              isAdmin
                ? 'border-emerald-100 bg-emerald-50/60'
                : 'border-[#E5E7EB] bg-[#F8FAFC]'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                    isAdmin ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {(msg.name || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="text-[12px] font-bold text-[#0F172A]">{msg.name}</span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide ${
                    isAdmin ? 'text-emerald-600' : 'text-slate-500'
                  }`}
                >
                  {msg.roleLabel}
                </span>
              </div>
              <span className="text-[10px] text-[#94A3B8] font-medium whitespace-nowrap">
                {new Date(msg.createdAt).toLocaleString('en-GB', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </div>
            <p className="text-[13px] leading-relaxed text-[#334155] whitespace-pre-wrap pl-8">
              {msg.message}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminSupportManagement() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const selectTicket = useCallback((ticket) => {
    if (!ticket) return;
    setSelectedTicket(ticket);
    setReplyText('');
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${getApiBaseUrl()}/api/admin/contact-messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const nextMessages = data.data || [];
        setMessages(nextMessages);
        setSelectedTicket((current) => {
          if (current) {
            const refreshed = nextMessages.find((item) => ticketIdsMatch(item._id, current._id));
            if (refreshed) return refreshed;
          }
          return nextMessages[0] || null;
        });
      } else {
        toast.error(data.error || 'Failed to load support requests');
      }
    } catch {
      toast.error('Network error while loading support requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const refreshSelectedTicket = async (ticketId) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${getApiBaseUrl()}/api/admin/contact-messages/${ticketId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) {
      setSelectedTicket(data.data);
      setMessages((current) =>
        current.map((item) =>
          ticketIdsMatch(item._id, ticketId) ? { ...item, ...data.data } : item
        )
      );
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket?._id) return;
    if (!replyText.trim()) {
      toast.error('Reply message cannot be empty');
      return;
    }

    setIsSending(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${getApiBaseUrl()}/api/admin/contact-messages/${selectedTicket._id}/reply`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ replyMessage: replyText }),
        }
      );
      const data = await res.json();

      if (data.success) {
        toast.success(data.message || 'Reply sent successfully');
        setReplyText('');
        await refreshSelectedTicket(selectedTicket._id);
      } else {
        toast.error(data.error || 'Failed to send reply');
      }
    } catch {
      toast.error('Network error while sending reply');
    } finally {
      setIsSending(false);
    }
  };

  const handleStatusChange = async (status) => {
    if (!selectedTicket?._id) return;
    setStatusUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${getApiBaseUrl()}/api/admin/contact-messages/${selectedTicket._id}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );
      const data = await res.json();
      if (data.success) {
        toast.success('Status updated');
        await refreshSelectedTicket(selectedTicket._id);
      } else {
        toast.error(data.error || 'Failed to update status');
      }
    } catch {
      toast.error('Network error while updating status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket?._id) return;
    await handleCloseTicketFor(selectedTicket._id);
  };

  const handleCloseTicketFor = async (ticketId) => {
    setStatusUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${getApiBaseUrl()}/api/admin/contact-messages/${ticketId}/close`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Request closed successfully');
        await refreshSelectedTicket(ticketId);
      } else {
        toast.error(data.error || 'Failed to close request');
      }
    } catch {
      toast.error('Network error while closing request');
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full space-y-6 animate-pulse">
        <div className="h-24 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB]" />
        <div className="h-[520px] rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB]" />
      </div>
    );
  }

  const latestReply =
    selectedTicket?.replies?.length > 0
      ? selectedTicket.replies[selectedTicket.replies.length - 1]
      : null;

  return (
    <div className="w-full">
      <AdminPageShell
        title="Support Requests"
        description="Select a request to view its details and respond."
        align="left"
      >
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-3 overflow-hidden rounded-[18px] border border-[#E5E7EB] bg-white shadow-sm min-w-0">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16 text-center">
                <MessageSquare size={32} className="text-[#94A3B8] mb-4" />
                <h3 className="text-[18px] font-bold text-[#0F172A] mb-2">No support requests yet</h3>
                <p className="text-[14px] text-[#64748B]">
                  New contact form submissions will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[920px] w-full text-left">
                  <thead className="border-b border-[#E5E7EB] bg-[#F8FAFC]">
                    <tr>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                        Request ID
                      </th>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                        User
                      </th>
                      <th className="hidden lg:table-cell px-5 py-4 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                        Company
                      </th>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                        Inquiry Type
                      </th>
                      <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                        Status
                      </th>
                      <th className="hidden md:table-cell px-5 py-4 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                        Date
                      </th>
                      <th className="sticky right-0 z-10 bg-[#F8FAFC] px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-wider text-[#64748B] shadow-[-8px_0_12px_rgba(255,255,255,0.9)]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {messages.map((msg) => {
                      const isSelected = ticketIdsMatch(selectedTicket?._id, msg._id);
                      return (
                        <tr
                          key={msg._id}
                          onClick={() => selectTicket(msg)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-[rgba(0,168,120,0.06)] shadow-[inset_3px_0_0_0_#00A878]'
                              : 'hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <td className="px-5 py-4 text-[13px] font-bold text-[#0F172A]">
                            {msg.ticketId || `SUP-${String(msg._id).slice(-6).toUpperCase()}`}
                          </td>
                          <td className="px-5 py-4">
                            <div className="text-[14px] font-semibold text-[#0F172A]">{msg.name}</div>
                            <div className="text-[12px] text-[#64748B]">{msg.email}</div>
                          </td>
                          <td className="hidden lg:table-cell px-5 py-4 text-[13px] text-[#475569]">
                            {msg.company || '—'}
                          </td>
                          <td className="px-5 py-4">
                            <div className="text-[13px] font-medium text-[#0F172A]">
                              {formatType(msg.type)}
                            </div>
                            {msg.category && (
                              <div className="text-[11px] font-semibold text-amber-700 mt-1">
                                {msg.category}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge status={msg.status || (msg.isReplied ? 'replied' : 'open')} />
                          </td>
                          <td className="hidden md:table-cell px-5 py-4 text-[12px] text-[#64748B] whitespace-nowrap">
                            {new Date(msg.createdAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td
                            className={`sticky right-0 z-10 px-5 py-4 shadow-[-8px_0_12px_rgba(255,255,255,0.9)] ${
                              isSelected ? 'bg-[rgba(0,168,120,0.06)]' : 'bg-white'
                            }`}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => selectTicket(msg)}
                                className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#E5E7EB] px-3 py-2 text-[11px] font-semibold text-[#475569] hover:border-[#00A878] hover:text-[#00A878]"
                              >
                                <Eye size={14} />
                                View
                              </button>
                              {msg.status !== 'closed' && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    selectTicket(msg);
                                    await handleCloseTicketFor(msg._id);
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#FECACA] px-3 py-2 text-[11px] font-semibold text-[#DC2626] hover:bg-[#FEF2F2]"
                                >
                                  <XCircle size={14} />
                                  Close
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="xl:col-span-2 min-w-0" id="admin-support-detail-panel">
            {!selectedTicket ? (
              <div className="rounded-[18px] border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
                <Eye size={28} className="mx-auto text-[#94A3B8] mb-4" />
                <h3 className="text-[16px] font-bold text-[#0F172A] mb-2">Select a support request</h3>
                <p className="text-[13px] text-[#64748B]">
                  Click any request row in the table to view details and send a reply.
                </p>
              </div>
            ) : (
              <div className="rounded-[18px] border border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
                <div className="border-b border-[#E5E7EB] bg-[#F8FAFC] px-6 py-4">
                  <h3 className="text-[16px] font-bold text-[#0F172A]">Request Details</h3>
                  <p className="text-[12px] text-[#64748B] mt-1">
                    {selectedTicket.ticketId ||
                      `SUP-${String(selectedTicket._id).slice(-6).toUpperCase()}`}
                  </p>
                </div>

                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 gap-3 text-[13px]">
                    <div className="flex items-center gap-2 text-[#64748B]">
                      <Mail size={14} />
                      <span className="font-semibold text-[#0F172A]">{selectedTicket.name}</span>
                      <span>({selectedTicket.email})</span>
                    </div>
                    {selectedTicket.company && (
                      <div className="flex items-center gap-2 text-[#64748B]">
                        <Building2 size={14} />
                        <span>{selectedTicket.company}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[#64748B]">
                      <Calendar size={14} />
                      <span>
                        {new Date(selectedTicket.createdAt).toLocaleString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                        Request Status
                      </span>
                      <select
                        value={selectedTicket.status || 'open'}
                        disabled={statusUpdating}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className="rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2 text-[12px] font-semibold text-[#0F172A] outline-none focus:border-[#00A878]"
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <StatusBadge
                      status={selectedTicket.status || (selectedTicket.isReplied ? 'replied' : 'open')}
                    />
                  </div>

                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-3">
                      Conversation
                    </div>
                    <ConversationThread ticket={selectedTicket} />
                  </div>

                  {!['resolved', 'closed'].includes(selectedTicket.status) ? (
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-2">
                        Admin Reply
                      </div>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={5}
                        placeholder="Type your support reply..."
                        className="w-full rounded-[14px] border border-[#E5E7EB] bg-white px-4 py-3 text-[14px] outline-none transition-all focus:border-[#00A878] focus:ring-4 focus:ring-[#00A878]/10 resize-none"
                      />
                      <div className="mt-4 flex flex-col sm:flex-row gap-3">
                        <button
                          type="button"
                          onClick={handleSendReply}
                          disabled={isSending}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-[12px] bg-[#00A878] px-4 py-3 text-[13px] font-bold text-white hover:bg-[#009166] disabled:opacity-60"
                        >
                          {isSending ? <Loader2 size={16} className="animate-spin" /> : <Reply size={16} />}
                          {isSending ? 'Sending…' : 'Send Reply'}
                        </button>
                        <button
                          type="button"
                          onClick={handleCloseTicket}
                          disabled={statusUpdating}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-[12px] border border-[#FECACA] px-4 py-3 text-[13px] font-bold text-[#DC2626] hover:bg-[#FEF2F2] disabled:opacity-60"
                        >
                          <XCircle size={16} />
                          Close Request
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] font-semibold text-slate-600">
                      This request is closed.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </AdminPageShell>
    </div>
  );
}
