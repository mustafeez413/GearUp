const AdPlan = require('../models/AdPlan');
const AdvertisementDiscount = require('../models/AdvertisementDiscount');
const PricingHistory = require('../models/PricingHistory');
const AuditLog = require('../models/AuditLog');
const {
  ensureDefaultPlans,
  getAllPlansWithPricing,
  getPlanPricing,
  getPricingCenterOverview,
  recordPricingChange,
  syncDiscountStatuses,
  resolveDiscountLifecycle
} = require('../services/adPricingService');

exports.getPricingCenter = async (req, res) => {
  try {
    const data = await getPricingCenterOverview();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getAdminPlans = async (req, res) => {
  try {
    await ensureDefaultPlans();
    const plans = await AdPlan.find().sort({ duration: 1 });
    res.json({ success: true, data: plans });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updatePlanPrice = async (req, res) => {
  try {
    await ensureDefaultPlans();
    const plan = await AdPlan.findOne({ slug: req.params.slug });
    if (!plan) return res.status(404).json({ success: false, error: 'Plan not found' });

    const { price, planName, duration, status, description, packageWeight } = req.body;
    const oldPrice = plan.price;

    if (price !== undefined) plan.price = Number(price);
    if (planName) { plan.planName = planName; }
    if (duration !== undefined) { plan.duration = Number(duration); }
    if (status) { plan.status = status; plan.isActive = status === 'active'; }
    if (description !== undefined) plan.description = description;
    if (packageWeight !== undefined) plan.packageWeight = packageWeight;

    await plan.save();

    if (price !== undefined && oldPrice !== plan.price) {
      await recordPricingChange(
        req.user.id,
        { planName: plan.planName, slug: plan.slug, price: oldPrice },
        plan.price
      );
      await AuditLog.create({
        action: `Updated ${plan.planName} ad plan price from PKR ${oldPrice} to PKR ${plan.price}`,
        performedBy: req.user.id,
        targetEntity: `AdvertisementPlan:${plan.slug}`,
        status: 'success'
      });
    }

    res.json({ success: true, data: plan });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getDiscounts = async (req, res) => {
  try {
    await syncDiscountStatuses();
    const discounts = await AdvertisementDiscount.find().sort({ createdAt: -1 });
    res.json({ success: true, data: discounts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createDiscount = async (req, res) => {
  try {
    const {
      discountName,
      discountPercentage,
      startDate,
      endDate,
      status = 'active',
      applyTo = 'all_plans',
      applicablePlans = [],
      applicableCategories = [],
      isPromotion = false,
      promotionTag = ''
    } = req.body;

    const discount = await AdvertisementDiscount.create({
      discountName,
      discountPercentage,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status,
      applyTo,
      applicablePlans,
      applicableCategories,
      isPromotion,
      promotionTag,
      createdBy: req.user.id
    });

    discount.status = resolveDiscountLifecycle(discount);
    await discount.save();

    await AuditLog.create({
      action: `Created ad discount "${discountName}" (${discountPercentage}%)`,
      performedBy: req.user.id,
      targetEntity: `AdvertisementDiscount:${discount._id}`,
      status: 'success'
    });

    res.status(201).json({ success: true, data: discount });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.updateDiscount = async (req, res) => {
  try {
    const discount = await AdvertisementDiscount.findById(req.params.id);
    if (!discount) return res.status(404).json({ success: false, error: 'Discount not found' });

    const fields = [
      'discountName', 'discountPercentage', 'startDate', 'endDate', 'status',
      'applyTo', 'applicablePlans', 'applicableCategories', 'isPromotion', 'promotionTag'
    ];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        discount[f] = f === 'startDate' || f === 'endDate' ? new Date(req.body[f]) : req.body[f];
      }
    });

    if (discount.status !== 'inactive') {
      discount.status = resolveDiscountLifecycle(discount);
    }
    await discount.save();

    await AuditLog.create({
      action: `Updated ad discount "${discount.discountName}"`,
      performedBy: req.user.id,
      targetEntity: `AdvertisementDiscount:${discount._id}`,
      status: 'success'
    });

    res.json({ success: true, data: discount });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.toggleDiscount = async (req, res) => {
  try {
    const discount = await AdvertisementDiscount.findById(req.params.id);
    if (!discount) return res.status(404).json({ success: false, error: 'Discount not found' });

    if (discount.status === 'inactive') {
      discount.status = resolveDiscountLifecycle(discount);
    } else {
      discount.status = 'inactive';
    }
    await discount.save();

    res.json({ success: true, data: discount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getPricingHistory = async (req, res) => {
  try {
    const history = await PricingHistory.find()
      .populate('adminId', 'name email')
      .sort({ changedAt: -1 })
      .limit(Number(req.query.limit) || 50);
    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getPlansWithPricing = async (req, res) => {
  try {
    const category = req.query.category || null;
    const data = await getAllPlansWithPricing(category);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getSinglePlanPricing = async (req, res) => {
  try {
    const data = await getPlanPricing(req.params.slug, req.query.category || null);
    if (!data) return res.status(404).json({ success: false, error: 'Plan not found' });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
