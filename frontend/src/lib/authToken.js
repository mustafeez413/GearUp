export function isValidJwtFormat(token) {
  if (!token || typeof token !== 'string') return false;
  const trimmed = token.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return false;
  return trimmed.split('.').length === 3;
}

export function getStoredToken() {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('token');
  return isValidJwtFormat(token) ? token.trim() : null;
}

export function getAuthHeaders(extraHeaders = {}) {
  const token = getStoredToken();
  if (!token) return { ...extraHeaders };
  return {
    ...extraHeaders,
    Authorization: `Bearer ${token}`,
  };
}

export function clearStoredSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('gearup_user');
  localStorage.removeItem('token');
}
