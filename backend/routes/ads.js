const express = require('express');
const router = express.Router();
const AdCampaign = require('../models/AdCampaign');
const { protect } = require('../middleware/authMiddleware');

// Log requests
router.use((req, res, next) => {
    console.log(`[ADS API] ${req.method} ${req.url}`);
    next();
});

// GET /api/ads - Get all ads (Admin console review)
router.get('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Unauthorized administrative clearance required.' });
    }
    const ads = await AdCampaign.find({}).populate('manufacturer', 'name email businessDetails').sort({ createdAt: -1 });
    res.json({ success: true, data: ads });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/ads/manufacturer - Get ads created by current manufacturer
router.get('/manufacturer', protect, async (req, res) => {
  try {
    const ads = await AdCampaign.find({ manufacturer: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: ads });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/ads - Create campaign (Manufacturer paid promotion simulate)
router.post('/', protect, async (req, res) => {
  try {
    const { name, tagline, placement, plan, duration, targetCategory, budget } = req.body;
    const ad = await AdCampaign.create({
      manufacturer: req.user.id,
      name,
      tagline,
      placement,
      plan,
      duration,
      targetCategory: targetCategory || 'all',
      budget,
      status: 'pending'
    });
    res.status(201).json({ success: true, data: ad });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/ads/:id/approve - Approve (Admin trigger)
router.post('/:id/approve', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Unauthorized administrative clearance required.' });
    }
    const ad = await AdCampaign.findByIdAndUpdate(req.params.id, { status: 'Active' }, { new: true });
    if (!ad) return res.status(404).json({ success: false, error: 'Campaign record not found.' });
    res.json({ success: true, data: ad });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/ads/:id/reject - Reject with audit feedback (Admin trigger)
router.post('/:id/reject', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Unauthorized administrative clearance required.' });
    }
    const { feedback } = req.body;
    const ad = await AdCampaign.findByIdAndUpdate(req.params.id, { status: 'rejected', feedback }, { new: true });
    if (!ad) return res.status(404).json({ success: false, error: 'Campaign record not found.' });
    res.json({ success: true, data: ad });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/ads/:id/click - Increment ad click counters
router.post('/:id/click', async (req, res) => {
  try {
    const ad = await AdCampaign.findByIdAndUpdate(req.params.id, { $inc: { clicks: 1 } }, { new: true });
    if (!ad) return res.status(404).json({ success: false, error: 'Campaign record not found.' });
    res.json({ success: true, data: { clicks: ad.clicks } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/ads/:id/impression - Increment ad impression counters
router.post('/:id/impression', async (req, res) => {
  try {
    const ad = await AdCampaign.findByIdAndUpdate(req.params.id, { $inc: { impressions: 1 } }, { new: true });
    if (!ad) return res.status(404).json({ success: false, error: 'Campaign record not found.' });
    res.json({ success: true, data: { impressions: ad.impressions } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
