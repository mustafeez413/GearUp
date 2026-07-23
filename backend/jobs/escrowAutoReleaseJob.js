const Order = require('../models/Order');
const Settings = require('../models/Settings');
const { releaseOrderPaymentTransactionally } = require('../utils/payoutSync');

const DEFAULT_INTERVAL_MS = 15 * 60 * 1000; // Check every 15 minutes by default
const INTERVAL_MS = Math.max(
  60 * 1000,
  parseInt(process.env.ESCROW_RELEASE_CHECK_INTERVAL_MS || String(DEFAULT_INTERVAL_MS), 10)
);

let isRunning = false;
let intervalHandle = null;

async function checkAndReleaseEscrows() {
  if (isRunning) return 0;
  isRunning = true;
  try {
    const settings = await Settings.findOne() || { disputeWindowDays: 3 };
    const windowDays = settings.disputeWindowDays || 3;
    const expiryThreshold = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

    const Dispute = require('../models/Dispute');
    const eligibleOrders = await Order.find({
      status: 'delivered',
      paymentStatus: 'Held',
      deliveredAt: { $lte: expiryThreshold }
    });

    let releasedCount = 0;
    for (const order of eligibleOrders) {
      // Check if there is an active/open dispute for this order
      const hasDispute = await Dispute.findOne({ 
        order: order._id, 
        status: { $in: ['open', 'under_review', 'investigating', 'awaiting_seller', 'seller_responded'] } 
      });
      
      if (!hasDispute) {
        try {
          console.log(`[escrow-release-job] Auto-releasing payment for order ${order._id} (delivered at ${order.deliveredAt})`);
          await releaseOrderPaymentTransactionally(order._id);
          order.status = 'completed';
          await order.save();
          releasedCount++;
        } catch (err) {
          console.error(`[escrow-release-job] Failed to auto-release order ${order._id}:`, err.message);
        }
      }
    }

    return releasedCount;
  } catch (err) {
    console.error(`[escrow-release-job] Error running check:`, err.message);
    return 0;
  } finally {
    isRunning = false;
  }
}

function scheduleEscrowAutoReleaseJob() {
  // Run on startup after short delay
  setTimeout(() => {
    checkAndReleaseEscrows().catch(() => {});
  }, 10000);

  intervalHandle = setInterval(() => {
    checkAndReleaseEscrows().catch(() => {});
  }, INTERVAL_MS);

  if (typeof intervalHandle.unref === 'function') {
    intervalHandle.unref();
  }

  console.log(`[escrow-release-job] Checking escrow expiry every ${Math.round(INTERVAL_MS / 60000)} minute(s)`);
  return intervalHandle;
}

function stopEscrowAutoReleaseJob() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

module.exports = {
  checkAndReleaseEscrows,
  scheduleEscrowAutoReleaseJob,
  stopEscrowAutoReleaseJob
};
