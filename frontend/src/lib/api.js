const rawBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

if (!rawBackendUrl) {
  throw new Error('NEXT_PUBLIC_BACKEND_URL is missing');
}

/** @type {string} Base URL for the GearUp API (no trailing slash). */
export const API_BASE_URL = String(rawBackendUrl).replace(/\/$/, '');

const isLocalBackend = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(API_BASE_URL);

if (!isLocalBackend && !API_BASE_URL.startsWith('https://')) {
  throw new Error('NEXT_PUBLIC_BACKEND_URL must use HTTPS in production');
}

/**
 * Base URL for the GearUp API (no trailing slash).
 */
export function getApiBaseUrl() {
  return API_BASE_URL;
}

/**
 * Absolute URL for an API path (path must start with /).
 */
export function apiUrl(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}
