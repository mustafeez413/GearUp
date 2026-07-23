const Advertisement = require('../models/Advertisement');
const AdPlan = require('../models/AdPlan');
const AdPayment = require('../models/AdPayment');
const AdClick = require('../models/AdClick');
const AdImpression = require('../models/AdImpression');
const AdAnalytics = require('../models/AdAnalytics');
const Product = require('../models/Product');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

const { computeCtr, computeAdRankScore } = require('../utils/adRanking');
const {
  ensureDefaultPlans,
  getAllPlansWithPricing,
  getPlanPricing
} = require('../services/adPricingService');
const {
  transitionCampaign,
  expireCampaignRecord,
  expireDueCampaigns,
  extendCampaignEndDate
} = require('../services/adCampaignLifecycleService');
const { runExpiryCheck } = require('../jobs/adCampaignExpiryJob');
const {
  getAdminRevenueDashboard,
  getAdminAdTransactions
} = require('../services/adRevenueService');

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function bumpDailyAnalytics(adId, field, amount = 1) {
  const day = startOfDay();
  await AdAnalytics.findOneAndUpdate(
    { advertisementId: adId, date: day },
    { $inc: { [field]: amount } },
    { upsert: true, new: true }
  );
}

async function refreshAdMetrics(ad) {
  ad.ctr = computeCtr(ad.clicks, ad.impressions);
  const product = await Product.findById(ad.productId).lean();
  const manufacturer = await User.findById(ad.manufacturerId).select('verificationStatus').lean();
  ad.rankScore = computeAdRankScore(ad, product, manufacturer);
  await ad.save();
  return ad;
}

async function populateAdQuery(query) {
  return query
    .populate('manufacturerId', 'name businessDetails verificationStatus avatar role')
    .populate('productId', 'name images price category minimumOrderQuantity bulkUnit stock description');
}

function serializeSponsoredAd(ad) {
  const product = ad.productId;
  const manufacturer = ad.manufacturerId;
  return {
    _id: ad._id,
    campaignId: ad._id,
    advertisementId: ad._id,
    productId: product?._id || ad.productId,
    campaignType: ad.campaignType,
    customMedia: ad.customMedia || null,
    description: ad.description || '',
    plan: ad.plan,
    rankScore: ad.rankScore,
    status: ad.status,
    product: product ? {
      _id: product._id,
      name: product.name,
      image: product.images?.[0] || null,
      images: product.images,
      price: product.price,
      category: product.category,
      minimumOrderQuantity: product.minimumOrderQuantity,
      bulkUnit: product.bulkUnit,
      stock: product.stock
    } : null,
    manufacturer: manufacturer ? {
      _id: manufacturer._id,
      name: manufacturer.name,
      city: manufacturer.businessDetails?.city || 'Pakistan',
      country: manufacturer.businessDetails?.country || 'Pakistan',
      verified: manufacturer.verificationStatus === 'verified',
      role: manufacturer.role
    } : null
  };
}

async function getActiveAdsFilter(extra = {}) {
  const now = new Date();
  return {
    paymentStatus: 'paid',
    approvalStatus: 'approved',
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now },
    ...extra
  };
}

// @desc    Get ad plans with dynamic admin pricing & discounts
exports.getPlans = async (req, res) => {
  try {
    const category = req.query.category || null;
    const data = await getAllPlansWithPricing(category);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Update ad plan pricing (admin) — legacy route, delegates to pricing controller pattern
exports.updatePlan = async (req, res) => {
  try {
    const adPricing = require('./adPricingController');
    req.params.slug = req.params.slug;
    return adPricing.updatePlanPrice(req, res);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Manufacturer campaigns
exports.getMyCampaigns = async (req, res) => {
  try {
    const ads = await populateAdQuery(
      Advertisement.find({ manufacturerId: req.user.id }).sort({ createdAt: -1 })
    );
    res.json({ success: true, count: ads.length, data: ads });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Billing history
exports.getBillingHistory = async (req, res) => {
  try {
    const payments = await AdPayment.find({ manufacturerId: req.user.id })
      .populate('advertisementId', 'plan status productId startDate endDate')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get single campaign by ID
exports.getCampaignById = async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id)
      .populate('manufacturerId', 'name email businessDetails')
      .populate('productId', 'name category price images')
      .populate('approvedBy', 'name email')
      .populate('rejectedBy', 'name email');
    if (!ad) return res.status(404).json({ success: false, error: 'Campaign not found' });
    
    // Check auth
    if (String(ad.manufacturerId._id || ad.manufacturerId) !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    res.json({ success: true, data: ad });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Create campaign
exports.createCampaign = async (req, res) => {
  try {
    await ensureDefaultPlans();
    const {
      productId,
      campaignType = 'sponsored_product',
      plan,
      budget,
      description,
      startDate,
      endDate,
      submitForPayment,
      customMedia
    } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    if (String(product.manufacturer) !== req.user.id) {
      return res.status(403).json({ success: false, error: 'You can only advertise your own products' });
    }

    const planDoc = await AdPlan.findOne({ slug: plan, status: 'active', isActive: true });
    if (!planDoc) return res.status(400).json({ success: false, error: 'Invalid plan selected' });

    const pricing = await getPlanPricing(plan, product.category);
    const campaignBudget = pricing?.finalPrice ?? planDoc.price;

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate
      ? new Date(endDate)
      : new Date(start.getTime() + (planDoc.duration || 7) * 24 * 60 * 60 * 1000);

    const ad = await Advertisement.create({
      manufacturerId: req.user.id,
      productId,
      campaignType,
      plan,
      budget: budget ?? campaignBudget,
      description: description || '',
      startDate: start,
      endDate: end,
      status: submitForPayment ? 'pending_payment' : 'draft',
      customMedia: customMedia || null,
      amountPaid: 0,
      originalPrice: pricing?.originalPrice ?? planDoc.price,
      discountPercent: pricing?.discountPercent ?? 0,
      discountName: pricing?.discountName || ''
    });

    const populated = await populateAdQuery(Advertisement.findById(ad._id));
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Update draft campaign
exports.updateCampaign = async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    if (!ad) return res.status(404).json({ success: false, error: 'Campaign not found' });
    if (String(ad.manufacturerId) !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    if (!['draft', 'pending_payment'].includes(ad.status)) {
      return res.status(400).json({ success: false, error: 'Only draft or pending payment campaigns can be edited' });
    }

    const allowed = ['campaignType', 'plan', 'budget', 'description', 'startDate', 'endDate', 'productId'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) ad[key] = req.body[key];
    }

    if (req.body.plan) {
      const planDoc = await AdPlan.findOne({ slug: req.body.plan, isActive: true });
      if (planDoc && !req.body.endDate && ad.startDate) {
        ad.endDate = new Date(ad.startDate.getTime() + (planDoc.duration || 7) * 24 * 60 * 60 * 1000);
      }
    }

    await ad.save();
    const populated = await populateAdQuery(Advertisement.findById(ad._id));
    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Create Stripe Checkout Session for campaign
exports.createCheckoutSession = async (req, res) => {
  try {
    await ensureDefaultPlans();
    const ad = await Advertisement.findById(req.params.id);
    if (!ad) return res.status(404).json({ success: false, error: 'Campaign not found' });
    if (String(ad.manufacturerId) !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    if (!['draft', 'pending_payment'].includes(ad.status)) {
      return res.status(400).json({ success: false, error: 'Campaign is not awaiting payment' });
    }

    const planDoc = await AdPlan.findOne({ slug: ad.plan });
    const product = await Product.findById(ad.productId).select('category name');
    const pricing = await getPlanPricing(ad.plan, product?.category);
    const amount = pricing?.finalPrice ?? planDoc?.price ?? ad.budget;
    const originalPrice = pricing?.originalPrice ?? amount;

    // Update ad metadata before payment
    ad.budget = amount;
    ad.originalPrice = originalPrice;
    ad.discountPercent = pricing?.discountPercent ?? 0;
    ad.discountName = pricing?.discountName || '';
    if (!ad.startDate) ad.startDate = new Date();
    if (!ad.endDate && planDoc) {
      ad.endDate = new Date(ad.startDate.getTime() + (planDoc.duration || 7) * 24 * 60 * 60 * 1000);
    }
    await ad.save();

    // Generate Stripe Checkout session
    const stripe = require('../services/stripeService');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'pkr',
            product_data: {
              name: `Advertisement: ${planDoc?.name || ad.plan}`,
              description: `Campaign for ${product?.name || 'Product'}`
            },
            unit_amount: Math.round(amount * 100), // convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${frontendUrl}/manufacturer/advertising/campaigns?payment_success=true&ad_id=${ad._id}`,
      cancel_url: `${frontendUrl}/manufacturer/advertising/create?payment_cancelled=true`,
      metadata: {
        advertisementId: ad._id.toString(),
        manufacturerId: req.user.id,
        amount: amount.toString(),
        plan: ad.plan
      }
    });

    ad.stripeCheckoutSessionId = session.id;
    await ad.save();

    res.json({
      success: true,
      url: session.url
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.pauseCampaign = async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    if (!ad) return res.status(404).json({ success: false, error: 'Campaign not found' });
    const isOwner = String(ad.manufacturerId) === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, error: 'Not authorized' });
    if (ad.status !== 'active') return res.status(400).json({ success: false, error: 'Only active campaigns can be paused' });
    await transitionCampaign(ad, 'paused', {
      reason: isAdmin ? 'admin_pause' : 'manufacturer_pause',
      performedBy: req.user.id
    });
    res.json({ success: true, data: ad });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.resumeCampaign = async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    if (!ad) return res.status(404).json({ success: false, error: 'Campaign not found' });
    const isOwner = String(ad.manufacturerId) === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, error: 'Not authorized' });
    if (ad.status !== 'paused') return res.status(400).json({ success: false, error: 'Only paused campaigns can be resumed' });
    if (ad.endDate && new Date() > ad.endDate) {
      await expireCampaignRecord(ad, {
        reason: 'auto_expiry',
        performedBy: req.user.id,
        notes: 'Expired on resume because end date had passed',
        notify: true
      });
      return res.status(400).json({ success: false, error: 'Campaign has expired' });
    }
    await transitionCampaign(ad, 'active', {
      reason: isAdmin ? 'admin_resume' : 'manufacturer_resume',
      performedBy: req.user.id
    });
    res.json({ success: true, data: ad });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.cancelCampaign = async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    if (!ad) return res.status(404).json({ success: false, error: 'Campaign not found' });
    if (String(ad.manufacturerId) !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    if (!['draft', 'pending_payment', 'pending_approval', 'paused'].includes(ad.status)) {
      return res.status(400).json({ success: false, error: 'This campaign cannot be cancelled' });
    }
    ad.status = 'completed';
    await ad.save();
    res.json({ success: true, data: ad });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.duplicateCampaign = async (req, res) => {
  try {
    const source = await Advertisement.findById(req.params.id);
    if (!source) return res.status(404).json({ success: false, error: 'Campaign not found' });
    if (String(source.manufacturerId) !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const planDoc = await AdPlan.findOne({ slug: source.plan });
    const start = new Date();
    const end = new Date(start.getTime() + (planDoc?.duration || 7) * 24 * 60 * 60 * 1000);

    const copy = await Advertisement.create({
      manufacturerId: source.manufacturerId,
      productId: source.productId,
      campaignType: source.campaignType,
      plan: source.plan,
      budget: source.budget,
      description: source.description,
      startDate: start,
      endDate: end,
      status: 'pending_payment',
      customMedia: source.customMedia,
      duplicatedFrom: source._id
    });

    const populated = await populateAdQuery(Advertisement.findById(copy._id));
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getCampaignAnalytics = async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    if (!ad) return res.status(404).json({ success: false, error: 'Campaign not found' });
    const isOwner = String(ad.manufacturerId) === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, error: 'Not authorized' });

    const { from, to } = req.query;
    const filter = { advertisementId: ad._id };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = startOfDay(new Date(from));
      if (to) filter.date.$lte = startOfDay(new Date(to));
    }

    const daily = await AdAnalytics.find(filter).sort({ date: 1 });

    res.json({
      success: true,
      data: {
        summary: {
          impressions: ad.impressions,
          views: ad.views,
          clicks: ad.clicks,
          ctr: ad.ctr,
          inquiries: ad.inquiries,
          quoteRequests: ad.quoteRequests,
          ordersGenerated: ad.ordersGenerated,
          revenueGenerated: ad.revenueGenerated,
          amountPaid: ad.amountPaid
        },
        daily
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Public sponsored products for marketplace
exports.getSponsoredProducts = async (req, res) => {
  try {
    setImmediate(() => {
      runExpiryCheck('sponsored_request').catch(() => {});
    });

    const { category, keyword, limit = 12, placement = 'marketplace' } = req.query;

    const extraFilter = {};
    if (['manufacturer_overview', 'wholesaler_overview'].includes(placement)) {
      return res.json({ success: true, count: 0, data: [] });
    } else if (['homepage_featured', 'featured', 'featured_product'].includes(placement)) {
      extraFilter.campaignType = { $in: ['homepage_featured', 'featured_product'] };
    } else {
      extraFilter.campaignType = 'sponsored_product';
    }

    const filter = await getActiveAdsFilter(extraFilter);

    let ads = await populateAdQuery(
      Advertisement.find(filter).sort({ rankScore: -1, createdAt: -1 }).limit(Number(limit) * 3)
    );

    if (category && category !== 'all') {
      ads = ads.filter((ad) => {
        const cat = (ad.productId?.category || '').toLowerCase();
        return cat.includes(String(category).toLowerCase());
      });
    }

    if (keyword) {
      const q = String(keyword).toLowerCase();
      ads = ads.filter((ad) => {
        const name = (ad.productId?.name || '').toLowerCase();
        const mfg = (ad.manufacturerId?.name || '').toLowerCase();
        return name.includes(q) || mfg.includes(q);
      });
    }

    const serialized = ads.slice(0, Number(limit)).map(serializeSponsoredAd);
    res.json({ success: true, count: serialized.length, data: serialized });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Recommended sponsored for wholesaler dashboard
exports.getRecommendedSponsored = async (req, res) => {
  try {
    setImmediate(() => {
      runExpiryCheck('recommended_request').catch(() => {});
    });

    const limit = Number(req.query.limit) || 5;
    const filter = await getActiveAdsFilter({ campaignType: 'sponsored_product' });
    let ads = await populateAdQuery(
      Advertisement.find(filter).sort({ rankScore: -1 }).limit(limit * 3)
    );

    ads = ads.slice(0, limit);
    res.json({ success: true, data: ads.map(serializeSponsoredAd) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

async function trackEvent(req, res, eventType) {
  try {
    const ad = await Advertisement.findById(req.params.id);
    const now = new Date();
    if (!ad || ad.status !== 'active' || (ad.endDate && now > ad.endDate)) {
      return res.json({ success: true, data: { tracked: false } });
    }

    const placement = req.body.placement || 'marketplace';
    const userId = req.user?.id || null;

    if (eventType === 'click') {
      ad.clicks += 1;
      await AdClick.create({ advertisementId: ad._id, userId, placement, metadata: req.body.metadata });
      await bumpDailyAnalytics(ad._id, 'clicks');
    } else if (eventType === 'view') {
      ad.views += 1;
      await AdImpression.create({ advertisementId: ad._id, userId, eventType: 'view', placement });
      await bumpDailyAnalytics(ad._id, 'views');
    } else if (eventType === 'impression') {
      ad.impressions += 1;
      await AdImpression.create({ advertisementId: ad._id, userId, eventType: 'impression', placement });
      await bumpDailyAnalytics(ad._id, 'impressions');
    } else if (eventType === 'inquiry') {
      ad.inquiries += 1;
      await bumpDailyAnalytics(ad._id, 'inquiries');
    } else if (eventType === 'quote') {
      ad.quoteRequests += 1;
      await bumpDailyAnalytics(ad._id, 'quoteRequests');
    }

    ad.ctr = computeCtr(ad.clicks, ad.impressions);
    const product = await Product.findById(ad.productId).lean();
    const manufacturer = await User.findById(ad.manufacturerId).select('verificationStatus').lean();
    ad.rankScore = computeAdRankScore(ad, product, manufacturer);
    await ad.save();

    res.json({ success: true, data: { tracked: true, clicks: ad.clicks, impressions: ad.impressions } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

exports.trackImpression = (req, res) => trackEvent(req, res, 'impression');
exports.trackClick = (req, res) => trackEvent(req, res, 'click');
exports.trackView = (req, res) => trackEvent(req, res, 'view');
exports.trackInquiry = (req, res) => trackEvent(req, res, 'inquiry');
exports.trackQuote = (req, res) => trackEvent(req, res, 'quote');

// Admin
exports.getAdminOverview = async (req, res) => {
  try {
    const now = new Date();
    const [
      totalCampaigns,
      pendingApproval,
      activeCampaigns,
      expiredCampaigns,
      revenueAgg,
      metricsAgg
    ] = await Promise.all([
      Advertisement.countDocuments(),
      Advertisement.countDocuments({ approvalStatus: 'pending_review' }),
      Advertisement.countDocuments({
        status: 'active',
        startDate: { $lte: now },
        endDate: { $gte: now }
      }),
      Advertisement.countDocuments({ status: { $in: ['expired', 'completed'] } }),
      AdPayment.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Advertisement.aggregate([
        { $group: { _id: null, impressions: { $sum: '$impressions' }, clicks: { $sum: '$clicks' } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalCampaigns,
        pendingApproval,
        activeCampaigns,
        expiredCampaigns,
        revenueGenerated: revenueAgg[0]?.total || 0,
        totalImpressions: metricsAgg[0]?.impressions || 0,
        totalClicks: metricsAgg[0]?.clicks || 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getAdminCampaigns = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status && status !== 'all' ? { status } : {};
    const campaigns = await populateAdQuery(
      Advertisement.find(filter).sort({ createdAt: -1 })
    );
    res.json({ success: true, count: campaigns.length, data: campaigns });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getAdminRevenueAnalytics = async (req, res) => {
  try {
    const data = await getAdminRevenueDashboard();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getAdminAdTransactions = async (req, res) => {
  try {
    const { limit, status } = req.query;
    const data = await getAdminAdTransactions({ limit, status });
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.approveCampaign = async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    if (!ad) return res.status(404).json({ success: false, error: 'Campaign not found' });
    if (ad.paymentStatus !== 'paid') {
      return res.status(400).json({ success: false, error: 'Campaign payment has not been completed' });
    }
    if (ad.approvalStatus === 'approved') {
      return res.status(400).json({ success: false, error: 'Campaign is already approved' });
    }

    ad.approvalStatus = 'approved';
    ad.approvedBy = req.user.id;
    ad.approvedAt = new Date();

    const now = new Date();
    if (ad.startDate && new Date(ad.startDate) > now) {
        ad.status = 'scheduled';
    } else {
        ad.status = 'active';
        if (!ad.startDate) ad.startDate = now;
    }
    
    await ad.save();
    await refreshAdMetrics(ad);

    await createNotification(
      ad.manufacturerId,
      'Congratulations! Your advertisement has been approved and will run according to your selected campaign schedule.',
      'system',
      '/manufacturer/advertising/campaigns'
    );

    const populated = await populateAdQuery(Advertisement.findById(ad._id));
    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.rejectCampaign = async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    if (!ad) return res.status(404).json({ success: false, error: 'Campaign not found' });
    
    ad.approvalStatus = 'rejected';
    ad.status = 'rejected';
    ad.rejectedBy = req.user.id;
    ad.rejectedAt = new Date();
    ad.rejectionReason = req.body.reason || req.body.feedback || 'Does not meet platform guidelines';
    await ad.save();

    await createNotification(
      ad.manufacturerId,
      `Your advertisement was rejected. Reason: ${ad.rejectionReason}`,
      'system',
      '/manufacturer/advertising/campaigns'
    );

    res.json({ success: true, data: ad });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.expireCampaign = async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    if (!ad) return res.status(404).json({ success: false, error: 'Campaign not found' });
    if (!['active', 'paused'].includes(ad.status)) {
      return res.status(400).json({ success: false, error: 'Only active or paused campaigns can be ended early' });
    }

    await expireCampaignRecord(ad, {
      reason: 'manual_expire',
      performedBy: req.user.id,
      notes: 'Ended early by administrator'
    });

    res.json({ success: true, data: ad });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.extendCampaign = async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    if (!ad) return res.status(404).json({ success: false, error: 'Campaign not found' });
    if (!['active', 'paused', 'expired'].includes(ad.status)) {
      return res.status(400).json({
        success: false,
        error: 'Only active, paused, or expired campaigns can be extended'
      });
    }

    await extendCampaignEndDate(ad, {
      days: req.body.days,
      endDate: req.body.endDate,
      performedBy: req.user.id,
      reason: 'admin_extend'
    });

    await createNotification(
      ad.manufacturerId,
      `Your advertisement campaign end date has been extended to ${ad.endDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}.`,
      'system',
      '/manufacturer/advertising/campaigns'
    );

    res.json({ success: true, data: ad });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, error: err.message });
  }
};

// Cron-friendly: expire campaigns past endDate
exports.expireDueCampaigns = expireDueCampaigns;

exports.deleteCampaign = async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    if (!ad) return res.status(404).json({ success: false, error: 'Campaign not found' });
    if (String(ad.manufacturerId) !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    if (!['draft', 'pending_payment', 'pending_approval', 'paused'].includes(ad.status)) {
      return res.status(400).json({ success: false, error: 'This campaign cannot be deleted' });
    }
    // Delete from Cloudinary first
    if (ad.customMedia) {
      const { deleteFromUrl } = require('../utils/cloudinary');
      await deleteFromUrl(ad.customMedia);
    }
    await Advertisement.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
