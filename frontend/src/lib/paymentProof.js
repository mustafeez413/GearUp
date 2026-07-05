import { getApiBaseUrl } from '@/lib/api';

export function getPaymentProofFilename(paymentProof) {
  if (!paymentProof) return null;
  const normalized = paymentProof.replace(/\\/g, '/');
  return normalized.split('/').filter(Boolean).pop() || null;
}

export async function fetchSecurePaymentProofBlobUrl(paymentProof) {
  const filename = getPaymentProofFilename(paymentProof);
  if (!filename) {
    throw new Error('No payment proof file found for this order.');
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token) {
    throw new Error('You must be signed in to view payment proofs.');
  }

  const res = await fetch(
    `${getApiBaseUrl()}/api/admin/proof/${encodeURIComponent(filename)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    let message = 'Failed to load payment proof.';
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const contentType = res.headers.get('content-type') || '';
  const blob = await res.blob();
  const typedBlob =
    contentType && blob.type !== contentType
      ? new Blob([await blob.arrayBuffer()], { type: contentType })
      : blob;
  return URL.createObjectURL(typedBlob);
}
