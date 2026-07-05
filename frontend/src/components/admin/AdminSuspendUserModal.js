'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Ban, X } from 'lucide-react';
import { SUSPENSION_REASONS } from '@/lib/readOnlyMode';

function ModalShell({ children, onClose, labelId }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mounted, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto overscroll-contain"
      role="presentation"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-[#0F172A]/55 backdrop-blur-[2px]" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        className="relative w-full max-w-[480px] rounded-[20px] border border-[#E5E7EB] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

export default function AdminSuspendUserModal({ open, user, onConfirm, onCancel, loading }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setSelectedReason('');
    setCustomReason('');
    setError('');
  }, [open, user?._id]);

  if (!open || !user) return null;

  const handleConfirm = () => {
    if (!selectedReason) {
      setError('Please select a suspension reason.');
      return;
    }

    if (selectedReason === 'Other') {
      const trimmedCustom = customReason.trim();
      if (!trimmedCustom) {
        setError('Custom reason is required when "Other" is selected.');
        return;
      }
      onConfirm(trimmedCustom);
      return;
    }

    onConfirm(selectedReason);
  };

  return (
    <ModalShell onClose={onCancel} labelId="admin-suspend-user-title">
      <div className="px-6 pt-6 pb-4 border-b border-[#E5E7EB]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id="admin-suspend-user-title" className="text-lg font-bold text-[#0F172A] tracking-tight">
              Suspend User
            </h3>
            <p className="mt-1 text-sm font-medium text-[#64748B]">
              {user.name} · {user.email}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="grid h-9 w-9 place-items-center rounded-full border border-[#E5E7EB] text-[#64748B] hover:bg-[#F8FAFC]"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="px-6 py-5 space-y-4">
        <div>
          <label htmlFor="suspension-reason" className="block text-sm font-semibold text-[#0F172A] mb-2">
            Reason <span className="text-[#DC2626]">*</span>
          </label>
          <select
            id="suspension-reason"
            value={selectedReason}
            onChange={(event) => {
              setSelectedReason(event.target.value);
              setError('');
            }}
            className="w-full rounded-[12px] border border-[#E5E7EB] bg-white px-4 py-3 text-[14px] font-medium text-[#0F172A] outline-none transition-all focus:border-[#00B894] focus:ring-2 focus:ring-[#00B894]/15"
          >
            <option value="">Select a reason</option>
            {SUSPENSION_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>
        </div>

        {selectedReason === 'Other' && (
          <div>
            <label htmlFor="custom-suspension-reason" className="block text-sm font-semibold text-[#0F172A] mb-2">
              Custom Reason <span className="text-[#DC2626]">*</span>
            </label>
            <textarea
              id="custom-suspension-reason"
              value={customReason}
              onChange={(event) => {
                setCustomReason(event.target.value);
                setError('');
              }}
              rows={4}
              placeholder="Repeated violation of platform rules after multiple warnings."
              className="w-full rounded-[12px] border border-[#E5E7EB] bg-white px-4 py-3 text-[14px] text-[#0F172A] outline-none transition-all focus:border-[#00B894] focus:ring-2 focus:ring-[#00B894]/15 resize-none"
            />
          </div>
        )}

        <div className="rounded-[12px] border border-[#FEE2E2] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#991B1B] leading-relaxed">
          The user will remain able to sign in and view their records in read-only mode until reactivated.
        </div>

        {error && (
          <p className="text-[13px] font-semibold text-[#DC2626]">{error}</p>
        )}
      </div>

      <div className="px-6 py-4 border-t border-[#E5E7EB] flex flex-col-reverse sm:flex-row gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 h-11 rounded-[12px] border border-[#E5E7EB] bg-white text-sm font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition-colors disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={handleConfirm}
          className="flex-1 h-11 rounded-[12px] bg-[#DC2626] text-sm font-semibold text-white hover:bg-[#B91C1C] transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
        >
          <Ban size={16} />
          {loading ? 'Suspending…' : 'Suspend Account'}
        </button>
      </div>
    </ModalShell>
  );
}
