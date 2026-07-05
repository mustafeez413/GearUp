const express = require('express');
const {
    getAdminTransactions,
    getAdminCommissionStats,
    getMyTransactions,
    updateCommissionSettings,
    getCommissionPolicy,
    createPayout,
    createRefund,
    releaseSettlement,
    updateTransactionStatus
} = require('../controllers/transactionController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// User-facing transaction route (Manufacturer/Wholesaler)
router.get('/my-payouts', getMyTransactions);
router.get('/commission-policy', getCommissionPolicy);

// Admin-only commission & transaction controls
router.get('/admin', authorize('admin'), getAdminTransactions);
router.get('/admin/stats', authorize('admin'), getAdminCommissionStats);
router.put('/admin/settings', authorize('admin'), updateCommissionSettings);
router.post('/admin/payouts', authorize('admin'), createPayout);
router.post('/admin/refunds', authorize('admin'), createRefund);
router.put('/admin/settlements/:id/release', authorize('admin'), releaseSettlement);
router.put('/:id/status', authorize('admin'), updateTransactionStatus);

module.exports = router;
