const express = require('express');
const { getAuditLogs, createAuditLog } = require('../controllers/auditLogController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/', getAuditLogs);
router.post('/', createAuditLog);

module.exports = router;
