/**
 * Frontend operations status utilities — mirrors backend/utils/operationStatus.js.
 * Prefer API-resolved fields (resolvedPaymentStatus, resolvedPayoutStatus) when present.
 */

export const PAYMENT_STATUS = {
  PENDING_VERIFICATION: 'pending_verification',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  REFUNDED: 'refunded',
  AWAITING_PAYMENT: 'awaiting_payment',
};

export const PAYOUT_STATUS = {
  HOLDING: 'Holding',
  APPROVED: 'Approved',
  REFUNDED: 'Refunded',
};

export const PAYMENT_STATUS_LABELS = {
  pending_verification: 'Pending Verification',
  verified: 'Verified',
  rejected: 'Rejected',
  refunded: 'Refunded To Buyer',
  awaiting_payment: 'Awaiting Payment',
};

export const PAYOUT_STATUS_LABELS = {
  Holding: 'Holding',
  Approved: 'Approved',
  Refunded: 'Refunded',
};

export function normalizePaymentStatus(status) {
  const key = String(status || '').toLowerCase().replace(/\s+/g, '_');
  const map = {
    pending_payment: PAYMENT_STATUS.AWAITING_PAYMENT,
    pending: PAYMENT_STATUS.AWAITING_PAYMENT,
    pending_approval: PAYMENT_STATUS.PENDING_VERIFICATION,
    verified: PAYMENT_STATUS.VERIFIED,
    payment_verified: PAYMENT_STATUS.VERIFIED,
    rejected: PAYMENT_STATUS.REJECTED,
    refunded: PAYMENT_STATUS.REFUNDED,
    pending_verification: PAYMENT_STATUS.PENDING_VERIFICATION,
  };
  if (map[key]) return map[key];
  if (key.includes('pending') && key.includes('approval')) return PAYMENT_STATUS.PENDING_VERIFICATION;
  if (key.includes('payment') && key.includes('verified')) return PAYMENT_STATUS.VERIFIED;
  if (key.includes('refund')) return PAYMENT_STATUS.REFUNDED;
  if (key.includes('reject')) return PAYMENT_STATUS.REJECTED;
  return PAYMENT_STATUS.AWAITING_PAYMENT;
}

export function resolvePaymentStatus(order) {
  if (!order) return PAYMENT_STATUS.AWAITING_PAYMENT;
  if (order.resolvedPaymentStatus) return order.resolvedPaymentStatus;

  if (normalizePaymentStatus(order.paymentStatus) === PAYMENT_STATUS.REFUNDED) {
    return PAYMENT_STATUS.REFUNDED;
  }

  const orderStatus = String(order.status || '').toLowerCase();
  if (['cancelled', 'refunded'].includes(orderStatus)) return PAYMENT_STATUS.REFUNDED;

  if (Array.isArray(order.sellerStats) && order.sellerStats.length > 0) {
    const allRefunded = order.sellerStats.every((s) => String(s.status || '').toLowerCase() === 'refunded');
    if (allRefunded) return PAYMENT_STATUS.REFUNDED;
  }

  const normalized = normalizePaymentStatus(order.paymentStatus);
  if (normalized === PAYMENT_STATUS.REJECTED) return PAYMENT_STATUS.REJECTED;
  if (normalized === PAYMENT_STATUS.PENDING_VERIFICATION) return PAYMENT_STATUS.PENDING_VERIFICATION;
  if (normalized === PAYMENT_STATUS.VERIFIED || order.isPaymentVerified) return PAYMENT_STATUS.VERIFIED;
  if (order.paymentProof) return PAYMENT_STATUS.PENDING_VERIFICATION;

  return normalized;
}

export function getPaymentStatusLabel(orderOrStatus) {
  if (typeof orderOrStatus === 'object' && orderOrStatus?.paymentStatusLabel) {
    return orderOrStatus.paymentStatusLabel;
  }
  const status = typeof orderOrStatus === 'object'
    ? resolvePaymentStatus(orderOrStatus)
    : orderOrStatus;
  return PAYMENT_STATUS_LABELS[status] || PAYMENT_STATUS_LABELS.awaiting_payment;
}

export function isPaymentReviewRecord(order) {
  const resolved = resolvePaymentStatus(order);
  if (resolved === PAYMENT_STATUS.AWAITING_PAYMENT && !order.paymentProof) return false;
  return [
    PAYMENT_STATUS.PENDING_VERIFICATION,
    PAYMENT_STATUS.VERIFIED,
    PAYMENT_STATUS.REJECTED,
    PAYMENT_STATUS.REFUNDED,
  ].includes(resolved);
}

export function normalizePayoutStatus(status, payout) {
  if (payout?.resolvedPayoutStatus) return payout.resolvedPayoutStatus;
  const key = String(status || '').trim();
  const map = {
    Pending: PAYOUT_STATUS.HOLDING,
    Holding: PAYOUT_STATUS.HOLDING,
    Paid: PAYOUT_STATUS.APPROVED,
    Approved: PAYOUT_STATUS.APPROVED,
    Cancelled: PAYOUT_STATUS.REFUNDED,
    Refunded: PAYOUT_STATUS.REFUNDED,
  };
  if (map[key]) return map[key];

  if (payout) {
    const order = payout.order || {};
    if (resolvePaymentStatus(order) === PAYMENT_STATUS.REFUNDED) return PAYOUT_STATUS.REFUNDED;
    const orderStatus = String(order.status || '').toLowerCase();
    const paymentOk =
      order.isPaymentVerified
      || resolvePaymentStatus(order) === PAYMENT_STATUS.VERIFIED;
    if (['completed', 'delivered'].includes(orderStatus) && paymentOk) {
      return PAYOUT_STATUS.APPROVED;
    }
  }

  return PAYOUT_STATUS.HOLDING;
}

export function getPayoutStatusLabel(payoutOrStatus) {
  if (typeof payoutOrStatus === 'object' && payoutOrStatus?.payoutStatusLabel) {
    return payoutOrStatus.payoutStatusLabel;
  }
  const status = typeof payoutOrStatus === 'object'
    ? normalizePayoutStatus(payoutOrStatus.status, payoutOrStatus)
    : payoutOrStatus;
  return PAYOUT_STATUS_LABELS[status] || PAYOUT_STATUS_LABELS.Holding;
}

export function getPaymentDisplayAmount(order) {
  if (order?.displayAmount != null) return Number(order.displayAmount) || 0;
  if (resolvePaymentStatus(order) === PAYMENT_STATUS.REFUNDED) return 0;
  return Number(order?.totalAmount) || 0;
}

export function getPayoutDisplayAmounts(payout) {
  if (payout?.displayAmounts) return payout.displayAmounts;
  const status = normalizePayoutStatus(payout?.status, payout);
  if (status === PAYOUT_STATUS.REFUNDED) {
    return { gross: 0, commission: 0, net: 0 };
  }
  return {
    gross: Number(payout?.grossAmount) || 0,
    commission: Number(payout?.commission) || 0,
    net: Number(payout?.netAmount) || 0,
  };
}

export function formatPKR(amount) {
  const n = Number(amount) || 0;
  return `PKR ${n.toLocaleString()}`;
}

export function matchesSearch(query, fields = []) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  return fields
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(q);
}

export function inDateRange(value, from, to) {
  if (!from && !to) return true;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  if (from) {
    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    if (d < start) return false;
  }
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    if (d > end) return false;
  }
  return true;
}

export function inAmountRange(amount, min, max) {
  const n = Number(amount) || 0;
  if (min !== '' && min != null && n < Number(min)) return false;
  if (max !== '' && max != null && n > Number(max)) return false;
  return true;
}

export const DISPUTE_STATUS_LABELS = {
  open: 'Open',
  awaiting_seller: 'Waiting Seller Response',
  seller_responded: 'Waiting Buyer Response',
  under_review: 'Under Review',
  investigating: 'Under Review',
  refunded: 'Refunded',
  rejected: 'Rejected',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const OPEN_DISPUTE_STATUSES = ['open', 'awaiting_seller', 'seller_responded', 'under_review', 'investigating'];

export function getDisputeStatusLabel(status) {
  return DISPUTE_STATUS_LABELS[status] || status?.replace(/_/g, ' ') || 'Unknown';
}

export function mapEscrowAdminStatus(status, orderRefunded = false) {
  if (orderRefunded) return 'Refunded';
  const key = String(status || '').toUpperCase();
  if (['IN_ESCROW', 'PAID', 'PENDING', 'DELIVERED'].includes(key)) return 'Active';
  if (key === 'RELEASED') return 'Released';
  if (key === 'REFUNDED' || key === 'CANCELLED') return 'Refunded';
  return 'Active';
}

/** @deprecated use getPaymentStatusLabel */
export function getPaymentLabel(status) {
  return PAYMENT_STATUS_LABELS[normalizePaymentStatus(status)] || 'Unknown';
}
