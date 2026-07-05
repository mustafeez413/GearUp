'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl } from '@/lib/api';
import toast from 'react-hot-toast';
import AdminPageShell from '@/components/admin/AdminPageShell';
import AdminDisputesPanel from '@/components/admin/panels/AdminDisputesPanel';

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDisputes = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${getApiBaseUrl()}/api/disputes/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setDisputes(data.data || []);
      } else {
        toast.error(data.error || 'Could not load disputes');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load disputes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  return (
    <div className="max-w-[1400px] mx-auto w-full px-6">
      <AdminPageShell
        title="Dispute Management"
        description="Review buyer claims, investigate issues, and resolve disputes at scale with compact listings and detailed case views."
        align="center"
      />
      <AdminDisputesPanel disputes={disputes} loading={loading} onRefresh={fetchDisputes} />
    </div>
  );
}
