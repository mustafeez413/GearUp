const express = require('express');
const { getUsers, verifyUser, getVerificationOverview, getPendingVerifications, updateVerificationNotes, blockUser, unblockUser, getSystemLogs, getAnalytics } = require('../controllers/adminController');
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Protect all routes and authorize only admin
router.use(protect);
router.use(authorize('admin'));

router.get('/users', getUsers);
router.put('/users/:id/verify', verifyUser);
router.put('/users/:id/verification-notes', updateVerificationNotes);
router.put('/users/:id/block', blockUser);
router.put('/users/:id/unblock', unblockUser);
router.get('/verifications/overview', getVerificationOverview);
router.get('/verifications/pending', getPendingVerifications);

router.get('/logs', getSystemLogs);
router.get('/analytics', getAnalytics);
router.get('/settings', require('../controllers/adminController').getSettings);
router.put('/settings', require('../controllers/adminController').updateSettings);
router.get('/contact-messages', require('../controllers/adminController').getContactMessages);
router.get('/contact-messages/:id', require('../controllers/adminController').getContactMessageById);
router.post('/contact-messages/:id/reply', require('../controllers/adminController').replyContactMessage);
router.put('/contact-messages/:id/status', require('../controllers/adminController').updateContactMessageStatus);
router.put('/contact-messages/:id/close', require('../controllers/adminController').closeContactMessage);

// Admin product management
router.get('/products', getProducts);
router.post('/products', createProduct);
router.get('/products/:id', getProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

const path = require('path');
const fs = require('fs');

router.get('/proof/:filename', (req, res) => {
    const filename = req.params.filename;
    // Basic sanitization
    if (filename.includes('..') || filename.includes('/')) {
        return res.status(400).json({ error: 'Invalid filename' });
    }
    const filePath = path.join(__dirname, '../uploads', filename);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).json({ error: 'File not found' });
    }
});

router.get('/operations/summary', require('../controllers/adminController').getOperationsSummary);
router.get('/payouts', require('../controllers/adminController').getPayouts);
router.put('/payouts/:id/pay', require('../controllers/adminController').markPayoutAsPaid);

module.exports = router;
