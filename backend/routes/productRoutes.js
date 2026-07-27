const express = require('express');
const {
    getProducts,
    getProduct,
    getProductCategories,
    createProduct,
    updateProduct,
    deleteProduct,
    getInventoryAnalytics,
    uploadImage
} = require('../controllers/productController');
const { protect, authorize, optionalAuth, requireVerifiedBusiness } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/', optionalAuth, getProducts);
router.get('/categories', optionalAuth, getProductCategories);
router.get('/:id', optionalAuth, getProduct);

// Protected routes
router.use(protect);

router.get('/analytics/inventory', authorize('manufacturer', 'wholesaler'), getInventoryAnalytics);

router.use(authorize('manufacturer', 'wholesaler', 'admin'));

// Selling products requires business verification
router.post('/', requireVerifiedBusiness, createProduct);
router.post('/upload-image', requireVerifiedBusiness, upload.single('image'), uploadImage);
router.put('/:id', requireVerifiedBusiness, updateProduct);
router.delete('/:id', requireVerifiedBusiness, deleteProduct);

module.exports = router;
