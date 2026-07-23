'use client';

import Link from 'next/link';
import {
  X,
  User,
  ShieldCheck,
  CreditCard,
  BarChart3,
  Settings2,
  Ban,
  CheckCircle,
  Package,
  ShoppingCart,
  Receipt,
  Building2,
  Store,
  FileText,
  Clock,
  Mail,
  Phone,
  Calendar,
} from 'lucide-react';
import UserAvatar from '@/components/ui/UserAvatar';
import { formatPKR } from '@/lib/financeUtils';

function resolveId(ref) {
  if (!ref) return null;
  return String(ref._id || ref);
}

function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function hasBankDetails(details) {
  if (!details) return false;
  return Boolean(
    details.bankName ||
      details.accountTitle ||
      details.accountNumber ||
      details.iban
  );
}

function hasMobileWallet(details) {
  if (!details) return false;
  return Boolean(details.jazzCashNumber || details.easypaisaNumber);
}

function hasPaymentInformation(details) {
  return hasBankDetails(details) || hasMobileWallet(details);
}

export function getUserMarketplaceStats(user, products = [], orders = [], transactions = []) {
  if (!user?._id) {
    return {
      totalProducts: 0,
      activeListings: 0,
      sponsoredListings: 0,
      ordersCount: 0,
      revenueGenerated: 0,
    };
  }

  const userId = resolveId(user);
  const userProducts = products.filter((product) => {
    const sellerId = resolveId(product.seller || product.manufacturer);
    return sellerId === userId;
  });

  const userOrders = orders.filter((order) => {
    const buyerId = resolveId(order.buyer);
    const manufacturerId = resolveId(order.manufacturer);
    if (buyerId === userId || manufacturerId === userId) return true;
    return (order.items || []).some((item) => resolveId(item.seller) === userId);
  });

  const orderRevenue = userOrders.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0);
  const transactionRevenue = transactions
    .filter((tx) => resolveId(tx.seller) === userId)
    .reduce((sum, tx) => sum + (Number(tx.sellerAmount) || Number(tx.amount) || 0), 0);

  return {
    totalProducts: userProducts.length,
    activeListings: userProducts.filter((product) => product.isActive !== false).length,
    sponsoredListings: userProducts.filter((product) => product.isSponsored === true || product.sponsored === true).length,
    ordersCount: userOrders.length,
    revenueGenerated: Math.max(orderRevenue, transactionRevenue),
  };
}

function StatusBadge({ status, text }) {
  const styles = {
    ACTIVE: 'bg-[rgba(16,185,129,0.12)] text-[#047857] border-[rgba(16,185,129,0.25)]',
    APPROVED: 'bg-[rgba(16,185,129,0.12)] text-[#047857] border-[rgba(16,185,129,0.25)]',
    SUSPENDED: 'bg-[rgba(239,68,68,0.12)] text-[#DC2626] border-[rgba(239,68,68,0.25)]',
    PENDING: 'bg-[rgba(245,158,11,0.12)] text-[#B45309] border-[rgba(245,158,11,0.25)]',
    REJECTED: 'bg-[rgba(239,68,68,0.12)] text-[#DC2626] border-[rgba(239,68,68,0.25)]',
    DEFAULT: 'bg-[#F8FAFC] text-[#475569] border-[#E5E7EB]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
        styles[status] || styles.DEFAULT
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {text}
    </span>
  );
}

function RoleBadge({ role }) {
  if (role === 'manufacturer') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(59,130,246,0.25)] bg-[rgba(59,130,246,0.12)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#1D4ED8]">
        <Building2 size={12} />
        Manufacturer
      </span>
    );
  }

  if (role === 'wholesaler') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(168,85,247,0.25)] bg-[rgba(168,85,247,0.12)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#7C3AED]">
        <Store size={12} />
        Wholesaler
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-[#E5E7EB] bg-[#F8FAFC] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#475569]">
      {role || 'User'}
    </span>
  );
}

function DrawerSection({ title, icon: Icon, children }) {
  return (
    <section className="rounded-[16px] border border-[#E5E7EB] bg-white overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-2.5 border-b border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3">
        <div className="grid h-8 w-8 place-items-center rounded-[10px] border border-[#E5E7EB] bg-white text-[#00B894]">
          <Icon size={15} strokeWidth={1.75} />
        </div>
        <h3 className="text-[13px] font-semibold text-[#0F172A]">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function DetailField({ label, value, icon: Icon, mono = false }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">{label}</p>
      <div className="mt-1.5 flex items-start gap-2">
        {Icon ? <Icon size={14} className="mt-0.5 shrink-0 text-[#94A3B8]" /> : null}
        <p
          className={`text-[14px] font-semibold text-[#0F172A] break-words ${
            mono ? 'font-mono text-[#475569]' : ''
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function MetricTile({ label, value }) {
  return (
    <div className="rounded-[12px] border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">{label}</p>
      <p className="mt-1.5 text-[20px] font-bold tabular-nums text-[#0F172A]">{value}</p>
    </div>
  );
}

function getVerificationStatusMeta(status) {
  const normalized = String(status || 'unverified').toLowerCase();
  if (normalized === 'approved') return { status: 'APPROVED', text: 'Approved' };
  if (normalized === 'pending') return { status: 'PENDING', text: 'Pending' };
  if (normalized === 'rejected') return { status: 'REJECTED', text: 'Rejected' };
  if (normalized === 'business_required') return { status: 'PENDING', text: 'Business Required' };
  return { status: 'DEFAULT', text: 'Unverified' };
}

export default function AdminUserDetailDrawer({
  user,
  products = [],
  orders = [],
  transactions = [],
  onClose,
  onBlockToggle,
}) {
  if (!user) return null;

  const business = user.businessDetails || {};
  const payment = user.paymentDetails || {};
  const marketplace = getUserMarketplaceStats(user, products, orders, transactions);
  const verificationMeta = getVerificationStatusMeta(user.verificationStatus);
  const accountStatus = user.isBlocked ? { status: 'SUSPENDED', text: 'Suspended' } : { status: 'ACTIVE', text: 'Active' };
  const businessType =
    business.sellerType && business.sellerType !== 'none'
      ? business.sellerType
      : user.role;

  const approvalHistory = [];
  if (user.verificationSubmittedAt) {
    approvalHistory.push(`Submitted on ${formatDateTime(user.verificationSubmittedAt)}`);
  }
  if (user.verificationReviewedAt) {
    approvalHistory.push(
      `Reviewed on ${formatDateTime(user.verificationReviewedAt)} — ${verificationMeta.text}`
    );
  }
  if (user.verificationRejectionReason) {
    approvalHistory.push(`Rejection reason: ${user.verificationRejectionReason}`);
  }
  if (user.verificationAdminNotes) {
    approvalHistory.push(`Admin notes: ${user.verificationAdminNotes}`);
  }

  return (
    <div className="fixed inset-0 z-[120]">
      <button
        type="button"
        aria-label="Close user details"
        className="absolute inset-0 bg-[#0F172A]/45 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[680px] flex-col border-l border-[#E5E7EB] bg-white shadow-[-24px_0_64px_rgba(15,23,42,0.16)] animate-in slide-in-from-right duration-300">
        <div className="shrink-0 border-b border-[#E5E7EB] bg-[#0F172A] px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              <UserAvatar user={user} size="lg" rounded="md" variant="dark" className="border-white/10" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  User Profile
                </p>
                <h2 className="mt-1 truncate text-[22px] font-bold tracking-tight">{user.name || 'Unknown User'}</h2>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <RoleBadge role={user.role} />
                  <StatusBadge {...accountStatus} />
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border border-white/10 bg-white/10 text-slate-300 transition-colors hover:bg-white/15 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
          <div className="space-y-4 p-5">
            <DrawerSection title="Profile" icon={User}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailField label="Full Name" value={user.name || 'Unknown'} icon={User} />
                <DetailField label="Email" value={user.email || 'Not provided'} icon={Mail} />
                <DetailField label="Phone Number" value={business.phone || 'Not provided'} icon={Phone} mono />
                <DetailField label="Role" value={user.role || '—'} />
                <DetailField label="Join Date" value={formatDate(user.createdAt) || 'Not recorded'} icon={Calendar} />
                <DetailField label="Last Login" value="Not recorded" icon={Clock} />
                <div className="sm:col-span-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Account Status</p>
                  <div className="mt-2">
                    <StatusBadge {...accountStatus} />
                    {user.isBlocked && user.blockReason && (
                      <p className="mt-2 text-[13px] text-[#DC2626] font-medium bg-[rgba(239,68,68,0.06)] p-3 rounded-[10px] border border-[rgba(239,68,68,0.2)]">
                        <strong>Reason:</strong> {user.blockReason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </DrawerSection>

            <DrawerSection title="Verification" icon={ShieldCheck}>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge {...verificationMeta} />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DetailField label="Business Name" value={business.businessName || 'Not provided'} />
                  <DetailField label="Business Type" value={businessType || 'Not provided'} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                    Submitted Documents
                  </p>
                  {business.businessLicense ? (
                    <div className="mt-2 inline-flex items-center gap-2 rounded-[12px] border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2">
                      <FileText size={15} className="text-[#00B894]" />
                      <span className="text-[13px] font-medium text-[#0F172A] break-all">
                        Business license on file
                      </span>
                    </div>
                  ) : (
                    <p className="mt-2 text-[14px] font-medium italic text-[#64748B]">No documents submitted</p>
                  )}
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                    Approval History
                  </p>
                  {approvalHistory.length > 0 ? (
                    <ul className="mt-2 space-y-2">
                      {approvalHistory.map((entry) => (
                        <li
                          key={entry}
                          className="rounded-[12px] border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2 text-[13px] leading-relaxed text-[#475569]"
                        >
                          {entry}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-[14px] font-medium italic text-[#64748B]">No approval history yet</p>
                  )}
                </div>
              </div>
            </DrawerSection>

            <DrawerSection title="Payment Information" icon={CreditCard}>
              {hasPaymentInformation(payment) ? (
                <div className="space-y-5">
                  <div>
                    <p className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-[#64748B]">
                      Bank Details
                    </p>
                    {hasBankDetails(payment) ? (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <DetailField label="Bank Name" value={payment.bankName || '—'} mono />
                        <DetailField label="Account Title" value={payment.accountTitle || '—'} mono />
                        <DetailField label="Account Number" value={payment.accountNumber || '—'} mono />
                        <DetailField label="IBAN" value={payment.iban || '—'} mono />
                      </div>
                    ) : (
                      <p className="text-[14px] font-medium italic text-[#64748B]">No bank details provided</p>
                    )}
                  </div>

                  <div>
                    <p className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-[#64748B]">
                      Mobile Wallets
                    </p>
                    {hasMobileWallet(payment) ? (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <DetailField label="JazzCash" value={payment.jazzCashNumber || '—'} mono />
                        <DetailField label="Easypaisa" value={payment.easypaisaNumber || '—'} mono />
                      </div>
                    ) : (
                      <p className="text-[14px] font-medium italic text-[#64748B]">No mobile wallet configured</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-[14px] font-medium italic text-[#64748B]">No payment information configured</p>
              )}
            </DrawerSection>

            {user.role === 'manufacturer' && (
              <DrawerSection title="Payout Information" icon={CreditCard}>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      status={user.payoutDetails?.isConfigured ? 'APPROVED' : 'PENDING'}
                      text={user.payoutDetails?.isConfigured ? 'Configured' : 'Not Configured'}
                    />
                  </div>
                  {user.payoutDetails?.isConfigured ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <DetailField label="Preferred Method" value={user.payoutDetails.method || '—'} />
                      <DetailField label="Account Title" value={user.payoutDetails.accountTitle || '—'} mono />
                      {user.payoutDetails.method === 'Bank Transfer' ? (
                        <>
                          <DetailField label="Bank Name" value={user.payoutDetails.bankName || '—'} mono />
                          <DetailField label="IBAN / Account Number" value={user.payoutDetails.iban || '—'} mono />
                          <DetailField label="Account Number" value={user.payoutDetails.accountNumber || '—'} mono />
                        </>
                      ) : (
                        <DetailField label="Wallet Number (Mobile)" value={user.payoutDetails.walletNumber || '—'} mono />
                      )}
                    </div>
                  ) : (
                    <p className="text-[14px] font-medium italic text-[#64748B]">No payout settings configured by seller</p>
                  )}
                </div>
              </DrawerSection>
            )}

            <DrawerSection title="Marketplace Activity" icon={BarChart3}>
              <div className="grid grid-cols-2 gap-3">
                <MetricTile label="Total Products" value={marketplace.totalProducts} />
                <MetricTile label="Active Listings" value={marketplace.activeListings} />
                <MetricTile label="Sponsored Listings" value={marketplace.sponsoredListings} />
                <MetricTile label="Orders Count" value={marketplace.ordersCount} />
                <div className="col-span-2 rounded-[12px] border border-[rgba(0,184,148,0.25)] bg-[rgba(0,184,148,0.08)] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#047857]">
                    Revenue Generated
                  </p>
                  <p className="mt-1.5 text-[22px] font-bold tabular-nums text-[#0F172A]">
                    {formatPKR(marketplace.revenueGenerated)}
                  </p>
                </div>
              </div>
            </DrawerSection>

            <DrawerSection title="Admin Actions" icon={Settings2}>
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => onBlockToggle(user._id, user.isBlocked)}
                  className={`inline-flex items-center justify-center gap-2 rounded-[12px] px-4 py-2.5 text-[13px] font-semibold transition-colors ${
                    user.isBlocked
                      ? 'bg-[#10B981] text-white hover:bg-[#059669]'
                      : 'border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.08)] text-[#DC2626] hover:bg-[rgba(239,68,68,0.12)]'
                  }`}
                >
                  {user.isBlocked ? <CheckCircle size={16} /> : <Ban size={16} />}
                  {user.isBlocked ? 'Activate User' : 'Suspend User'}
                </button>

                <Link
                  href={`/admin/products?seller=${user._id}&sellerName=${encodeURIComponent(user.name || '')}`}
                  onClick={onClose}
                  className="inline-flex items-center justify-center gap-2 rounded-[12px] border border-[#E5E7EB] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#0F172A] transition-colors hover:bg-[#F8FAFC]"
                >
                  <Package size={16} className="text-[#00B894]" />
                  View Products
                </Link>

                <Link
                  href={`/admin/orders?seller=${user._id}&sellerName=${encodeURIComponent(user.name || '')}`}
                  onClick={onClose}
                  className="inline-flex items-center justify-center gap-2 rounded-[12px] border border-[#E5E7EB] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#0F172A] transition-colors hover:bg-[#F8FAFC]"
                >
                  <ShoppingCart size={16} className="text-[#00B894]" />
                  View Orders
                </Link>

                <Link
                  href={`/admin/transactions?seller=${user._id}&sellerName=${encodeURIComponent(user.name || '')}`}
                  onClick={onClose}
                  className="inline-flex items-center justify-center gap-2 rounded-[12px] border border-[#E5E7EB] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#0F172A] transition-colors hover:bg-[#F8FAFC]"
                >
                  <Receipt size={16} className="text-[#00B894]" />
                  View Transactions
                </Link>
              </div>
            </DrawerSection>
          </div>
        </div>
      </aside>
    </div>
  );
}

export { StatusBadge, RoleBadge, getInitials };
