import { getApiBaseUrl } from '@/lib/api';

export function getUploadFilename(uploadPath) {
  if (!uploadPath) return null;
  const normalized = uploadPath.replace(/\\/g, '/');
  const cleanPath = normalized.split('?')[0];
  return cleanPath.split('/').filter(Boolean).pop() || null;
}

export async function fetchSecureAdminUploadBlobUrl(uploadPath) {
  if (!uploadPath) {
    throw new Error('No document file found.');
  }

  // Handle absolute HTTP/HTTPS URLs (e.g. Cloudinary uploads)
  if (uploadPath.startsWith('http://') || uploadPath.startsWith('https://')) {
    try {
      const res = await fetch(uploadPath);
      if (!res.ok) throw new Error('Remote document fetch failed');
      const contentType = res.headers.get('content-type') || '';
      const blob = await res.blob();
      const typedBlob =
        contentType && blob.type !== contentType
          ? new Blob([await blob.arrayBuffer()], { type: contentType })
          : blob;
      return URL.createObjectURL(typedBlob);
    } catch {
      // Fallback: return direct URL if blob fetch is blocked by CORS
      return uploadPath;
    }
  }

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
  if (!uploadPath) return;
  if (uploadPath.startsWith('http://') || uploadPath.startsWith('https://')) {
    window.open(uploadPath, '_blank', 'noopener,noreferrer');
    return;
  }
  const popup = window.open('', '_blank');
  try {
    const url = await fetchSecureAdminUploadBlobUrl(uploadPath);
    if (popup) {
      popup.location.href = url;
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  } catch (err) {
    if (popup) popup.close();
    alert(err.message || 'Could not open document.');
  }
}

export async function downloadSecureAdminUpload(uploadPath, filename) {
  if (!uploadPath) return;
  try {
    const url = await fetchSecureAdminUploadBlobUrl(uploadPath);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename || getUploadFilename(uploadPath) || 'document';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    if (url.startsWith('blob:')) {
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
  } catch (err) {
    alert(err.message || 'Could not download document.');
  }
}
