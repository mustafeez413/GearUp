const Banner = require('../models/Banner');

// Get active banners
exports.getBanners = async (req, res) => {
    try {
        const banners = await Banner.find({ 
            isActive: true,
            $or: [
                { endDate: { $exists: false } },
                { endDate: { $gte: new Date() } }
            ]
        }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: banners });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Create banner (Admin or Manufacturer application)
exports.createBanner = async (req, res) => {
    try {
        if (req.user.role === 'manufacturer') {
            req.body.seller = req.user.id;
            req.body.isActive = false; // Requires admin approval
        }
        const banner = await Banner.create(req.body);
        res.status(201).json({ success: true, data: banner });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Admin only: Update banner
exports.updateBanner = async (req, res) => {
    try {
        const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ success: true, data: banner });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
