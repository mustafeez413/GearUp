'use client';

import AdminPageShell from '@/components/admin/AdminPageShell';
import AdminProductsPanel from '@/components/admin/panels/AdminProductsPanel';

export default function AdminProductsPage() {
  return (
    <AdminPageShell
      title="Products"
      description="Browse marketplace inventory, monitor listing status, and review sponsored product placements."
      align="center"
    >
      <AdminProductsPanel />
    </AdminPageShell>
  );
}
