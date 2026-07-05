const { expireDueCampaigns } = require('../services/adCampaignLifecycleService');

const DEFAULT_INTERVAL_MS = 15 * 60 * 1000;
const INTERVAL_MS = Math.max(
  60 * 1000,
  parseInt(process.env.AD_EXPIRY_CHECK_INTERVAL_MS || String(DEFAULT_INTERVAL_MS), 10)
);

let isRunning = false;
let intervalHandle = null;

async function runExpiryCheck(source = 'scheduled') {
  if (isRunning) return 0;
  isRunning = true;
  try {
    const count = await expireDueCampaigns();
    if (count > 0) {
      console.log(`[ads-expiry-job] ${source}: expired ${count} campaign(s)`);
    }
    return count;
  } catch (err) {
    console.error(`[ads-expiry-job] ${source} failed:`, err.message);
    return 0;
  } finally {
    isRunning = false;
  }
}

function scheduleAdCampaignExpiryJob() {
  runExpiryCheck('startup').catch(() => {});

  intervalHandle = setInterval(() => {
    runExpiryCheck('scheduled').catch(() => {});
  }, INTERVAL_MS);

  if (typeof intervalHandle.unref === 'function') {
    intervalHandle.unref();
  }

  console.log(`[ads-expiry-job] Checking campaign expiry every ${Math.round(INTERVAL_MS / 60000)} minute(s)`);
  return intervalHandle;
}

function stopAdCampaignExpiryJob() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

module.exports = {
  runExpiryCheck,
  scheduleAdCampaignExpiryJob,
  stopAdCampaignExpiryJob
};
