const Advertisement = require('../models/Advertisement');
const AdCampaignStatusLog = require('../models/AdCampaignStatusLog');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const { createNotification } = require('../controllers/notificationController');

let cachedSystemAdminId = null;

async function resolveSystemPerformerId() {
  if (cachedSystemAdminId) return cachedSystemAdminId;
  const admin = await User.findOne({ role: 'admin' }).select('_id').lean();
  cachedSystemAdminId = admin?._id || null;
  return cachedSystemAdminId;
}

async function writeAuditEntry({ action, performedBy, targetEntity }) {
  const performerId = performedBy || (await resolveSystemPerformerId());
  if (!performerId) return;

  try {
    await AuditLog.create({
      action,
      performedBy: performerId,
      targetEntity,
      status: 'success'
    });
  } catch (err) {
    console.error('[ads-lifecycle] Audit log failed:', err.message);
  }
}

async function logStatusChange({
  ad,
  previousStatus,
  newStatus,
  reason,
  performedBy = null,
  notes = ''
}) {
  await AdCampaignStatusLog.create({
    advertisementId: ad._id,
    eventType: 'status_change',
    previousStatus,
    newStatus,
    previousEndDate: null,
    newEndDate: ad.endDate || null,
    reason,
    performedBy,
    notes
  });

  console.log(
    `[ads-lifecycle] Campaign ${ad._id}: ${previousStatus} -> ${newStatus} (${reason})` +
      (ad.endDate ? ` endDate=${ad.endDate.toISOString()}` : '')
  );

  await writeAuditEntry({
    action: `Campaign status ${previousStatus} → ${newStatus}: ${reason}${notes ? ` — ${notes}` : ''}`,
    performedBy,
    targetEntity: `Advertisement:${ad._id}`
  });
}

async function logEndDateExtension({ ad, previousEndDate, performedBy, reason, notes = '' }) {
  await AdCampaignStatusLog.create({
    advertisementId: ad._id,
    eventType: 'extend',
    previousStatus: ad.status,
    newStatus: ad.status,
    previousEndDate,
    newEndDate: ad.endDate,
    reason,
    performedBy,
    notes
  });

  console.log(
    `[ads-lifecycle] Campaign ${ad._id}: extended end date ${previousEndDate?.toISOString()} -> ${ad.endDate?.toISOString()} (${reason})`
  );

  await writeAuditEntry({
    action: `Campaign end date extended: ${previousEndDate?.toISOString()} → ${ad.endDate?.toISOString()} (${reason})`,
    performedBy,
    targetEntity: `Advertisement:${ad._id}`
  });
}

async function transitionCampaign(ad, newStatus, { reason, performedBy = null, notes = '' } = {}) {
  const previousStatus = ad.status;
  if (previousStatus === newStatus) return ad;

  ad.status = newStatus;
  if (newStatus === 'expired') {
    ad.expiredAt = new Date();
  }
  await ad.save();

  await logStatusChange({
    ad,
    previousStatus,
    newStatus,
    reason,
    performedBy,
    notes
  });

  return ad;
}

async function expireCampaignRecord(ad, { reason, performedBy = null, notes = '', notify = true } = {}) {
  if (ad.status === 'expired') return ad;

  await transitionCampaign(ad, 'expired', { reason, performedBy, notes });

  if (notify) {
    await createNotification(
      ad.manufacturerId,
      reason === 'manual_expire'
        ? 'Your advertisement campaign has been ended early by an administrator.'
        : 'Your advertisement campaign has expired.',
      'system',
      '/manufacturer/advertising/campaigns'
    );
  }

  return ad;
}

async function expireDueCampaigns() {
  const now = new Date();
  const due = await Advertisement.find({
    status: { $in: ['active', 'paused'] },
    endDate: { $lt: now }
  });

  for (const ad of due) {
    await expireCampaignRecord(ad, {
      reason: 'auto_expiry',
      notes: `Scheduled end date reached (${ad.endDate?.toISOString()})`
    });
  }

  return due.length;
}

async function activateScheduledCampaigns() {
  const now = new Date();
  const scheduled = await Advertisement.find({
    status: 'scheduled',
    startDate: { $lte: now }
  });

  for (const ad of scheduled) {
    await transitionCampaign(ad, 'active', {
      reason: 'auto_activation',
      notes: `Scheduled start date reached (${ad.startDate?.toISOString()})`
    });
  }

  return scheduled.length;
}

async function extendCampaignEndDate(ad, { days, endDate, performedBy, reason = 'admin_extend' }) {
  const previousEndDate = ad.endDate ? new Date(ad.endDate) : null;
  const wasExpired = ad.status === 'expired';
  let nextEndDate = null;

  if (endDate) {
    nextEndDate = new Date(endDate);
  } else if (days && Number(days) > 0) {
    const base = previousEndDate && previousEndDate > new Date() ? previousEndDate : new Date();
    nextEndDate = new Date(base.getTime() + Number(days) * 24 * 60 * 60 * 1000);
  } else {
    const err = new Error('Provide a positive days value or a new endDate');
    err.statusCode = 400;
    throw err;
  }

  if (Number.isNaN(nextEndDate.getTime())) {
    const err = new Error('Invalid endDate');
    err.statusCode = 400;
    throw err;
  }

  ad.endDate = nextEndDate;
  if (wasExpired && nextEndDate > new Date()) {
    ad.status = 'paused';
    ad.expiredAt = null;
  }
  await ad.save();

  await logEndDateExtension({
    ad,
    previousEndDate,
    performedBy,
    reason,
    notes: days ? `Extended by ${days} day(s)` : `Extended to ${nextEndDate.toISOString()}`
  });

  if (wasExpired && nextEndDate > new Date()) {
    await logStatusChange({
      ad,
      previousStatus: 'expired',
      newStatus: 'paused',
      reason: 'extend_reactivation',
      performedBy,
      notes: 'Campaign moved to paused after extension beyond expiry'
    });
  }

  return ad;
}

module.exports = {
  transitionCampaign,
  expireCampaignRecord,
  expireDueCampaigns,
  activateScheduledCampaigns,
  extendCampaignEndDate,
  logStatusChange
};
