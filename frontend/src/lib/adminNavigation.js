import {
  LayoutDashboard,
  ShieldCheck,
  CreditCard,
  Wallet,
  Lock,
  Scale,
  Users,
  CircleDollarSign,
  Percent,
  TrendingUp,
  Settings,
  Bell
} from 'lucide-react';

export const ADMIN_NAV_GROUPS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    defaultOpen: true,
    items: [
      { label: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    defaultOpen: true,
    items: [
      { label: 'Verifications', path: '/admin/verifications', icon: ShieldCheck },
      { label: 'Payments', path: '/admin/payment-reviews', icon: CreditCard },
      { label: 'Payouts', path: '/admin/payouts', icon: Wallet },
      { label: 'Escrow', path: '/admin/escrow', icon: Lock },
      { label: 'Disputes', path: '/admin/disputes', icon: Scale },
    ],
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    defaultOpen: true,
    items: [
      { label: 'Users', path: '/admin/users', icon: Users },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    defaultOpen: false,
    items: [
      { label: 'Revenue', path: '/admin/revenue', icon: CircleDollarSign },
      { label: 'Commissions', path: '/admin/commission', icon: Percent },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    defaultOpen: false,
    items: [
      { label: 'Revenue Analytics', path: '/admin/analytics/revenue', icon: TrendingUp },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    defaultOpen: false,
    items: [
      { label: 'Platform Settings', path: '/admin/settings/platform', icon: Settings },
    ],
  },
];

export function isAdminNavActive(pathname, itemPath) {
  if (pathname === itemPath) return true;
  if (itemPath === '/admin/dashboard') return false;
  if (itemPath === '/admin/users') {
    return pathname.startsWith(itemPath);
  }
  return pathname.startsWith(`${itemPath}/`);
}

export function flattenAdminNavItems() {
  return ADMIN_NAV_GROUPS.flatMap((group) => group.items);
}
