const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const prefix = req.query.type === 'proof' ? 'proof-' : 'gearup-';
        cb(null, prefix + Date.now() + path.extname(file.originalname));
    }
});

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
    upload.single('file')(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                error: err.message || 'Upload failed'
            });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        return res.status(200).json({
            success: true,
            filePath: `/uploads/${req.file.filename}`,
            url: `/uploads/${req.file.filename}`
        });
    });
});

module.exports = router;
