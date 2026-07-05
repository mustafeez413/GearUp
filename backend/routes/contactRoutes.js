const express = require('express');
const { submitContact, getMySupportRequests, getMySupportRequestById } = require('../controllers/contactController');
const { optionalAuth, protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', optionalAuth, submitContact);
router.get('/mine', protect, getMySupportRequests);
router.get('/mine/:id', protect, getMySupportRequestById);

module.exports = router;
