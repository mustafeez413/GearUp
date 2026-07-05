import { getApiBaseUrl } from '@/lib/api';

function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export async function fetchSecureVerificationDocumentBlobUrl() {
  const token = getAuthToken();
  if (!token) {
    throw new Error('You must be signed in to view this document.');
  }

  const res = await fetch(`${getApiBaseUrl()}/api/auth/verification-document`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    let message = 'Failed to load verification document.';
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        const data = await res.json();
        if (data?.error) message = data.error;
      } catch {
        /* ignore */
      }
    } else if (res.status === 404) {
      message = 'Verification document service is unavailable. Please refresh and try again.';
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

export function getSecureVerificationDocumentUrl() {
  const token = getAuthToken();
  if (!token) {
    throw new Error('You must be signed in to view this document.');
  }

  const params = new URLSearchParams({ token });
  return `${getApiBaseUrl()}/api/auth/verification-document?${params.toString()}`;
}

export async function openSecureVerificationDocument() {
  const token = getAuthToken();
  if (!token) {
    throw new Error('You must be signed in to view this document.');
  }

  const url = getSecureVerificationDocumentUrl();
  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  if (!opened) {
    throw new Error('Pop-up blocked. Please allow pop-ups for this site and try again.');
  }
}
