"use client";

import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { openSecureVerificationDocument } from '@/lib/verificationDocument';

export default function ViewSubmittedDocumentButton({
  label = 'View Submitted Documents',
  className = '',
  showArrow = true,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      await openSecureVerificationDocument();
    } catch (err) {
      setError(err.message || 'Failed to open document.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={className}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
        {label}
        {showArrow && !loading ? <ArrowRight size={16} /> : null}
      </button>
      {error ? <p className="text-xs text-red-600 mt-1">{error}</p> : null}
    </div>
  );
}
