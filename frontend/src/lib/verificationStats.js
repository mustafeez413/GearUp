/**
 * Client-side verification stats — mirrors backend utils/verificationUtils.js
 */

const APPROVED_STATUSES = new Set(['approved', 'verified']);
const REJECTED_STATUS = 'rejected';
const PENDING_STATUS = 'pending';

export function normalizeVerificationStatus(status) {
  if (status == null) return '';
  return String(status).trim().toLowerCase();
}

export function isNonAdminUser(user) {
  return Boolean(user?.role && user.role !== 'admin');
}

export function hasSubmittedVerificationApplication(user) {
  const bd = user?.businessDetails || {};
  return Boolean(bd.businessLicense && bd.taxId);
}

export function isAwaitingAdminReview(user) {
  if (!isNonAdminUser(user)) return false;

  const status = normalizeVerificationStatus(user?.verificationStatus);

  if (APPROVED_STATUSES.has(status) || user?.businessDetails?.isVerified === true) {
    return false;
  }
  if (status === REJECTED_STATUS) {
    return false;
  }
  if (status === PENDING_STATUS) {
    return true;
  }
  if (hasSubmittedVerificationApplication(user) && (status === 'business_required' || status === '')) {
    return true;
  }

  return false;
}

export function isApprovedVerification(user) {
  if (!isNonAdminUser(user)) return false;
  const status = normalizeVerificationStatus(user?.verificationStatus);
  return APPROVED_STATUSES.has(status) || user?.businessDetails?.isVerified === true;
}

export function isRejectedVerification(user) {
  if (!isNonAdminUser(user)) return false;
  return normalizeVerificationStatus(user?.verificationStatus) === REJECTED_STATUS;
}

export function getVerificationDisplayState(user) {
  if (!isNonAdminUser(user)) return null;

  if (isApprovedVerification(user)) return 'approved';
  if (isRejectedVerification(user)) return 'rejected';
  if (isAwaitingAdminReview(user)) return 'pending';
  return 'not_submitted';
}

export function formatVerificationDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function getRoleDashboardPath(role) {
  if (role === 'manufacturer') return '/manufacturer/dashboard';
  if (role === 'wholesaler') return '/wholesaler/dashboard';
  if (role === 'admin') return '/admin/dashboard';
  return '/';
}

export function getVerificationStats(users = []) {
  const list = Array.isArray(users) ? users : [];
  const nonAdmin = list.filter(isNonAdminUser);
  const pendingUsers = nonAdmin.filter(isAwaitingAdminReview);

  return {
    approved: nonAdmin.filter(isApprovedVerification).length,
    pending: pendingUsers.length,
    rejected: nonAdmin.filter(isRejectedVerification).length,
    pendingUsers,
  };
}

export function parseVerificationOverviewPayload(data) {
  if (!data || typeof data !== 'object') {
    return {
      approved: 0,
      pending: 0,
      rejected: 0,
      pendingUsers: [],
      applicants: [],
    };
  }

  const stats = data.stats || {};
  const pendingUsers = Array.isArray(data.pendingUsers) ? data.pendingUsers : [];
  const applicants = Array.isArray(data.applicants) ? data.applicants : pendingUsers;

  return {
    approved: Number(stats.approved) || 0,
    pending: Number(stats.pending) || 0,
    rejected: Number(stats.rejected) || 0,
    pendingUsers,
    applicants,
  };
}
