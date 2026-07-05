const express = require('express');
const router = express.Router();
const {
  getPlans,
  updatePlan,
  getMyCampaigns,
  getBillingHistory,
  createCampaign,
  updateCampaign,
  payCampaign,
  pauseCampaign,
  resumeCampaign,
  cancelCampaign,
  duplicateCampaign,
  getCampaignAnalytics,
  getSponsoredProducts,
  getRecommendedSponsored,
  trackImpression,
  trackClick,
  trackView,
  trackInquiry,
  trackQuote,
  getAdminOverview,
  getAdminCampaigns,
  getAdminRevenueAnalytics,
  getAdminAdTransactions,
  approveCampaign,
  rejectCampaign,
  expireCampaign,
  extendCampaign,
  deleteCampaign
} = require('../controllers/advertisementController');
const {
  getPricingCenter,
  getAdminPlans,
  updatePlanPrice,
  getDiscounts,
  createDiscount,
  updateDiscount,
  toggleDiscount,
  getPricingHistory,
  getPlansWithPricing,
  getSinglePlanPricing
} = require('../controllers/adPricingController');
const { protect, authorize, optionalAuth } = require('../middleware/authMiddleware');

router.get('/plans', getPlansWithPricing);
router.get('/plans/:slug/pricing', optionalAuth, getSinglePlanPricing);

router.get('/sponsored', optionalAuth, getSponsoredProducts);
router.get('/recommended', optionalAuth, getRecommendedSponsored);

router.post('/:id/track/impression', optionalAuth, trackImpression);
router.post('/:id/track/click', optionalAuth, trackClick);
router.post('/:id/track/view', optionalAuth, trackView);
router.post('/:id/track/inquiry', protect, trackInquiry);
router.post('/:id/track/quote', protect, trackQuote);

router.use(protect);

router.get('/mine', authorize('manufacturer'), getMyCampaigns);
router.get('/billing/history', authorize('manufacturer'), getBillingHistory);
router.post('/', authorize('manufacturer'), createCampaign);
router.put('/:id', authorize('manufacturer'), updateCampaign);
router.post('/:id/pay', authorize('manufacturer'), payCampaign);
router.post('/:id/pause', authorize('manufacturer', 'admin'), pauseCampaign);
router.post('/:id/resume', authorize('manufacturer', 'admin'), resumeCampaign);
router.post('/:id/cancel', authorize('manufacturer'), cancelCampaign);
router.delete('/:id', authorize('manufacturer', 'admin'), deleteCampaign);
router.post('/:id/duplicate', authorize('manufacturer'), duplicateCampaign);
router.get('/:id/analytics', authorize('manufacturer', 'admin'), getCampaignAnalytics);

router.get('/admin/overview', authorize('admin'), getAdminOverview);
router.get('/admin/campaigns', authorize('admin'), getAdminCampaigns);
router.get('/admin/revenue/analytics', authorize('admin'), getAdminRevenueAnalytics);
router.get('/admin/revenue/transactions', authorize('admin'), getAdminAdTransactions);
router.get('/admin/pricing/center', authorize('admin'), getPricingCenter);
router.get('/admin/pricing/plans', authorize('admin'), getAdminPlans);
router.put('/admin/pricing/plans/:slug', authorize('admin'), updatePlanPrice);
router.get('/admin/pricing/discounts', authorize('admin'), getDiscounts);
router.post('/admin/pricing/discounts', authorize('admin'), createDiscount);
router.put('/admin/pricing/discounts/:id', authorize('admin'), updateDiscount);
router.post('/admin/pricing/discounts/:id/toggle', authorize('admin'), toggleDiscount);
router.get('/admin/pricing/history', authorize('admin'), getPricingHistory);
router.put('/admin/plans/:slug', authorize('admin'), updatePlanPrice);
router.post('/:id/approve', authorize('admin'), approveCampaign);
router.post('/:id/reject', authorize('admin'), rejectCampaign);
router.post('/:id/expire', authorize('admin'), expireCampaign);
router.post('/:id/extend', authorize('admin'), extendCampaign);

module.exports = router;
