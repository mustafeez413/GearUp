const Notification = require('../models/Notification');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
    try {
        const notifications = await Notification.find({ recipient: req.user.id })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: notifications.length,
            data: notifications
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error retrieving notifications' });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res, next) => {
    try {
        let notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ success: false, error: 'Notification not found' });
        }

        // Make sure user owns notification
        if (notification.recipient.toString() !== req.user.id) {
            return res.status(401).json({ success: false, error: 'Not authorized to update this notification' });
        }

        notification.isRead = true;
        await notification.save();

        res.status(200).json({ success: true, data: notification });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error updating notification' });
    }
};

// @desc    Create a notification (Internal use mainly)
exports.createNotification = async (recipientId, message, type = 'alert', link = '') => {
    try {
        await Notification.create({
            recipient: recipientId,
            message,
            type,
            link
        });
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};
