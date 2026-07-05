const express = require('express');
const { register, login, googleAuth, getUser, getManufacturers, logout, submitVerification, getVerificationDocument, updateCapacity, forgotPassword, resetPassword, changePassword, updateProfile, getCurrentUser, verifyEmail, resendOTP, acceptPolicies } = require('../controllers/authController');
const { getSettings } = require('../controllers/adminController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.use((req, res, next) => {
    console.log(`[AUTH] ${req.method} ${req.url}`);
    next();
});

const path = require('path');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

router.post('/register', upload.single('businessLicense'), register);
router.put('/verify-business', protect, upload.single('businessLicense'), submitVerification);
router.get('/verification-document', protect, getVerificationDocument);
router.put('/capacity', protect, updateCapacity);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendOTP);
router.get('/logout', logout);
router.get('/me', protect, getCurrentUser);
router.get('/user/:id', getUser);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.put('/profile', protect, upload.single('avatar'), updateProfile);
router.put('/change-password', protect, changePassword);
router.put('/accept-policies', protect, acceptPolicies);
router.get('/settings', protect, getSettings);
router.get('/manufacturers', optionalAuth, getManufacturers);

module.exports = router;
