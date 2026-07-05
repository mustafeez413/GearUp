const express = require('express');
const { openChat, listChats, getChat, postMessage, getUnreadChatCount, markMessagesAsRead } = require('../controllers/chatController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('manufacturer', 'wholesaler'));

router.post('/open', openChat);
router.get('/', listChats);
router.get('/unread-count', getUnreadChatCount);
router.get('/:id', getChat);
router.post('/:id/messages', postMessage);
router.put('/:id/mark-read', markMessagesAsRead);

module.exports = router;
