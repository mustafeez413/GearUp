const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const { uploadToCloudinary } = require('../utils/cloudinary');

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 50000000 },
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp|pdf|mp4|webm|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only JPG, JPEG, PNG, WEBP, PDF, and video files are allowed'));
    }
});

router.post('/', protect, (req, res) => {
    upload.single('file')(req, res, async (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                error: err.message || 'Upload failed'
            });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        try {
            const folder = req.query.type === 'proof' ? 'proofs' : 'gearup';
            const uploadResult = await uploadToCloudinary(req.file.buffer, folder);

            return res.status(200).json({
                success: true,
                filePath: uploadResult.secure_url,
                url: uploadResult.secure_url
            });
        } catch (uploadErr) {
            return res.status(500).json({
                success: false,
                error: uploadErr.message || 'Failed to upload to Cloudinary'
            });
        }
    });
});

module.exports = router;
