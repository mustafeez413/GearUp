const express = require('express');
const router = express.Router();
const { getBanners, createBanner, updateBanner } = require('../controllers/bannerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', getBanners);
router.post('/', protect, createBanner);
router.put('/:id', protect, authorize('admin'), updateBanner);

module.exports = router;
