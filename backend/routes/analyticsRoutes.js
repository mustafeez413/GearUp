const express = require('express');
const router = express.Router();
const { getMarketShare } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/market-share', protect, authorize('manufacturer', 'admin'), getMarketShare);

module.exports = router;
