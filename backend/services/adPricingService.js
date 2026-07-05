const AdPlan = require('../models/AdPlan');
const AdvertisementDiscount = require('../models/AdvertisementDiscount');
const PricingHistory = require('../models/PricingHistory');
const AdPayment = require('../models/AdPayment');

/** Seed plans only when collection is empty — not used for runtime pricing. */
const SEED_PLANS = [
  {
    slug: 'starter',
    planName: 'Starter',
    duration: 7,
    price: 9999,
    packageWeight: 1,
    visibilityTier: 'basic',
    description: '7 days — basic marketplace visibility',
    status: 'active',
    isActive: true
  },
  {
    slug: 'growth',
    planName: 'Growth',
    duration: 15,
    price: 19999,
    packageWeight: 2,
    visibilityTier: 'increased',
    description: '15 days — increased visibility across search & categories',
    status: 'active',
    isActive: true
  },
  {
    slug: 'premium',
    planName: 'Premium',
    duration: 30,
    price: 34999,
    packageWeight: 3,
    visibilityTier: 'highest',
    description: '30 days — highest priority sponsored placement',
    status: 'active',
    isActive: true
  }
];

async function ensureDefaultPlans() {
  const count = await AdPlan.countDocuments();
  if (count > 0) return;
  await AdPlan.insertMany(SEED_PLANS);
}

function resolveDiscountLifecycle(discount, now = new Date()) {
  if (discount.status === 'inactive') return 'inactive';
  if (now < new Date(discount.startDate)) return 'scheduled';
  if (now > new Date(discount.endDate)) return 'expired';
  return 'active';
}

function discountApplies(discount, planSlug, productCategory) {
  if (discount.applyTo === 'all_plans') return true;
  if (discount.applyTo === 'specific_plans') {
    return (discount.applicablePlans || []).includes(planSlug);
  }
  if (discount.applyTo === 'specific_categories') {
    if (!productCategory) return false;
    const cat = String(productCategory).toLowerCase();
    return (discount.applicableCategories || []).some((c) => cat.includes(String(c).toLowerCase()));
  }
  return false;
}

async function getApplicableDiscounts(planSlug, productCategory, now = new Date()) {
  const discounts = await AdvertisementDiscount.find({
    status: { $in: ['active', 'scheduled'] }
  }).sort({ discountPercentage: -1 });

  return discounts.filter((d) => {
    const lifecycle = resolveDiscountLifecycle(d, now);
    return lifecycle === 'active' && discountApplies(d, planSlug, productCategory);
  });
}

function pickBestDiscount(discounts) {
  if (!discounts.length) return null;
  return discounts.reduce((best, d) => (
    !best || d.discountPercentage > best.discountPercentage ? d : best
  ), null);
}

function computePricing(basePrice, discount) {
  const originalPrice = Number(basePrice) || 0;
  if (!discount || discount.discountPercentage <= 0) {
    return {
      originalPrice,
      discountPercent: 0,
      finalPrice: originalPrice,
      savings: 0,
      discountName: null,
      discountId: null,
      isPromotion: false,
      promotionTag: null
    };
  }

  const discountPercent = Number(discount.discountPercentage);
  const finalPrice = Math.max(0, Math.round(originalPrice * (1 - discountPercent / 100)));
  return {
    originalPrice,
    discountPercent,
    finalPrice,
    savings: originalPrice - finalPrice,
    discountName: discount.discountName,
    discountId: discount._id,
    isPromotion: discount.isPromotion,
    promotionTag: discount.promotionTag || discount.discountName
  };
}

async function getPlanPricing(planSlug, productCategory = null) {
  await ensureDefaultPlans();
  const plan = await AdPlan.findOne({ slug: planSlug, status: 'active', isActive: true });
  if (!plan) return null;

  const applicable = await getApplicableDiscounts(planSlug, productCategory);
  const best = pickBestDiscount(applicable);
  const pricing = computePricing(plan.price, best);

  return {
    plan: {
      _id: plan._id,
      slug: plan.slug,
      name: plan.planName,
      planName: plan.planName,
      durationDays: plan.duration,
      duration: plan.duration,
      price: plan.price,
      packageWeight: plan.packageWeight,
      visibilityTier: plan.visibilityTier,
      description: plan.description,
      status: plan.status
    },
    ...pricing,
    activeDiscounts: applicable.map((d) => ({
      _id: d._id,
      discountName: d.discountName,
      discountPercentage: d.discountPercentage,
      startDate: d.startDate,
      endDate: d.endDate,
      isPromotion: d.isPromotion,
      promotionTag: d.promotionTag
    }))
  };
}

async function getAllPlansWithPricing(productCategory = null) {
  await ensureDefaultPlans();
  const plans = await AdPlan.find({ status: 'active', isActive: true }).sort({ duration: 1 });
  const results = [];
  for (const plan of plans) {
    const applicable = await getApplicableDiscounts(plan.slug, productCategory);
    const best = pickBestDiscount(applicable);
    const pricing = computePricing(plan.price, best);
    results.push({
      ...plan.toObject(),
      name: plan.planName,
      planName: plan.planName,
      durationDays: plan.duration,
      duration: plan.duration,
      ...pricing,
      activeDiscounts: applicable
    });
  }
  return results;
}

async function recordPricingChange(adminId, plan, newPrice) {
  const oldPrice = plan.price;
  if (oldPrice === newPrice) return null;

  return PricingHistory.create({
    adminId,
    planName: plan.planName || plan.name || plan.slug,
    planSlug: plan.slug,
    oldPrice,
    newPrice,
    changedAt: new Date()
  });
}

async function syncDiscountStatuses() {
  const now = new Date();
  const discounts = await AdvertisementDiscount.find({ status: { $in: ['active', 'scheduled', 'expired'] } });
  for (const d of discounts) {
    const lifecycle = resolveDiscountLifecycle(d, now);
    if (d.status !== 'inactive' && d.status !== lifecycle) {
      d.status = lifecycle;
      await d.save();
    }
  }
}

async function getPricingCenterOverview() {
  await syncDiscountStatuses();
  await ensureDefaultPlans();

  const now = new Date();
  const [plans, discounts, history, revenueAgg] = await Promise.all([
    AdPlan.find().sort({ duration: 1 }),
    AdvertisementDiscount.find().sort({ startDate: -1 }),
    PricingHistory.find().populate('adminId', 'name email').sort({ changedAt: -1 }).limit(20),
    AdPayment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' }, discounted: { $sum: { $ifNull: ['$metadata.savings', 0] } } } }
    ])
  ]);

  const categorized = { active: [], scheduled: [], expired: [], inactive: [] };
  discounts.forEach((d) => {
    const bucket = d.status === 'inactive' ? 'inactive' : resolveDiscountLifecycle(d, now);
    if (categorized[bucket]) categorized[bucket].push(d);
    else categorized.expired.push(d);
  });

  return {
    currentPrices: plans,
    activeDiscounts: categorized.active,
    upcomingDiscounts: categorized.scheduled,
    expiredDiscounts: categorized.expired,
    inactiveDiscounts: categorized.inactive,
    pricingHistory: history,
    revenueImpact: {
      totalRevenue: revenueAgg[0]?.total || 0,
      totalDiscountSavings: revenueAgg[0]?.discounted || 0
    }
  };
}

module.exports = {
  ensureDefaultPlans,
  getPlanPricing,
  getAllPlansWithPricing,
  getApplicableDiscounts,
  computePricing,
  recordPricingChange,
  syncDiscountStatuses,
  getPricingCenterOverview,
  resolveDiscountLifecycle,
  discountApplies
};
