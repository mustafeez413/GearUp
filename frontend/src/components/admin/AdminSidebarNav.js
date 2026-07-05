'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { ADMIN_NAV_GROUPS, isAdminNavActive } from '@/lib/adminNavigation';

const STORAGE_KEY = 'gearup-admin-nav-groups';

function readStoredGroups() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function AdminSidebarNav({ showLabels = true, onNavigate, unreadCount = 0 }) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState(() => {
    const stored = readStoredGroups();
    if (stored) return stored;
    return ADMIN_NAV_GROUPS.reduce((acc, group) => {
      acc[group.id] = group.defaultOpen !== false;
      return acc;
    }, {});
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(openGroups));
  }, [openGroups]);

  useEffect(() => {
    ADMIN_NAV_GROUPS.forEach((group) => {
      const hasActive = group.items.some((item) => isAdminNavActive(pathname, item.path));
      if (hasActive) {
        setOpenGroups((prev) => (prev[group.id] ? prev : { ...prev, [group.id]: true }));
      }
    });
  }, [pathname]);

  const toggleGroup = (groupId) => {
    if (!showLabels) return;
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  return (
    <div className="space-y-1">
      {ADMIN_NAV_GROUPS.map((group) => {
        const isOpen = openGroups[group.id] !== false;
        const groupHasActive = group.items.some((item) => isAdminNavActive(pathname, item.path));

        return (
          <div key={group.id} className="mb-1">
            {showLabels ? (
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-[0.14em] transition-colors ${
                  groupHasActive ? 'text-[#00A878]/90' : 'text-white/35 hover:text-white/55'
                }`}
              >
                <span>{group.label}</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`}
                />
              </button>
            ) : null}

            <div
              className={`space-y-0.5 overflow-hidden transition-all duration-200 ${
                showLabels && !isOpen ? 'max-h-0 opacity-0' : 'max-h-[600px] opacity-100'
              }`}
            >
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = isAdminNavActive(pathname, item.path);

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={onNavigate}
                    title={!showLabels ? item.label : undefined}
                    className={`flex items-center gap-3 py-2.5 rounded-[10px] text-[13px] transition-all duration-200 ${
                      showLabels ? 'px-3 ml-0.5 mb-0.5' : 'px-0 justify-center mb-0.5'
                    } ${
                      isActive
                        ? 'bg-[#00B67A]/15 text-[#00B67A] font-semibold shadow-[0_1px_3px_#00000010]'
                        : 'text-white/60 font-medium hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    <span className="w-[18px] h-[18px] flex items-center justify-center shrink-0">
                      <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                    </span>
                    {showLabels ? <span className="truncate flex-1 leading-snug">{item.label}</span> : null}
                    {item.badgeKey === 'newActivity' && unreadCount > 0 && showLabels && (
                      <span className="min-w-[20px] h-[20px] bg-emerald-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1.5 shadow-sm">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
