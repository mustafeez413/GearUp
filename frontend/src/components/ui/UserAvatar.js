'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  extractUserAvatar,
  getUserInitials,
  resolveAvatarUrl,
} from '@/lib/avatarUtils';

const SIZE_CLASSES = {
  xs: 'h-7 w-7 text-[10px]',
  sm: 'h-9 w-9 text-[11px]',
  md: 'h-11 w-11 text-[13px]',
  lg: 'h-14 w-14 text-[16px]',
  xl: 'h-16 w-16 text-[18px]',
  '2xl': 'h-24 w-24 text-[22px]',
};

const ROUNDED_CLASSES = {
  full: 'rounded-full',
  xl: 'rounded-xl',
  lg: 'rounded-lg',
  md: 'rounded-[14px]',
};

const VARIANT_CLASSES = {
  default: {
    shell: 'border border-[#E5E7EB] bg-[#F8FAFC]',
    fallback: 'bg-[rgba(0,184,148,0.08)] text-[#00B894]',
  },
  dark: {
    shell: 'border border-[#00A878]/25 bg-[#00A878]/12',
    fallback: 'bg-[#00A878]/12 text-[#00A878]',
  },
  gradient: {
    shell: 'border border-transparent bg-gradient-to-br from-[#071A35] to-[#1e3a5f]',
    fallback: 'bg-gradient-to-br from-[#071A35] to-[#1e3a5f] text-white',
  },
  navy: {
    shell: 'border border-transparent shadow-[0_4px_12px_rgba(11,31,58,0.22)]',
    fallback: 'bg-gradient-to-br from-[#0B1F3A] to-[#102A43] text-white',
  },
  teal: {
    shell: 'border border-transparent shadow-[0_4px_12px_rgba(11,31,58,0.22)]',
    fallback: 'bg-gradient-to-br from-[#0D9488] to-[#0F766E] text-white',
  },
  emerald: {
    shell: 'border border-slate-200/80 bg-emerald-50',
    fallback: 'bg-emerald-50 text-emerald-600',
  },
};

export default function UserAvatar({
  user,
  name,
  src,
  size = 'md',
  variant = 'default',
  rounded = 'full',
  bordered = true,
  className = '',
  alt,
  imageClassName = '',
}) {
  const [imageFailed, setImageFailed] = useState(false);

  const displayName = name || user?.name || user?.businessDetails?.businessName || 'User';
  const resolvedSrc = useMemo(() => {
    const raw = src ?? extractUserAvatar(user);
    return resolveAvatarUrl(raw);
  }, [src, user]);

  useEffect(() => {
    setImageFailed(false);
  }, [resolvedSrc]);

  const showImage = Boolean(resolvedSrc) && !imageFailed;
  const initials = getUserInitials(displayName);
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const roundedClass = ROUNDED_CLASSES[rounded] || ROUNDED_CLASSES.full;
  const palette = VARIANT_CLASSES[variant] || VARIANT_CLASSES.default;

  return (
    <div
      className={`relative shrink-0 overflow-hidden ${roundedClass} ${sizeClass} ${
        bordered ? palette.shell : ''
      } ${className}`}
      aria-hidden={!alt}
    >
      {showImage ? (
        <img
          src={resolvedSrc}
          alt={alt ?? `${displayName} avatar`}
          className={`h-full w-full object-cover ${imageClassName}`}
          loading="lazy"
          decoding="async"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center font-semibold uppercase ${palette.fallback}`}
        >
          {initials}
        </div>
      )}
    </div>
  );
}

export { getUserInitials, resolveAvatarUrl, extractUserAvatar, resolveUserAvatarUrl } from '@/lib/avatarUtils';
