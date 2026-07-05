const express = require('express');
const { createOrder, getOrders, getOrder, updateOrderStatus, updatePaymentStatus, approveOrder } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

// Wholesalers and manufacturers may purchase from other manufacturers (not their own stock).
router.post('/', authorize('wholesaler', 'manufacturer'), createOrder);
router.get('/', getOrders);
router.get('/:id', getOrder);
router.put('/:id/status', authorize('manufacturer', 'wholesaler'), updateOrderStatus);
router.put('/:id/payment', updatePaymentStatus);
router.put('/:id/approve', authorize('wholesaler', 'manufacturer'), approveOrder);

module.exports = router;
