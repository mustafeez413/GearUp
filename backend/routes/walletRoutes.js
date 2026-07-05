const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getMyWallet,
    getMyEscrows,
    getMyLedger,
    withdraw,
    getAdminStats,
    getAdminEscrows
} = require('../controllers/walletController');

router.use(protect);

router.get('/me', getMyWallet);
router.get('/escrows', authorize('manufacturer', 'wholesaler', 'admin'), getMyEscrows);
router.get('/ledger', getMyLedger);
router.post('/withdraw', authorize('manufacturer'), withdraw);

router.get('/admin/stats', authorize('admin'), getAdminStats);
router.get('/admin/escrows', authorize('admin'), getAdminEscrows);

module.exports = router;
