export const SUSPENSION_REASONS = [
  'Business Verification Failed',
  'Fake Business Information',
  'Violation of Platform Policies',
  'Fraudulent Activity',
  'Suspicious Transactions',
  'Selling Restricted Products',
  'Multiple Policy Violations',
  'Customer Complaints',
  'Payment Issues',
  'Inactive Business Account',
  'Other',
];

export function isUserReadOnly(user) {
  if (!user) return false;
  if (user.role === 'admin') return false;
  return !!user.isBlocked;
}

export function getSuspensionReason(user) {
  if (!user?.isBlocked) return '';
  return user.blockReason || 'No reason provided.';
}

export function getReadOnlyActionMessage() {
  return 'Your account is suspended and in read-only mode. You cannot perform this action until your account is reactivated.';
}
