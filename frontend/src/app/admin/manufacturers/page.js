'use client';

import AdminUsersManagement from '@/components/admin/AdminUsersManagement';

export default function AdminManufacturersPage() {
  return (
    <AdminUsersManagement
      roleFilter="manufacturer"
      pageTitle="Manufacturers"
      pageDescription="Manage manufacturer accounts, verification status, and platform access."
    />
  );
}
