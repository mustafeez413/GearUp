const express = require('express');
const router = express.Router();
const { createPaymentIntent, handleWebhook } = require('../controllers/stripeController');
const { protect } = require('../middleware/authMiddleware');

// Webhook requires raw body parsing; it does not require auth protection
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// PaymentIntent creation requires JSON body parsing and authorization
router.post('/create-payment-intent', express.json(), protect, createPaymentIntent);

module.exports = router;
