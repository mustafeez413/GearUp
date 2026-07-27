const express = require('express');
const { createOrder, getOrders, getOrder, updateOrderStatus, updatePaymentStatus, approveOrder } = require('../controllers/orderController');
const { protect, authorize, requireVerifiedBusiness } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

// Purchasing requires business verification
router.post('/', requireVerifiedBusiness, authorize('wholesaler', 'manufacturer'), createOrder);
router.get('/', getOrders);
router.get('/:id', getOrder);

// Order fulfillment and status changes (selling/purchasing actions) require business verification
router.put('/:id/status', requireVerifiedBusiness, authorize('manufacturer', 'wholesaler'), updateOrderStatus);
router.put('/:id/payment', requireVerifiedBusiness, updatePaymentStatus);
router.put('/:id/approve', requireVerifiedBusiness, authorize('wholesaler', 'manufacturer'), approveOrder);

module.exports = router;
