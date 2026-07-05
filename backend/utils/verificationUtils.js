/**
 * Shared verification status logic for admin review queues and statistics.
 * Keeps pending counts and pending lists in sync.
 */

const APPROVED_STATUSES = new Set(['approved', 'verified']);
const REJECTED_STATUS = 'rejected';
const PENDING_STATUS = 'pending';

function normalizeVerificationStatus(status) {
    if (status == null) return '';
    return String(status).trim().toLowerCase();
}

function isNonAdminUser(user) {
    return Boolean(user?.role && user.role !== 'admin');
}

function hasSubmittedVerificationApplication(user) {
    const bd = user?.businessDetails || {};
    return Boolean(bd.businessLicense && bd.taxId);
}

/**
 * A user is awaiting admin review when status is pending, or they submitted
 * documents but status was not updated (legacy / failed secondary save).
 */
function isAwaitingAdminReview(user) {
    if (!isNonAdminUser(user)) return false;

    const status = normalizeVerificationStatus(user.verificationStatus);

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

function isApprovedVerification(user) {
    if (!isNonAdminUser(user)) return false;
    const status = normalizeVerificationStatus(user.verificationStatus);
    return APPROVED_STATUSES.has(status) || user?.businessDetails?.isVerified === true;
}

function isRejectedVerification(user) {
    if (!isNonAdminUser(user)) return false;
    return normalizeVerificationStatus(user.verificationStatus) === REJECTED_STATUS;
}

function isVerificationApplicant(user) {
    if (!isNonAdminUser(user)) return false;
    const status = normalizeVerificationStatus(user.verificationStatus);
    if (status === PENDING_STATUS || status === REJECTED_STATUS || APPROVED_STATUSES.has(status)) {
        return true;
    }
    if (hasSubmittedVerificationApplication(user)) return true;
    if (user?.businessDetails?.isVerified === true) return true;
    return false;
}

function computeAvgReviewTimeHours(users = []) {
    const reviewed = users.filter(
        (u) => u.verificationReviewedAt && (u.verificationSubmittedAt || u.createdAt)
    );
    if (!reviewed.length) return null;

    const totalMs = reviewed.reduce((sum, u) => {
        const start = new Date(u.verificationSubmittedAt || u.createdAt).getTime();
        const end = new Date(u.verificationReviewedAt).getTime();
        return sum + Math.max(0, end - start);
    }, 0);

    return Math.round((totalMs / reviewed.length / (1000 * 60 * 60)) * 10) / 10;
}

function buildVerificationOverview(users = []) {
    const list = Array.isArray(users) ? users : [];
    const nonAdmin = list.filter(isNonAdminUser);
    const pendingUsers = nonAdmin.filter(isAwaitingAdminReview);
    const approved = nonAdmin.filter(isApprovedVerification).length;
    const pending = pendingUsers.length;
    const rejected = nonAdmin.filter(isRejectedVerification).length;
    const applicants = nonAdmin.filter(isVerificationApplicant);
    const totalApplications = approved + pending + rejected;
    const approvalRate =
        totalApplications > 0 ? Math.round((approved / totalApplications) * 1000) / 10 : 0;

    return {
        stats: {
            approved,
            pending,
            rejected,
            totalApplications,
            approvalRate,
            avgReviewTimeHours: computeAvgReviewTimeHours(applicants),
        },
        pendingUsers,
        applicants,
    };
}

module.exports = {
    normalizeVerificationStatus,
    isAwaitingAdminReview,
    isApprovedVerification,
    isRejectedVerification,
    isVerificationApplicant,
    buildVerificationOverview,
    hasSubmittedVerificationApplication,
};
