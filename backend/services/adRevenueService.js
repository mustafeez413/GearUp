const Advertisement = require('../models/Advertisement');
const AdPayment = require('../models/AdPayment');
const AdPlan = require('../models/AdPlan');

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfWeek(date = new Date()) {
  const d = startOfDay(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
}

function endOfToday() {
  const d = startOfDay();
  d.setDate(d.getDate() + 1);
  return d;
}

async function sumCompletedPayments(match = {}) {
  const result = await AdPayment.aggregate([
    { $match: { status: 'completed', ...match } },
    { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
  ]);
  return {
    total: result[0]?.total || 0,
    count: result[0]?.count || 0
  };
}

async function getAdminRevenueDashboard() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = endOfToday();
  const monthStart = startOfMonth(now);
  const nextMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() + 1, 1));
  const lastMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const weekStart = startOfWeek(now);

  const [
    totalRevenue,
    todayRevenue,
    monthRevenue,
    lastMonthRevenue,
    weekRevenue,
    activeCampaigns,
    runningCampaigns,
    expiredCampaigns,
    planBreakdown,
    plans
  ] = await Promise.all([
    sumCompletedPayments(),
    sumCompletedPayments({ createdAt: { $gte: todayStart, $lt: tomorrowStart } }),
    sumCompletedPayments({ createdAt: { $gte: monthStart, $lt: nextMonthStart } }),
    sumCompletedPayments({ createdAt: { $gte: lastMonthStart, $lt: monthStart } }),
    sumCompletedPayments({ createdAt: { $gte: weekStart } }),
    Advertisement.countDocuments({ status: 'active' }),
    Advertisement.countDocuments({
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now }
    }),
    Advertisement.countDocuments({ status: 'expired' }),
    AdPayment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$plan',
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 }
        }
      }
    ]),
    AdPlan.find().select('slug planName price duration status isActive').sort({ duration: 1 }).lean()
  ]);

  const planMap = { starter: 0, growth: 0, premium: 0 };
  const planCounts = { starter: 0, growth: 0, premium: 0 };
  planBreakdown.forEach((row) => {
    if (row._id && planMap[row._id] !== undefined) {
      planMap[row._id] = row.revenue;
      planCounts[row._id] = row.transactions;
    }
  });

  const lastMonthTotal = lastMonthRevenue.total;
  const thisMonthTotal = monthRevenue.total;
  let revenueGrowthPercent = 0;
  if (lastMonthTotal > 0) {
    revenueGrowthPercent = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
  } else if (thisMonthTotal > 0) {
    revenueGrowthPercent = 100;
  }

  return {
    dashboard: {
      totalAdRevenue: totalRevenue.total,
      activeCampaigns,
      expiredCampaigns,
      runningCampaigns,
      thisMonthRevenue: monthRevenue.total,
      todayRevenue: todayRevenue.total,
      totalTransactions: totalRevenue.count
    },
    analytics: {
      totalRevenue: totalRevenue.total,
      monthlyRevenue: monthRevenue.total,
      weeklyRevenue: weekRevenue.total,
      revenueGrowthPercent: Math.round(revenueGrowthPercent * 10) / 10,
      lastMonthRevenue: lastMonthTotal
    },
    planRevenue: {
      starter: { revenue: planMap.starter, transactions: planCounts.starter },
      growth: { revenue: planMap.growth, transactions: planCounts.growth },
      premium: { revenue: planMap.premium, transactions: planCounts.premium }
    },
    pricingPlans: plans.map((p) => ({
      slug: p.slug,
      planName: p.planName,
      price: p.price,
      duration: p.duration,
      status: p.status,
      isActive: p.isActive
    }))
  };
}

async function getAdminAdTransactions({ limit = 100, status } = {}) {
  const filter = {};
  if (status && status !== 'all') {
    filter.status = status;
  }

  const payments = await AdPayment.find(filter)
    .populate('manufacturerId', 'name businessDetails')
    .populate({
      path: 'advertisementId',
      select: 'status startDate endDate plan amountPaid productId',
      populate: { path: 'productId', select: 'name category' }
    })
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 100, 500))
    .lean();

  return payments.map((payment) => {
    const ad = payment.advertisementId;
    const manufacturer = payment.manufacturerId;
    return {
      _id: payment._id,
      transactionId: payment.ledgerReference || `AD-${String(payment._id).slice(-8).toUpperCase()}`,
      paymentId: payment._id,
      advertisementId: ad?._id || payment.advertisementId,
      manufacturerId: manufacturer?._id || payment.manufacturerId,
      manufacturerName: manufacturer?.businessDetails?.businessName || manufacturer?.name || '—',
      productName: ad?.productId?.name || '—',
      plan: payment.plan,
      amountPaid: payment.amount,
      paymentStatus: payment.status,
      paymentMethod: payment.paymentMethod,
      purchaseDate: payment.createdAt,
      startDate: ad?.startDate || null,
      endDate: ad?.endDate || null,
      campaignStatus: ad?.status || 'unknown',
      metadata: payment.metadata || {}
    };
  });
}

module.exports = {
  getAdminRevenueDashboard,
  getAdminAdTransactions
};
