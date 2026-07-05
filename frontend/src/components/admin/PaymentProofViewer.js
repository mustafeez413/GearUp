"use client";

import React, { useEffect, useState } from 'react';
import { AlertCircle, ExternalLink, Download, Loader2 } from 'lucide-react';
import { fetchSecurePaymentProofBlobUrl, getPaymentProofFilename } from '@/lib/paymentProof';

const PaymentProofViewer = ({ paymentProof, compact = false }) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!paymentProof) {
      setLoading(false);
      setError('No payment proof uploaded.');
      return;
    }

    let objectUrl = null;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      setBlobUrl(null);

      try {
        objectUrl = await fetchSecurePaymentProofBlobUrl(paymentProof);
        if (!cancelled) setBlobUrl(objectUrl);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load payment proof.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [paymentProof]);

  const filename = getPaymentProofFilename(paymentProof) || 'payment-proof';
  const isPdf = paymentProof?.toLowerCase().endsWith('.pdf');
  const previewHeight = compact ? 'h-[280px]' : 'h-[min(58vh,560px)]';

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 ${previewHeight} text-[#6b7280]`}>
        <Loader2 size={32} className="animate-spin text-[#00a896]" />
        <p className="text-sm font-medium">Loading proof…</p>
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div className={`flex flex-col items-center justify-center gap-3 text-center px-6 ${previewHeight}`}>
        <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center">
          <AlertCircle size={28} className="text-rose-500" />
        </div>
        <p className="text-sm font-semibold text-[#0b141e]">Could not load proof</p>
        <p className="text-xs text-[#6b7280] max-w-xs">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="text-xs font-medium text-[#6b7280] truncate">{filename}</p>
        <div className="flex items-center gap-3 shrink-0">
          <a
            href={blobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#00a896] hover:text-[#008f7f] transition-colors"
          >
            <ExternalLink size={13} />
            Open
          </a>
          <a
            href={blobUrl}
            download={filename}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#6b7280] hover:text-[#0b141e] transition-colors"
          >
            <Download size={13} />
            Download
          </a>
        </div>
      </div>

      <div
        className={`w-full ${previewHeight} rounded-xl overflow-hidden border border-[#e8ecf1] bg-[#525659]`}
      >
        {isPdf ? (
          <iframe
            src={`${blobUrl}#view=FitH&toolbar=0`}
            title="Payment proof preview"
            className="w-full h-full border-0 bg-white"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#f5f7fa] overflow-auto">
            <img
              src={blobUrl}
              alt="Payment proof"
              className="max-w-full max-h-full w-auto h-auto object-contain"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentProofViewer;
