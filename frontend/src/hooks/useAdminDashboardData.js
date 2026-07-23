'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '@/lib/api';
import { isAwaitingAdminReview } from '@/lib/verificationStats';
import { resolvePaymentStatus, PAYMENT_STATUS } from '@/lib/adminOperationsUtils';
import {
  Banknote, Megaphone, Package, ShieldCheck, ShoppingCart, Users,
} from 'lucide-react';

function isToday(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getDate() === now.getDate()
    && d.getMonth() === now.getMonth()
    && d.getFullYear() === now.getFullYear()
  );
}

export function formatRelativeTime(value) {
  if (!value) return '—';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '—';
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
  return new Date(value).toLocaleString('en-PK', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function sumCommissionBetween(transactions, start, end) {
  return transactions.reduce((sum, t) => {
    const when = new Date(t.timestamp || t.createdAt);
    if (Number.isNaN(when.getTime()) || when < start || when >= end) return sum;
    return sum + (t.deductedCommission || 0);
  }, 0);
}

function sumPayoutVolumeBetween(transactions, start, end) {
  return transactions.reduce((sum, t) => {
    if (t.type !== 'payout' && t.type !== 'Withdrawal') return sum;
    const when = new Date(t.timestamp || t.createdAt);
    if (Number.isNaN(when.getTime()) || when < start || when >= end) return sum;
    return sum + (t.sellerAmount || t.amount || 0);
  }, 0);
}

export function percentChange(current, previous) {
  if (!previous || previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export const OPEN_DISPUTE_STATUSES = ['open', 'awaiting_seller', 'seller_responded', 'under_review', 'investigating'];

export function getStatusLabel(status) {
  const map = {
    pending: 'Awaiting Payment',
    pending_approval: 'Pending Verification',
    verified: 'Payment Verified',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    completed: 'Completed',
    cancelled: 'Cancelled',
    rejected: 'Rejected',
  };
  return map[status?.toLowerCase()] || status || 'Unknown';
}

export function getPaymentLabel(status) {
  const map = {
    pending: 'Awaiting Payment',
    pending_approval: 'Pending Verification',
    'pending approval': 'Pending Verification',
    verified: 'Verified',
    rejected: 'Rejected',
    refunded: 'Refunded',
  };
  return map[status?.toLowerCase()] || status || 'Unknown';
}

export function normalizePaymentStatus(status) {
  const key = String(status || '').toLowerCase().replace(/\s+/g, '_');
  if (key === 'pending_approval') return 'pending_approval';
  if (key.includes('pending') && key.includes('approval')) return 'pending_approval';
  if (key === 'verified' || key.includes('payment_verified')) return 'verified';
  if (key === 'rejected') return 'rejected';
  if (key === 'refunded') return 'refunded';
  if (key === 'pending') return 'pending';
  return key || 'unknown';
}

export function isPendingPaymentReview(status) {
  const n = normalizePaymentStatus(status);
  return n === 'pending_approval';
}

export function getPaymentDisplayAmount(order) {
  if (normalizePaymentStatus(order?.paymentStatus) === 'refunded') return 0;
  return order?.totalAmount || 0;
}

export default function useAdminDashboardData() {
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [verificationOverview, setVerificationOverview] = useState(null);
  const [settings, setSettings] = useState(null);
  const [adOverview, setAdOverview] = useState(null);
  const [productsList, setProductsList] = useState([]);
  const [paymentStats, setPaymentStats] = useState(null);
  const [operationsSummary, setOperationsSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      setLoading(true);
      const [
        resOrders, resTxns, resUsers, resDisputes, resVerification,
        resSettings, resAds, resProducts,
      ] = await Promise.all([
        fetch(`${getApiBaseUrl()}/api/orders`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${getApiBaseUrl()}/api/transactions/admin`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${getApiBaseUrl()}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${getApiBaseUrl()}/api/disputes/admin`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${getApiBaseUrl()}/api/admin/verifications/overview`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${getApiBaseUrl()}/api/admin/settings`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${getApiBaseUrl()}/api/advertisements/admin/overview`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${getApiBaseUrl()}/api/products`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const jsonOrders = await resOrders.json();
      const jsonTxns = await resTxns.json();
      const jsonUsers = await resUsers.json();
      const jsonDisputes = await resDisputes.json();
      const jsonVerification = await resVerification.json();
      const jsonSettings = await resSettings.json();
      const jsonAds = await resAds.json();
      const jsonProducts = await resProducts.json();

      if (jsonOrders.success) {
        setOrders(jsonOrders.data || []);
        setPaymentStats(jsonOrders.paymentStats || null);
        setOperationsSummary(jsonOrders.operationsSummary || null);
      }
      if (jsonTxns.success) setTransactions(jsonTxns.data || []);
      if (jsonUsers.success) setUsersList(jsonUsers.data || []);
      if (jsonVerification.success) setVerificationOverview(jsonVerification.data || null);
      if (jsonSettings.success) setSettings(jsonSettings.data || null);
      if (jsonAds.success) setAdOverview(jsonAds.data || null);
      if (jsonProducts.success) setProductsList(Array.isArray(jsonProducts.data) ? jsonProducts.data : []);
      if (jsonDisputes.success) {
        setDisputes(jsonDisputes.data || []);
      } else if (!jsonDisputes.success) {
        toast.error(jsonDisputes.error || 'Could not load order issues');
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleVerify = async (orderId) => {
    if (!confirm('Approve this payment proof and mark as verified?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${getApiBaseUrl()}/api/orders/${orderId}/payment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paymentStatus: 'verified' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Order Approved!');
        fetchData();
        return true;
      }
      toast.error(data.error || 'Verification failed');
      return false;
    } catch {
      toast.error('Connection error');
      return false;
    }
  };

  const handleReject = async (orderId) => {
    if (!confirm('Reject this payment proof?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${getApiBaseUrl()}/api/orders/${orderId}/payment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paymentStatus: 'rejected' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Payment Proof Rejected.');
        fetchData();
        return true;
      }
      toast.error(data.error || 'Rejection failed');
      return false;
    } catch {
      toast.error('Connection error');
      return false;
    }
  };

  const handleMarkPaid = async (txId) => {
    if (!confirm('Mark this settlement as Paid?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${getApiBaseUrl()}/api/transactions/${txId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'Paid' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Settlement marked as Paid!');
        fetchData();
        return true;
      }
      toast.error(data.error || 'Failed to update settlement');
      return false;
    } catch {
      toast.error('Connection error');
      return false;
    }
  };

  const pendingPaymentReviews = useMemo(
    () => orders.filter((o) => resolvePaymentStatus(o) === PAYMENT_STATUS.PENDING_VERIFICATION),
    [orders]
  );

  const pendingPayouts = useMemo(
    () => transactions.filter((t) => (t.type === 'payout' || t.type === 'Withdrawal') && t.status === 'Pending'),
    [transactions]
  );

  const activeDisputes = useMemo(
    () => disputes.filter((d) => OPEN_DISPUTE_STATUSES.includes(d.status)),
    [disputes]
  );

  const commissionEarned = useMemo(
    () =>
      transactions.reduce((sum, t) => sum + (t.deductedCommission || 0), 0)
      || orders.reduce((sum, o) => sum + (o.platformCommissionTotal || 0), 0),
    [transactions, orders]
  );

  const pendingPayoutAmount = useMemo(
    () => pendingPayouts.reduce((sum, t) => sum + (t.sellerAmount || t.amount || 0), 0),
    [pendingPayouts]
  );

  const payoutsList = useMemo(
    () =>
      [...transactions]
        .filter((t) => t.type === 'payout' || t.sellerAmount != null)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [transactions]
  );

  const startOfToday = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const startOfMonth = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayRevenue = useMemo(
    () =>
      transactions.reduce((sum, t) => {
        const when = new Date(t.timestamp || t.createdAt);
        if (Number.isNaN(when.getTime()) || when < startOfToday) return sum;
        return sum + (t.deductedCommission || 0);
      }, 0),
    [transactions, startOfToday]
  );

  const monthlyRevenue = useMemo(
    () =>
      transactions.reduce((sum, t) => {
        const when = new Date(t.timestamp || t.createdAt);
        if (Number.isNaN(when.getTime()) || when < startOfMonth) return sum;
        return sum + (t.deductedCommission || 0);
      }, 0),
    [transactions, startOfMonth]
  );

  const pendingBusinessVerifications =
    verificationOverview?.stats?.pending ??
    usersList.filter((u) => isAwaitingAdminReview(u)).length;

  const overviewMetrics = useMemo(() => {
    const now = Date.now();
    const fortyEightHours = 48 * 60 * 60 * 1000;
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    const activeManufacturers = usersList.filter((u) => u.role === 'manufacturer').length;
    const activeWholesalers = usersList.filter((u) => u.role === 'wholesaler').length;

    const staleVerifications = (verificationOverview?.pendingUsers || usersList.filter(isAwaitingAdminReview))
      .filter((u) => {
        const submitted = new Date(u.verificationSubmittedAt || u.createdAt).getTime();
        return !Number.isNaN(submitted) && now - submitted >= fortyEightHours;
      }).length;

    const oldPayouts = pendingPayouts.filter((t) => {
      const created = new Date(t.createdAt || t.timestamp).getTime();
      return !Number.isNaN(created) && now - created >= threeDays;
    }).length;

    const priorityAlerts = [];
    if (staleVerifications > 0) {
      priorityAlerts.push({
        id: 'verification-stale',
        message: `${staleVerifications} verification request${staleVerifications !== 1 ? 's' : ''} waiting 48+ hours`,
        tone: 'amber',
      });
    }
    if (oldPayouts > 0) {
      priorityAlerts.push({
        id: 'payout-stale',
        message: `${oldPayouts} payout${oldPayouts !== 1 ? 's' : ''} pending 3+ days`,
        tone: 'amber',
      });
    }
    if (activeDisputes.length > 0) {
      priorityAlerts.push({
        id: 'disputes-open',
        message: `${activeDisputes.length} unresolved dispute${activeDisputes.length !== 1 ? 's' : ''} require attention`,
        tone: 'rose',
      });
    }
    if (pendingPaymentReviews.length > 0) {
      priorityAlerts.push({
        id: 'escrow-review',
        message: `${pendingPaymentReviews.length} escrow payment review${pendingPaymentReviews.length !== 1 ? 's' : ''} pending`,
        tone: 'rose',
      });
    }
    if ((adOverview?.pendingApproval || 0) > 0) {
      priorityAlerts.push({
        id: 'ads-pending',
        message: `${adOverview.pendingApproval} advertisement${adOverview.pendingApproval !== 1 ? 's' : ''} awaiting approval`,
        tone: 'amber',
      });
    }
    if (priorityAlerts.length === 0) {
      priorityAlerts.push({
        id: 'all-clear',
        message: 'No open disputes — platform operating normally',
        tone: 'emerald',
      });
    }

    const paymentsApprovedToday = orders.filter(
      (o) => o.paymentStatus === 'verified' && isToday(o.updatedAt || o.createdAt)
    ).length;
    const paymentsRejectedToday = orders.filter(
      (o) => o.paymentStatus === 'rejected' && isToday(o.updatedAt || o.createdAt)
    ).length;
    const payoutsApprovedToday = transactions.filter(
      (t) => (t.status === 'Paid' || t.status === 'completed') && isToday(t.updatedAt || t.createdAt || t.timestamp)
    ).length;

    const categoryCount = new Set(
      productsList.map((p) => p.category).filter(Boolean)
    ).size;

    const nonAdminUsers = usersList.filter((u) => u.role !== 'admin');
    const disabledAccounts = nonAdminUsers.filter((u) => u.isBlocked).length;

    const activeOrderStatuses = ['pending', 'pending_approval', 'processing', 'shipped', 'verified'];
    const activeOrders = orders.filter((o) => activeOrderStatuses.includes(o.status)).length;
    // Count orders with payment held in escrow (Stripe lifecycle)
    const escrowOrderCount = orders.filter(
      (o) =>
        o.paymentStatus === 'Held'
        || o.paymentStatus === 'Holding'
        || o.paymentStatus === 'pending_approval'
        || o.paymentStatus === 'verified'
        || o.paymentStatus === 'Pending Approval'
    ).length;

    const pendingIssues =
      pendingBusinessVerifications
      + pendingPaymentReviews.length
      + pendingPayouts.length
      + activeDisputes.length
      + (adOverview?.pendingApproval || 0);

    const advertisementRevenue = adOverview?.revenueGenerated || adOverview?.totalRevenue || 0;
    const approvedAds = Math.max(
      0,
      (adOverview?.totalCampaigns || 0) - (adOverview?.pendingApproval || 0)
    );

    const totalOrders = orders.length;
    const totalRevenueAllTime = commissionEarned + advertisementRevenue;

    const nowDate = new Date();
    const lastMonthStart = new Date(nowDate.getFullYear(), nowDate.getMonth() - 1, 1);
    const lastMonthEnd = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1);
    const lastMonthRevenue = sumCommissionBetween(transactions, lastMonthStart, lastMonthEnd);
    const lastMonthPayoutVolume = sumPayoutVolumeBetween(transactions, lastMonthStart, lastMonthEnd);
    const thisMonthPayoutVolume = sumPayoutVolumeBetween(transactions, startOfMonth, new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 1));
    const daysInLastMonth = new Date(nowDate.getFullYear(), nowDate.getMonth(), 0).getDate();
    const lastMonthDailyAvg = lastMonthRevenue / Math.max(daysInLastMonth, 1);
    const thisMonthCommission = monthlyRevenue;

    const financialTrends = {
      todayRevenue: percentChange(todayRevenue, lastMonthDailyAvg),
      monthlyRevenue: percentChange(monthlyRevenue, lastMonthRevenue),
      commissionEarned: percentChange(thisMonthCommission, lastMonthRevenue),
      escrowBalance: percentChange(
        orders.filter(o => o.paymentStatus === 'Held' || o.paymentStatus === 'Holding').length,
        orders.filter(o => o.paymentStatus === 'Released').length
      ),
      pendingPayoutAmount: percentChange(thisMonthPayoutVolume, lastMonthPayoutVolume),
    };

    const totalActionPending =
      pendingBusinessVerifications
      + pendingPaymentReviews.length
      + pendingPayouts.length
      + (adOverview?.pendingApproval || 0)
      + activeDisputes.length;

    const highPriorityCount = priorityAlerts.filter((a) => a.id !== 'all-clear').length;

    const actionCenterSummary = {
      totalPending: totalActionPending,
      highPriority: highPriorityCount,
      updatedLabel: 'Now',
    };

    const activityItems = [];

    usersList
      .filter((u) => u.verificationSubmittedAt)
      .sort((a, b) => new Date(b.verificationSubmittedAt) - new Date(a.verificationSubmittedAt))
      .slice(0, 4)
      .forEach((u) => {
        activityItems.push({
          id: `verify-${u._id}`,
          at: u.verificationSubmittedAt,
          icon: ShieldCheck,
          tone: 'bg-emerald-100 text-emerald-700',
          title: `New verification submitted by ${u.businessDetails?.businessName || u.name || 'Business'}`,
        });
      });

    pendingPaymentReviews.slice(0, 3).forEach((order) => {
      activityItems.push({
        id: `payment-${order._id}`,
        at: order.updatedAt || order.createdAt,
        icon: Banknote,
        tone: 'bg-amber-100 text-amber-700',
        title: `Payment proof uploaded for order #${order._id.slice(-6).toUpperCase()}`,
      });
    });

    pendingPayouts.slice(0, 3).forEach((tx) => {
      activityItems.push({
        id: `payout-${tx._id}`,
        at: tx.createdAt || tx.timestamp,
        icon: Banknote,
        tone: 'bg-orange-100 text-orange-700',
        title: `Seller earnings pending release for ${tx.seller?.name || 'seller'}`,
      });
    });

    if ((adOverview?.pendingApproval || 0) > 0) {
      activityItems.push({
        id: 'ads-pending',
        at: new Date().toISOString(),
        icon: Megaphone,
        tone: 'bg-emerald-100 text-emerald-700',
        title: `${adOverview.pendingApproval} advertisement${adOverview.pendingApproval !== 1 ? 's' : ''} awaiting approval`,
      });
    }

    usersList
      .filter((u) => u.isBlocked)
      .slice(0, 2)
      .forEach((u) => {
        activityItems.push({
          id: `blocked-${u._id}`,
          at: u.updatedAt || u.createdAt,
          icon: Users,
          tone: 'bg-rose-100 text-rose-700',
          title: `User account suspended: ${u.name || u.email}`,
        });
      });

    [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3)
      .forEach((order) => {
        activityItems.push({
          id: `order-${order._id}`,
          at: order.createdAt,
          icon: ShoppingCart,
          tone: 'bg-slate-100 text-slate-700',
          title: `New order placed #${order._id.slice(-6).toUpperCase()} by ${order.buyer?.name || 'buyer'}`,
        });
      });

    const activityFeed = activityItems
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 10)
      .map((item) => ({
        ...item,
        time: formatRelativeTime(item.at),
      }));

    return {
      pendingBusinessVerifications,
      pendingPaymentReviews: pendingPaymentReviews.length,
      pendingPayouts: pendingPayouts.length,
      pendingPayoutAmount,
      openDisputes: activeDisputes.length,
      pendingAdvertisements: adOverview?.pendingApproval || 0,
      todayRevenue,
      monthlyRevenue,
      commissionEarned,
      advertisementRevenue,
      escrowBalance: orders.filter(o => o.paymentStatus === 'Held' || o.paymentStatus === 'Holding').reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      manufacturers: activeManufacturers,
      wholesalers: activeWholesalers,
      products: productsList.length,
      categories: categoryCount,
      advertisements: adOverview?.totalCampaigns || adOverview?.activeCampaigns || 0,
      sponsoredAds: adOverview?.activeCampaigns || 0,
      commissionSummary: {
        productRate: settings?.platformFeePercentage ?? 0,
        adCommissionLabel: 'Plan-based pricing',
        enabled: settings?.commissionEnabled !== false,
      },
      verificationSnapshot: {
        pending: verificationOverview?.stats?.pending ?? pendingBusinessVerifications,
        approved: verificationOverview?.stats?.approved ?? usersList.filter((u) => u.verificationStatus === 'approved').length,
        rejected: verificationOverview?.stats?.rejected ?? usersList.filter((u) => u.verificationStatus === 'rejected').length,
      },
      paymentSnapshot: {
        pending: pendingPaymentReviews.length,
        approvedToday: paymentsApprovedToday,
        rejectedToday: paymentsRejectedToday,
      },
      payoutSnapshot: {
        pending: pendingPayouts.length,
        approvedToday: payoutsApprovedToday,
        totalPendingAmount: pendingPayoutAmount,
      },
      adSnapshot: {
        pending: adOverview?.pendingApproval || 0,
        approved: approvedAds,
        active: adOverview?.activeCampaigns || 0,
      },
      userSnapshot: {
        total: nonAdminUsers.length,
        manufacturers: activeManufacturers,
        wholesalers: activeWholesalers,
        disabled: disabledAccounts,
      },
      systemHealth: {
        activeOrders,
        escrowOrders: escrowOrderCount,
        pendingIssues,
        status: pendingIssues > 0 ? 'attention' : 'healthy',
        statusLabel: pendingIssues > 0 ? 'Attention needed' : 'All systems operational',
      },
      platformGlance: {
        totalUsers: nonAdminUsers.length,
        totalOrders,
        totalRevenueAllTime,
        totalCommissionAllTime: commissionEarned,
      },
      activityFeed,
      priorityAlerts,
      actionCenterSummary,
      financialTrends,
    };
  }, [
    verificationOverview,
    usersList,
    pendingPaymentReviews,
    pendingPayouts,
    activeDisputes,
    adOverview,
    todayRevenue,
    monthlyRevenue,
    commissionEarned,
    pendingPayoutAmount,
    productsList,
    pendingBusinessVerifications,
    settings,
    orders,
    transactions,
  ]);

  const revenueMetrics = useMemo(() => {
    const adRevenue = adOverview?.totalRevenue || adOverview?.revenue || 0;
    const pendingRevenue = pendingPayoutAmount;
    return {
      totalRevenue: commissionEarned + (adRevenue || 0),
      commissionRevenue: commissionEarned,
      advertisementRevenue: adRevenue,
      pendingRevenue,
      todayRevenue,
      monthlyRevenue,
      escrowBalance: orders.filter(o => o.paymentStatus === 'Held' || o.paymentStatus === 'Holding').reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    };
  }, [commissionEarned, adOverview, pendingPayoutAmount, todayRevenue, monthlyRevenue, orders]);

  return {
    loading,
    fetchData,
    orders,
    transactions,
    usersList,
    disputes,
    productsList,
    settings,
    adOverview,
    paymentStats,
    operationsSummary,
    pendingPaymentReviews,
    pendingPayouts,
    activeDisputes,
    payoutsList,
    commissionEarned,
    overviewMetrics,
    revenueMetrics,
    handleVerify,
    handleReject,
    handleMarkPaid,
    getStatusLabel,
    getPaymentLabel,
  };
}
