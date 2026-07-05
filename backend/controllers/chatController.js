const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');
const ProductChat = require('../models/ProductChat');
const Notification = require('../models/Notification');
const { productOwnerIdString, userIdString } = require('../utils/manufacturerProductAccess');

function participantIds(thread, uid) {
    const b = (thread.buyerId._id ?? thread.buyerId).toString();
    const s = (thread.sellerId._id ?? thread.sellerId).toString();
    return { isParticipant: b === uid || s === uid };
}

/**
 * POST /api/chats/open  { productId }
 * Manufacturer only. Opens or returns existing thread for this product + buyer.
 */
exports.openChat = async (req, res) => {
    try {
        const { productId } = req.body;
        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ success: false, error: 'Valid productId is required' });
        }

        const buyerId = userIdString(req.user);
        if (!buyerId) {
            return res.status(401).json({ success: false, error: 'Not authorized' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        const ownerId = productOwnerIdString(product);
        if (!ownerId) {
            return res.status(400).json({ success: false, error: 'Product has no owner' });
        }

        if (ownerId === buyerId) {
            return res.status(403).json({
                success: false,
                error: 'You cannot start a chat about your own product',
                code: 'CHAT_OWN_PRODUCT'
            });
        }

        const seller = await User.findById(ownerId).select('role');
        if (!seller || seller.role !== 'manufacturer') {
            return res.status(403).json({
                success: false,
                error: 'Chat is only available with manufacturer sellers',
                code: 'CHAT_SELLER_NOT_MANUFACTURER'
            });
        }

        let thread = await ProductChat.findOne({ product: productId, buyerId: req.user._id });
        if (!thread) {
            thread = await ProductChat.create({
                product: productId,
                sellerId: ownerId,
                buyerId: req.user._id,
                messages: []
            });
        }

        thread = await ProductChat.findById(thread._id)
            .populate('product', 'name images')
            .populate('sellerId', 'name businessDetails')
            .populate('buyerId', 'name businessDetails');

        res.status(200).json({ success: true, data: thread });
    } catch (error) {
        if (error.code === 11000) {
            const existing = await ProductChat.findOne({
                product: req.body.productId,
                buyerId: req.user._id
            })
                .populate('product', 'name images')
                .populate('sellerId', 'name businessDetails')
                .populate('buyerId', 'name businessDetails');
            if (existing) {
                return res.status(200).json({ success: true, data: existing });
            }
        }
        res.status(400).json({ success: false, error: error.message });
    }
};

/**
 * GET /api/chats — threads where user is buyer or seller (manufacturer only).
 */
exports.listChats = async (req, res) => {
    try {
        const threads = await ProductChat.find({
            $or: [{ buyerId: req.user._id }, { sellerId: req.user._id }]
        })
            .sort({ updatedAt: -1 })
            .populate('product', 'name images price')
            .populate('sellerId', 'name businessDetails')
            .populate('buyerId', 'name businessDetails')
            .populate('messages.senderId', 'name');

        res.status(200).json({ success: true, count: threads.length, data: threads });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

/**
 * GET /api/chats/:id
 */
exports.getChat = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, error: 'Invalid chat id' });
        }

        const uid = userIdString(req.user);
        const thread = await ProductChat.findById(req.params.id)
            .populate('product', 'name images description manufacturer')
            .populate('sellerId', 'name businessDetails role')
            .populate('buyerId', 'name businessDetails role')
            .populate('messages.senderId', 'name');

        if (!thread) {
            return res.status(404).json({ success: false, error: 'Chat not found' });
        }

        const { isParticipant } = participantIds(thread, uid);
        if (!isParticipant) {
            return res.status(403).json({ success: false, error: 'Not authorized to view this chat' });
        }

        res.status(200).json({ success: true, data: thread });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

/**
 * GET /api/chats/unread-count — count unread messages for user
 */
exports.getUnreadChatCount = async (req, res) => {
    try {
        const uid = userIdString(req.user);
        const threads = await ProductChat.find({
            $or: [{ buyerId: uid }, { sellerId: uid }]
        }).populate('messages.senderId', 'name');

        let unreadCount = 0;
        threads.forEach(thread => {
            const isBuyer = thread.buyerId.toString() === uid;
            const messages = thread.messages || [];
            
            // Count messages from the other party that haven't been read
            messages.forEach(message => {
                const isFromOtherParty = message.senderId._id.toString() !== uid;
                if (isFromOtherParty && !message.isRead) {
                    unreadCount++;
                }
            });
        });

        res.status(200).json({ success: true, count: unreadCount });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

/**
 * POST /api/chats/:id/messages — send message in chat
 */
exports.postMessage = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, error: 'Invalid chat id' });
        }

        const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
        if (!text) {
            return res.status(400).json({ success: false, error: 'Message text is required' });
        }

        const uid = userIdString(req.user);
        const thread = await ProductChat.findById(req.params.id);

        if (!thread) {
            return res.status(404).json({ success: false, error: 'Chat not found' });
        }

        const buyerStr = thread.buyerId.toString();
        const sellerStr = thread.sellerId.toString();

        if (uid !== buyerStr && uid !== sellerStr) {
            return res.status(403).json({ success: false, error: 'Not authorized to post in this chat' });
        }

        const receiverId = uid === buyerStr ? sellerStr : buyerStr;
        if (receiverId === uid) {
            return res.status(403).json({ success: false, error: 'Invalid recipient' });
        }

        thread.messages.push({
            senderId: req.user._id,
            text
        });
        await thread.save();

        // Create notification for receiver
        const senderName = req.user.name || 'User';
        const productName = (await Product.findById(thread.product).select('name')).name || 'Product';
        const notificationMessage = `New message from ${senderName} about ${productName}`;
        
        const notificationLink = receiverId === sellerStr ? `/manufacturer/chats/${thread._id}` : `/wholesaler/chats/${thread._id}`;

        await Notification.create({
            recipient: receiverId,
            message: notificationMessage,
            type: 'message',
            link: notificationLink
        });

        const updated = await ProductChat.findById(thread._id)
            .populate('product', 'name images')
            .populate('sellerId', 'name businessDetails')
            .populate('buyerId', 'name businessDetails')
            .populate('messages.senderId', 'name');

        res.status(201).json({ success: true, data: updated });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

/**
 * PUT /api/chats/:id/mark-read — mark unread messages from other party as read
 */
exports.markMessagesAsRead = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, error: 'Invalid chat id' });
        }

        const uid = userIdString(req.user);
        const thread = await ProductChat.findById(req.params.id);

        if (!thread) {
            return res.status(404).json({ success: false, error: 'Chat not found' });
        }

        const buyerStr = thread.buyerId.toString();
        const sellerStr = thread.sellerId.toString();

        if (uid !== buyerStr && uid !== sellerStr) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        let isModified = false;
        thread.messages.forEach(message => {
            if (message.senderId.toString() !== uid && !message.isRead) {
                message.isRead = true;
                isModified = true;
            }
        });

        if (isModified) {
            await thread.save();
        }

        res.status(200).json({ success: true, message: 'Messages marked as read' });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
