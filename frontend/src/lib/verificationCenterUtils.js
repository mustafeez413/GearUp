import {
  normalizeVerificationStatus,
  isAwaitingAdminReview,
  isApprovedVerification,
  isRejectedVerification,
} from '@/lib/verificationStats';

export const REJECTION_REASONS = [
  'Invalid Documentation',
  'Incomplete Information',
  'Failed Verification',
  'Suspicious Activity',
  'Other',
];

export const PAGE_SIZE = 8;

export function parseVerificationOverviewPayload(data) {
  if (!data || typeof data !== 'object') {
    return {
      stats: {
        approved: 0,
        pending: 0,
        rejected: 0,
        totalApplications: 0,
        approvalRate: 0,
        avgReviewTimeHours: null,
      },
      pendingUsers: [],
      applicants: [],
    };
  }

  const stats = data.stats || {};
  return {
    stats: {
      approved: Number(stats.approved) || 0,
      pending: Number(stats.pending) || 0,
      rejected: Number(stats.rejected) || 0,
      totalApplications: Number(stats.totalApplications) || 0,
      approvalRate: Number(stats.approvalRate) || 0,
      avgReviewTimeHours: stats.avgReviewTimeHours ?? null,
    },
    pendingUsers: Array.isArray(data.pendingUsers) ? data.pendingUsers : [],
    applicants: Array.isArray(data.applicants) ? data.applicants : [],
  };
}

export function getApplicantStatus(user) {
  if (isAwaitingAdminReview(user)) return 'pending';
  if (isApprovedVerification(user)) return 'approved';
  if (isRejectedVerification(user)) return 'rejected';
  return normalizeVerificationStatus(user?.verificationStatus) || 'unknown';
}

export function getVerificationId(user) {
  return String(user?._id || '').slice(-8).toUpperCase();
}

export function getBusinessName(user) {
  return user?.businessDetails?.businessName || user?.name || 'Unknown Business';
}

export function getSubmittedDate(user) {
  return user?.verificationSubmittedAt || user?.createdAt || null;
}

export function getTrustBadges(user) {
  const bd = user?.businessDetails || {};
  return [
    { key: 'email', label: 'Email Verified', ok: Boolean(user?.isEmailVerified) },
    { key: 'phone', label: 'Phone Verified', ok: Boolean(bd.phone) },
    { key: 'ntn', label: 'NTN Added', ok: Boolean(bd.taxId) },
    { key: 'license', label: 'License Uploaded', ok: Boolean(bd.businessLicense) },
  ];
}

export function computeCompleteness(user) {
  const bd = user?.businessDetails || {};
  const checks = [
    { key: 'business', label: 'Business Information', ok: Boolean(bd.businessName || user?.name) },
    { key: 'license', label: 'License Uploaded', ok: Boolean(bd.businessLicense) },
    { key: 'ntn', label: 'NTN Added', ok: Boolean(bd.taxId) },
    { key: 'email', label: 'Email Verified', ok: Boolean(user?.isEmailVerified) },
    { key: 'phone', label: 'Phone Verified', ok: Boolean(bd.phone) },
    { key: 'address', label: 'Address Verified', ok: Boolean(bd.address || bd.street || bd.area) },
  ];
  const completed = checks.filter((c) => c.ok).length;
  const percent = Math.round((completed / checks.length) * 100);
  return { checks, percent, completed, total: checks.length };
}

export function computeRiskLevel(user) {
  const { percent } = computeCompleteness(user);
  const bd = user?.businessDetails || {};
  let score = 0;

  if (!user?.isEmailVerified) score += 25;
  if (!bd.phone) score += 20;
  if (!bd.businessLicense) score += 25;
  if (!bd.taxId) score += 20;
  if (percent < 70) score += 10;

  if (score <= 20) {
    return { level: 'low', label: 'Trusted Business', tone: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  }
  if (score <= 45) {
    return { level: 'medium', label: 'Requires Review', tone: 'text-amber-700 bg-amber-50 border-amber-200' };
  }
  return { level: 'high', label: 'High Risk', tone: 'text-rose-700 bg-rose-50 border-rose-200' };
}

export function buildTimeline(user) {
  const submitted = user?.verificationSubmittedAt || user?.createdAt;
  const reviewed = user?.verificationReviewedAt;
  const status = getApplicantStatus(user);
  const hasLicense = Boolean(user?.businessDetails?.businessLicense);

  const steps = [
    { id: 'submitted', label: 'Application Submitted', at: submitted, done: Boolean(submitted) },
    { id: 'documents', label: 'Documents Uploaded', at: hasLicense ? submitted : null, done: hasLicense },
    { id: 'started', label: 'Verification Started', at: submitted, done: Boolean(submitted) },
    {
      id: 'review',
      label: 'Under Review',
      at: status === 'pending' ? new Date().toISOString() : reviewed,
      done: status === 'pending' || status === 'approved' || status === 'rejected',
    },
  ];

  if (status === 'approved') {
    steps.push({ id: 'approved', label: 'Approved', at: reviewed, done: true });
  } else if (status === 'rejected') {
    steps.push({ id: 'rejected', label: 'Rejected', at: reviewed, done: true });
  }

  return steps;
}

export function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export function formatAvgReviewTime(hours) {
  if (hours == null || Number.isNaN(hours)) return '—';
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 24) return `${hours} hrs`;
  return `${Math.round(hours / 24 * 10) / 10} days`;
}

export function getDocumentMeta(user) {
  const path = user?.businessDetails?.businessLicense;
  if (!path) return null;
  const name = path.split('/').pop() || 'business-license';
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const type = ext === 'pdf' ? 'PDF Document' : ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? 'Image' : 'Document';
  return { path, name, type, ext };
}

export function filterApplicants(applicants, { search, statusFilter, roleFilter, cityFilter, sortOrder }) {
  let list = [...(applicants || [])];

  if (statusFilter && statusFilter !== 'all') {
    list = list.filter((u) => getApplicantStatus(u) === statusFilter);
  }

  if (roleFilter && roleFilter !== 'all') {
    list = list.filter((u) => u.role === roleFilter);
  }

  if (cityFilter && cityFilter !== 'all') {
    list = list.filter((u) => (u.businessDetails?.city || '') === cityFilter);
  }

  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter((u) => {
      const bd = u.businessDetails || {};
      return (
        getBusinessName(u).toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (bd.taxId || '').toLowerCase().includes(q) ||
        getVerificationId(u).toLowerCase().includes(q) ||
        String(u._id || '').toLowerCase().includes(q)
      );
    });
  }

  list.sort((a, b) => {
    const da = new Date(getSubmittedDate(a) || 0).getTime();
    const db = new Date(getSubmittedDate(b) || 0).getTime();
    return sortOrder === 'oldest' ? da - db : db - da;
  });

  return list;
}

export function getUniqueCities(applicants) {
  const cities = new Set();
  (applicants || []).forEach((u) => {
    if (u.businessDetails?.city) cities.add(u.businessDetails.city);
  });
  return [...cities].sort();
}

const ACTIVITY_KEY = 'gearup_verification_activity';

export function loadActivityLog() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '[]');
  } catch {
    return [];
  }
}

export function pushActivityLog(entry) {
  if (typeof window === 'undefined') return;
  const prev = loadActivityLog();
  const next = [{ id: Date.now(), at: new Date().toISOString(), ...entry }, ...prev].slice(0, 30);
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(next));
}

export function exportApplicantsCsv(applicants) {
  const headers = ['Verification ID', 'Business Name', 'Email', 'Role', 'City', 'NTN', 'Status', 'Submitted'];
  const rows = applicants.map((u) => [
    getVerificationId(u),
    getBusinessName(u),
    u.email || '',
    u.role || '',
    u.businessDetails?.city || '',
    u.businessDetails?.taxId || '',
    getApplicantStatus(u),
    formatDate(getSubmittedDate(u)),
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gearup-verifications-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
