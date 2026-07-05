'use client';

import AdminUsersManagement from '@/components/admin/AdminUsersManagement';

export default function AdminUsersPage() {
  return (
    <AdminUsersManagement
      roleFilter="all"
      pageTitle="Users"
      pageDescription="Monitor and control platform access for all marketplace participants."
    />
  );
}
