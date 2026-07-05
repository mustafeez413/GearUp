import { getApiBaseUrl } from '@/lib/api';

export function getUploadFilename(uploadPath) {
  if (!uploadPath) return null;
  const normalized = uploadPath.replace(/\\/g, '/');
  return normalized.split('/').filter(Boolean).pop() || null;
}

export async function fetchSecureAdminUploadBlobUrl(uploadPath) {
  const filename = getUploadFilename(uploadPath);
  if (!filename) {
    throw new Error('No document file found.');
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token) {
    throw new Error('You must be signed in to view this document.');
  }

  const res = await fetch(
    `${getApiBaseUrl()}/api/admin/proof/${encodeURIComponent(filename)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    let message = 'Failed to load document.';
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

export async function openSecureAdminUpload(uploadPath) {
  const url = await fetchSecureAdminUploadBlobUrl(uploadPath);
  window.open(url, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => URL.revokeObjectURL(url), 120000);
}

export async function downloadSecureAdminUpload(uploadPath, filename) {
  const url = await fetchSecureAdminUploadBlobUrl(uploadPath);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename || getUploadFilename(uploadPath) || 'document';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
