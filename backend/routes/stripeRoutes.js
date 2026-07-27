const express = require('express');
const router = express.Router();
const { createPaymentIntent, handleWebhook } = require('../controllers/stripeController');
const { protect, requireVerifiedBusiness } = require('../middleware/authMiddleware');

// Webhook requires raw body parsing; it does not require auth protection
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// PaymentIntent creation requires JSON body parsing, authorization, and business verification
router.post('/create-payment-intent', express.json(), protect, requireVerifiedBusiness, createPaymentIntent);

module.exports = router;
