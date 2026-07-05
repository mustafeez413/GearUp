import { getApiBaseUrl } from '@/lib/api';

const AVATAR_FIELD_KEYS = ['avatar', 'profileImage', 'profilePicture', 'image', 'photo'];

/**
 * Read the first available profile image field from a user-like object.
 */
export function extractUserAvatar(user) {
  if (!user) return null;
  for (const key of AVATAR_FIELD_KEYS) {
    const value = user[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

/**
 * Resolve a stored avatar path or URL into a browser-loadable absolute URL.
 */
export function resolveAvatarUrl(avatar) {
  if (!avatar || typeof avatar !== 'string') return null;

  const trimmed = avatar.trim();
  if (!trimmed) return null;

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  let path = trimmed;
  if (!path.startsWith('/')) {
    path = path.includes('uploads') ? `/${path.replace(/^\/+/, '')}` : `/uploads/${path}`;
  }

  return `${getApiBaseUrl()}${path}`;
}

/**
 * Resolve avatar from a user object (supports alternate field names).
 */
export function resolveUserAvatarUrl(user) {
  return resolveAvatarUrl(extractUserAvatar(user));
}

/**
 * Build uppercase initials from a display name.
 */
export function getUserInitials(name) {
  if (!name || typeof name !== 'string') return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  return parts
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
