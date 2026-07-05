'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getApiBaseUrl } from '@/lib/api';
import { Users, Search, Ban, CheckCircle, Building2, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminPageShell from '@/components/admin/AdminPageShell';
import AdminUserDetailDrawer, { StatusBadge, RoleBadge } from '@/components/admin/AdminUserDetailDrawer';
import AdminSuspendUserModal from '@/components/admin/AdminSuspendUserModal';
import UserAvatar from '@/components/ui/UserAvatar';

const ROLE_TABS = [
  { id: 'all', label: 'All Users', href: '/admin/users', icon: Users },
  { id: 'manufacturer', label: 'Manufacturers', href: '/admin/manufacturers', icon: Building2 },
  { id: 'wholesaler', label: 'Wholesalers', href: '/admin/wholesalers', icon: Store },
];

function KpiCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[16px] border border-[#E5E7EB] bg-white p-5 flex items-center gap-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] border border-[#E5E7EB] bg-[#F8FAFC] text-[#00B894]">
        <Icon size={22} strokeWidth={1.75} />
      </div>
      <div>
        <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">{label}</div>
        <div className="mt-1 text-[24px] font-bold text-[#0F172A] leading-none tracking-tight tabular-nums">{value}</div>
      </div>
    </div>
  );
}

function AdminUsersInner({ roleFilter = 'all', pageTitle = 'Users', pageDescription }) {
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [suspendLoading, setSuspendLoading] = useState(false);
  const itemsPerPage = 10;
  const router = useRouter();
  const pathname = usePathname();

  const fetchUsers = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [usersRes, productsRes, ordersRes, transactionsRes] = await Promise.all([
        fetch(`${getApiBaseUrl()}/api/admin/users`, { headers }),
        fetch(`${getApiBaseUrl()}/api/products`, { headers }),
        fetch(`${getApiBaseUrl()}/api/orders`, { headers }),
        fetch(`${getApiBaseUrl()}/api/transactions/admin?limit=500`, { headers }),
      ]);

      const usersJson = await usersRes.json();
      const productsJson = await productsRes.json();
      const ordersJson = await ordersRes.json();
      const transactionsJson = await transactionsRes.json();

      if (usersJson.success) setUsers(usersJson.data || []);
      if (productsJson.success) setProducts(Array.isArray(productsJson.data) ? productsJson.data : []);
      if (ordersJson.success) setOrders(Array.isArray(ordersJson.data) ? ordersJson.data : []);
      if (transactionsJson.success) {
        setTransactions(Array.isArray(transactionsJson.data) ? transactionsJson.data : []);
      }
    } catch {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (!selectedUser) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedUser]);

  const performBlockToggle = async (userId, isBlocked, reason = '') => {
    const token = localStorage.getItem('token');
    const endpoint = isBlocked ? 'unblock' : 'block';

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/admin/users/${userId}/${endpoint}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`User successfully ${isBlocked ? 'activated' : 'suspended'}`);
        await fetchUsers();
        setSelectedUser((current) => {
          if (!current || current._id !== userId) return current;
          return { ...current, isBlocked: !isBlocked, blockReason: isBlocked ? '' : reason };
        });
      } else {
        toast.error(data.error || 'Action failed');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const handleBlockToggle = async (userId, isBlocked) => {
    if (!isBlocked) {
      const targetUser =
        users.find((user) => user._id === userId) ||
        (selectedUser?._id === userId ? selectedUser : null);
      setSuspendTarget(targetUser || { _id: userId, name: 'User', email: '' });
      return;
    }

    if (!window.confirm('Are you sure you want to activate this user?')) return;
    await performBlockToggle(userId, true);
  };

  const handleSuspendConfirm = async (reason) => {
    if (!suspendTarget?._id) return;
    setSuspendLoading(true);
    try {
      await performBlockToggle(suspendTarget._id, false, reason);
      setSuspendTarget(null);
    } finally {
      setSuspendLoading(false);
    }
  };

  const roleScopedUsers =
    roleFilter === 'all'
      ? users.filter((u) => u.role !== 'admin')
      : users.filter((u) => u.role === roleFilter);

  const filteredUsers = roleScopedUsers.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter]);

  useEffect(() => {
    if (!selectedUser) return;
    const refreshed = users.find((user) => user._id === selectedUser._id);
    if (refreshed) setSelectedUser(refreshed);
  }, [users, selectedUser?._id]);

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-6 animate-pulse px-6">
        <div className="h-24 rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC]" />
        <div className="h-[600px] rounded-[20px] border border-[#E5E7EB] bg-[#F8FAFC]" />
      </div>
    );
  }

  const description =
    pageDescription ||
    'Monitor and control platform access for wholesalers and manufacturers.';

  let kpis = [];
  if (roleFilter === 'all') {
    kpis = [
      { label: 'Total Users', value: roleScopedUsers.length, icon: Users },
      { label: 'Active Users', value: roleScopedUsers.filter((u) => !u.isBlocked).length, icon: CheckCircle },
      { label: 'Verified Users', value: roleScopedUsers.filter((u) => u.verificationStatus === 'approved').length, icon: CheckCircle },
      { label: 'Suspended Users', value: roleScopedUsers.filter((u) => u.isBlocked).length, icon: Ban },
    ];
  } else if (roleFilter === 'manufacturer') {
    kpis = [
      { label: 'Total Mfrs', value: roleScopedUsers.length, icon: Building2 },
      { label: 'Verified Mfrs', value: roleScopedUsers.filter((u) => u.verificationStatus === 'approved').length, icon: CheckCircle },
      { label: 'Pending Verif.', value: roleScopedUsers.filter((u) => u.verificationStatus === 'pending').length, icon: Users },
      { label: 'Products Listed', value: roleScopedUsers.reduce((acc, u) => acc + (u.productsCount || 0), 0), icon: Store },
    ];
  } else if (roleFilter === 'wholesaler') {
    kpis = [
      { label: 'Total Wholesalers', value: roleScopedUsers.length, icon: Store },
      { label: 'Verified Accounts', value: roleScopedUsers.filter((u) => u.verificationStatus === 'approved').length, icon: CheckCircle },
      { label: 'Active Buyers', value: roleScopedUsers.filter((u) => !u.isBlocked).length, icon: Users },
      { label: 'Orders Placed', value: roleScopedUsers.reduce((acc, u) => acc + (u.ordersCount || 0), 0), icon: CheckCircle },
    ];
  }

  const getVerificationBadge = (user) => {
    if (user.verificationStatus === 'approved') return { status: 'APPROVED', text: 'Approved' };
    if (user.verificationStatus === 'pending') return { status: 'PENDING', text: 'Pending' };
    if (user.verificationStatus === 'rejected') return { status: 'REJECTED', text: 'Rejected' };
    return { status: 'DEFAULT', text: user.verificationStatus || 'Unverified' };
  };

  return (
    <div className="max-w-6xl mx-auto w-full px-6">
      <AdminPageShell
        title={pageTitle}
        description={description}
        align="center"
        actions={
          <div className="relative w-full sm:w-96 group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] transition-colors group-focus-within:text-[#00B894]"
              size={18}
            />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-[12px] border border-[#E5E7EB] bg-white py-2.5 pl-12 pr-4 text-[14px] font-medium text-[#0F172A] shadow-sm outline-none transition-all placeholder:text-[#94A3B8] focus:border-[#00B894] focus:ring-2 focus:ring-[#00B894]/15"
            />
          </div>
        }
      >
        <div className="flex flex-wrap justify-center gap-2 border-b border-[#E5E7EB] pb-5">
          {ROLE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`inline-flex items-center gap-2 rounded-[12px] px-4 py-2.5 text-[13px] font-semibold transition-all ${
                  isActive
                    ? 'bg-[#0F172A] text-white shadow-sm'
                    : 'border border-[#E5E7EB] bg-white text-[#64748B] hover:border-[#00B894] hover:text-[#00B894]'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-2 grid grid-cols-2 gap-4 md:grid-cols-4">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} icon={kpi.icon} label={kpi.label} value={kpi.value} />
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-[18px] border border-[#E5E7EB] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left">
              <thead className="sticky top-0 z-10 border-b border-[#E5E7EB] bg-[#F8FAFC]">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">User Details</th>
                  <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Role</th>
                  <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Status</th>
                  <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Verification</th>
                  <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Joined Date</th>
                  <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Access Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] bg-white">
                {paginatedUsers.map((user) => {
                  const isSelected = selectedUser?._id === user._id;
                  const verificationBadge = getVerificationBadge(user);

                  return (
                    <tr
                      key={user._id}
                      onClick={() => setSelectedUser(user)}
                      className={`group cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[rgba(0,184,148,0.06)] shadow-[inset_3px_0_0_0_#00B894]'
                          : 'hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <UserAvatar user={user} size="md" />
                          <div className="min-w-0">
                            <div className="truncate text-[15px] font-semibold text-[#0F172A]">{user.name}</div>
                            <div className="mt-1 truncate text-[13px] text-[#64748B]">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge
                          status={user.isBlocked ? 'SUSPENDED' : 'ACTIVE'}
                          text={user.isBlocked ? 'Suspended' : 'Active'}
                        />
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge {...verificationBadge} />
                      </td>
                      <td className="px-6 py-5 font-mono text-[13px] font-medium text-[#475569]">
                        {new Date(user.createdAt || Date.now()).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleBlockToggle(user._id, user.isBlocked);
                          }}
                          className={`rounded-[10px] px-4 py-2 text-[11px] font-semibold uppercase tracking-wide transition-all ${
                            user.isBlocked
                              ? 'bg-[#10B981] text-white hover:bg-[#059669]'
                              : 'border border-[#E5E7EB] bg-white text-[#DC2626] hover:border-[rgba(239,68,68,0.25)] hover:bg-[rgba(239,68,68,0.06)]'
                          }`}
                        >
                          {user.isBlocked ? 'Activate' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-[14px] text-[#64748B]">
                      No users found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#E5E7EB] bg-[#F8FAFC] px-6 py-4">
              <div className="text-[13px] text-[#64748B]">
                Showing{' '}
                <span className="font-semibold text-[#0F172A]">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                <span className="font-semibold text-[#0F172A]">
                  {Math.min(currentPage * itemsPerPage, filteredUsers.length)}
                </span>{' '}
                of <span className="font-semibold text-[#0F172A]">{filteredUsers.length}</span> users
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="rounded-[10px] border border-[#E5E7EB] bg-white px-4 py-2 text-[13px] font-medium text-[#475569] transition-colors hover:bg-[#F8FAFC] disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="rounded-[10px] border border-[#E5E7EB] bg-white px-4 py-2 text-[13px] font-medium text-[#475569] transition-colors hover:bg-[#F8FAFC] disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </AdminPageShell>

      <AdminUserDetailDrawer
        user={selectedUser}
        products={products}
        orders={orders}
        transactions={transactions}
        onClose={() => setSelectedUser(null)}
        onBlockToggle={handleBlockToggle}
      />

      <AdminSuspendUserModal
        open={!!suspendTarget}
        user={suspendTarget}
        loading={suspendLoading}
        onCancel={() => {
          if (!suspendLoading) setSuspendTarget(null);
        }}
        onConfirm={handleSuspendConfirm}
      />
    </div>
  );
}

export default function AdminUsersManagement(props) {
  return (
    <Suspense fallback={<div className="p-8 text-[#64748B]">Loading users…</div>}>
      <AdminUsersInner {...props} />
    </Suspense>
  );
}
