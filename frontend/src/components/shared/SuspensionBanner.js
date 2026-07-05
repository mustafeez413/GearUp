'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { useReadOnlyMode } from '@/hooks/useReadOnlyMode';

export default function SuspensionBanner() {
  const { isReadOnlyMode, blockReason } = useReadOnlyMode();
  const pathname = usePathname();
  const isContactPage = pathname === '/contact';

  const scrollToContactForm = () => {
    const formSection = document.getElementById('gearup-contact-form');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (!isReadOnlyMode) return null;

  return (
    <div
      className="mb-5 rounded-[16px] border border-[#F59E0B]/30 bg-gradient-to-r from-[#FFFBEB] via-[#FEF3C7] to-[#FFFBEB] px-5 py-4 shadow-[0_8px_24px_rgba(245,158,11,0.12)]"
      role="alert"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3 min-w-0">
          <div className="mt-0.5 shrink-0 grid h-10 w-10 place-items-center rounded-full bg-[#F59E0B]/15 text-[#B45309]">
            <AlertTriangle size={20} strokeWidth={2.25} />
          </div>
          <div className="min-w-0">
            <h2 className="text-[15px] font-bold text-[#92400E] tracking-tight">
              Your Account Has Been Suspended
            </h2>
            <div className="mt-2 text-[13px] font-semibold text-[#B45309]">
              Reason:
            </div>
            <p className="mt-1 text-[14px] font-medium text-[#78350F] leading-relaxed break-words">
              {blockReason}
            </p>
            <p className="mt-3 text-[13px] text-[#92400E]/90 leading-relaxed">
              Your account is currently in <span className="font-semibold">Read-Only Mode</span>.
              You can still access your previous business records, but you cannot perform any business
              operations until your account is reactivated.
            </p>
            <p className="mt-2 text-[13px] text-[#92400E]/80 leading-relaxed">
              If you believe this suspension was made by mistake, please contact our support team.
            </p>
          </div>
        </div>
        {isContactPage ? (
          <button
            type="button"
            onClick={scrollToContactForm}
            className="inline-flex shrink-0 items-center justify-center rounded-[12px] bg-[#B45309] px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#92400E] self-start"
          >
            Contact Support
          </button>
        ) : (
          <Link
            href="/contact"
            className="inline-flex shrink-0 items-center justify-center rounded-[12px] bg-[#B45309] px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#92400E] self-start"
          >
            Contact Support
          </Link>
        )}
      </div>
    </div>
  );
}
