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
  if (contentType.includes('application/json')) {
    const data = await res.json();
    if (data.success && data.url) {
      return data.url;
    }
  }

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

  // Pre-open window synchronously on user click to prevent browser pop-up blocking
  const popup = typeof window !== 'undefined' ? window.open('about:blank', '_blank') : null;

  try {
    const res = await fetch(`${getApiBaseUrl()}/api/auth/verification-document`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      let message = 'Failed to load verification document.';
      try {
        const data = await res.json();
        if (data?.error) message = data.error;
      } catch {
        /* ignore */
      }
      if (popup) popup.close();
      throw new Error(message);
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (data.success && data.url) {
        if (popup) {
          popup.location.href = data.url;
        } else {
          window.open(data.url, '_blank', 'noopener,noreferrer');
        }
        return;
      }
    }

    // Fallback for local binary files if any exist
    const blob = await res.blob();
    const typedBlob =
      contentType && blob.type !== contentType
        ? new Blob([await blob.arrayBuffer()], { type: contentType })
        : blob;
    const blobUrl = URL.createObjectURL(typedBlob);
    if (popup) {
      popup.location.href = blobUrl;
    } else {
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
    }
  } catch (err) {
    if (popup) popup.close();
    throw err;
  }
}
