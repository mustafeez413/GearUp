const express = require('express');
const router = express.Router();
const {
    createDispute,
    getDispute,
    getMyDisputes,
    getSellerDisputes,
    getAdminDisputes,
    updateDisputeStatus,
    buyerRespond,
    sellerRespond,
    sellerRefund,
    adminRequestSellerResponse,
    adminMessage,
    adminRejectDispute,
    adminRefundDispute
} = require('../controllers/disputeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', authorize('wholesaler', 'manufacturer'), createDispute);
router.get('/mine', authorize('wholesaler', 'manufacturer'), getMyDisputes);
router.get('/seller', authorize('manufacturer', 'wholesaler'), getSellerDisputes);
router.get('/admin', authorize('admin'), getAdminDisputes);
router.get('/:id', getDispute);
router.put('/:id/buyer/respond', authorize('wholesaler', 'manufacturer'), buyerRespond);
router.put('/:id/seller/respond', authorize('manufacturer', 'wholesaler'), sellerRespond);
router.put('/:id/seller/refund', authorize('manufacturer', 'wholesaler'), sellerRefund);
router.put('/:id/admin/request-seller', authorize('admin'), adminRequestSellerResponse);
router.post('/:id/admin/message', authorize('admin'), adminMessage);
router.put('/:id/admin/reject', authorize('admin'), adminRejectDispute);
router.put('/:id/status', authorize('admin'), updateDisputeStatus);
router.put('/:id/refund', authorize('admin'), adminRefundDispute);

module.exports = router;
