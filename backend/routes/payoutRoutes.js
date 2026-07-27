const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    connectStripeAccount,
    getStripeAccountStatus,
    getStripeLoginLink,
    getSellerEarnings,
    getAdminPayouts,
    releasePayout,
    holdPayout,
    unholdPayout,
    cancelPayout
} = require('../controllers/payoutController');

// Seller routes (manufacturer / wholesaler)
router.post('/connect', protect, authorize('manufacturer', 'wholesaler'), connectStripeAccount);
router.get('/stripe-status', protect, authorize('manufacturer', 'wholesaler'), getStripeAccountStatus);
router.get('/stripe-login', protect, authorize('manufacturer', 'wholesaler'), getStripeLoginLink);
router.get('/earnings', protect, authorize('manufacturer', 'wholesaler'), getSellerEarnings);

// Admin routes
router.get('/admin/list', protect, authorize('admin'), getAdminPayouts);
router.post('/admin/:id/release', protect, authorize('admin'), releasePayout);
router.post('/admin/:id/hold', protect, authorize('admin'), holdPayout);
router.post('/admin/:id/unhold', protect, authorize('admin'), unholdPayout);
router.post('/admin/:id/cancel', protect, authorize('admin'), cancelPayout);

module.exports = router;
