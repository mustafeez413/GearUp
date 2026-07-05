/** Shared date helpers for Advertisement module — unambiguous "Jun 06, 2026" format */

export const PLAN_DURATION_BY_SLUG = {
  starter: 7,
  growth: 15,
  premium: 30,
};

export function parseDateInput(value) {
  if (!value) return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toDateInputValue(date) {
  if (!date || Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayDateInput() {
  return toDateInputValue(new Date());
}

export function formatAdDate(value) {
  const date = parseDateInput(value) || (value ? new Date(value) : null);
  if (!date || Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

export function formatAdDateTime(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatAdDateRange(start, end) {
  if (!start && !end) return '—';
  if (start && end) return `${formatAdDate(start)} – ${formatAdDate(end)}`;
  return formatAdDate(start || end);
}

export function getPlanDurationDays(plan) {
  if (!plan) return PLAN_DURATION_BY_SLUG.starter;
  const slug = typeof plan === 'string' ? plan : plan.slug;
  return (
    (typeof plan === 'object' && (plan.durationDays ?? plan.duration)) ||
    PLAN_DURATION_BY_SLUG[slug] ||
    7
  );
}

/** End date = start date + plan duration (Starter 7 / Growth 15 / Premium 30 days) */
export function computeCampaignEndDate(startDate, plan) {
  const start = parseDateInput(startDate);
  if (!start) return '';
  const end = new Date(start);
  end.setDate(end.getDate() + getPlanDurationDays(plan));
  return toDateInputValue(end);
}

export function isStartDateValid(startDate) {
  const start = parseDateInput(startDate);
  if (!start) return false;
  const today = parseDateInput(getTodayDateInput());
  return start >= today;
}

export function getDaysRemaining(endDate) {
  const end = parseDateInput(endDate) || (endDate ? new Date(endDate) : null);
  if (!end || Number.isNaN(end.getTime())) return null;
  const today = parseDateInput(getTodayDateInput());
  const diffMs = end.getTime() - today.getTime();
  return Math.ceil(diffMs / 86400000);
}

export function formatDaysRemaining(endDate, status) {
  if (['expired', 'completed', 'rejected'].includes(status)) return 'Ended';
  const days = getDaysRemaining(endDate);
  if (days == null) return '—';
  if (days < 0) return 'Ended';
  if (days === 0) return 'Ends today';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}
