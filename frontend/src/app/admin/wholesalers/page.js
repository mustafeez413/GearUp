'use client';

import AdminUsersManagement from '@/components/admin/AdminUsersManagement';

export default function AdminWholesalersPage() {
  return (
    <AdminUsersManagement
      roleFilter="wholesaler"
      pageTitle="Wholesalers"
      pageDescription="Manage wholesaler accounts, verification status, and platform access."
    />
  );
}
