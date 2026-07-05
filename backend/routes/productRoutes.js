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
const { protect, authorize, optionalAuth } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/', optionalAuth, getProducts);
router.get('/categories', optionalAuth, getProductCategories);
router.get('/:id', optionalAuth, getProduct);

// Protected routes
router.use(protect);

router.get('/analytics/inventory', authorize('manufacturer', 'wholesaler'), getInventoryAnalytics);

router.use(authorize('manufacturer', 'wholesaler', 'admin'));

router.post('/', createProduct);
router.post('/upload-image', upload.single('image'), uploadImage);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
