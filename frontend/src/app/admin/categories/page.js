'use client';

import AdminPageShell from '@/components/admin/AdminPageShell';
import AdminCategoriesPanel from '@/components/admin/panels/AdminCategoriesPanel';

export default function AdminCategoriesPage() {
  return (
    <AdminPageShell
      title="Categories"
      description="Manage marketplace verticals, monitor category inventory, and review sponsored listings across GearUp."
      align="center"
    >
      <AdminCategoriesPanel />
    </AdminPageShell>
  );
}
