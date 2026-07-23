const ContactSubmission = require('../models/ContactSubmission');
const User = require('../models/User');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SUBJECT_BY_TYPE = {
    general: 'General Inquiry',
    verification: 'Account Verification / Support',
    sales: 'Sales & Partnership',
    support: 'Technical Support / Bug Report',
    advertising: 'Advertising & Sponsorships',
    other: 'Other',
    demo: 'Demo Request',
};

function sanitizeText(value, maxLength = 5000) {
    if (typeof value !== 'string') return '';
    return value.replace(/<[^>]*>/g, '').trim().slice(0, maxLength);
}

function formatTicketId(id) {
    if (!id) return '—';
    return `SUP-${String(id).slice(-6).toUpperCase()}`;
}

function isTicketOwner(ticket, user) {
    if (!ticket || !user) return false;
    if (ticket.user && ticket.user.toString() === user.id) return true;
    if (!ticket.user && ticket.email === String(user.email || '').trim().toLowerCase()) return true;
    return false;
}

exports.submitContact = async (req, res) => {
    try {
        let { name, email, company, message, type } = req.body;

        if (req.user) {
            name = req.user.name;
            email = req.user.email;
            const profileCompany = req.user.businessDetails?.businessName;
            if (profileCompany && String(profileCompany).trim()) {
                company = String(profileCompany).trim();
            }
        }

        name = sanitizeText(name, 120);
        email = sanitizeText(email, 160).toLowerCase();
        company = sanitizeText(company, 120);
        message = sanitizeText(message, 5000);

        if (!name) {
            return res.status(400).json({ success: false, error: 'Name is required' });
        }
        if (!email) {
            return res.status(400).json({ success: false, error: 'Email is required' });
        }
        if (!EMAIL_RE.test(email)) {
            return res.status(400).json({ success: false, error: 'Please provide a valid email address' });
        }
        if (!message) {
            return res.status(400).json({ success: false, error: 'Message is required' });
        }

        const allowedTypes = ['general', 'verification', 'sales', 'support', 'advertising', 'other', 'demo'];
        const inquiryType = allowedTypes.includes(type) ? type : 'general';
        const category = req.user?.isBlocked ? 'Suspension Appeal' : '';

        const submission = await ContactSubmission.create({
            user: req.user?._id || null,
            name,
            email,
            company,
            subject: SUBJECT_BY_TYPE[inquiryType] || 'General Inquiry',
            message,
            type: inquiryType,
            category,
            status: 'open',
        });

        res.status(201).json({
            success: true,
            message: 'Thank you. Your message has been received. We will respond within one business day.',
            data: {
                id: submission._id,
                ticketId: formatTicketId(submission._id),
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message || 'Could not save your message' });
    }
};

exports.getMySupportRequests = async (req, res) => {
    try {
        const email = String(req.user.email || '').trim().toLowerCase();
        const tickets = await ContactSubmission.find({
            $or: [{ user: req.user.id }, { user: null, email }],
        })
            .sort({ createdAt: -1 })
            .select('-replies.admin');

        const data = tickets.map((ticket) => ({
            ...ticket.toObject(),
            ticketId: formatTicketId(ticket._id),
            latestReply: ticket.replies?.length
                ? ticket.replies[ticket.replies.length - 1]
                : null,
        }));

        res.status(200).json({ success: true, count: data.length, data });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error retrieving support requests' });
    }
};

exports.getMySupportRequestById = async (req, res) => {
    try {
        const ticket = await ContactSubmission.findById(req.params.id).select('-replies.admin');
        if (!ticket) {
            return res.status(404).json({ success: false, error: 'Support request not found' });
        }
        if (!isTicketOwner(ticket, req.user)) {
            return res.status(403).json({ success: false, error: 'Not authorized to view this support request' });
        }

        res.status(200).json({
            success: true,
            data: {
                ...ticket.toObject(),
                ticketId: formatTicketId(ticket._id),
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error retrieving support request' });
    }
};

exports.formatTicketId = formatTicketId;
exports.sanitizeText = sanitizeText;

// @desc    User replies to their own support request
// @route   POST /api/contact/mine/:id/reply
// @access  Private
exports.replyToSupportRequest = async (req, res) => {
    try {
        const message = sanitizeText(req.body.message || '', 5000);
        if (!message) {
            return res.status(400).json({ success: false, error: 'Reply message cannot be empty' });
        }

        const submission = await ContactSubmission.findById(req.params.id);
        if (!submission) {
            return res.status(404).json({ success: false, error: 'Support request not found' });
        }
        if (!isTicketOwner(submission, req.user)) {
            return res.status(403).json({ success: false, error: 'Not authorized to reply to this request' });
        }
        if (['resolved', 'closed'].includes(submission.status)) {
            return res.status(400).json({ success: false, error: 'This support request is no longer accepting replies' });
        }

        // Append user reply — reuse adminName field to store the sender display name
        submission.replies.push({
            message,
            sender: 'user',
            adminName: req.user.name || 'User',
            createdAt: new Date(),
        });

        // If admin had set status to waiting_for_user, move it back to open
        if (submission.status === 'waiting_for_user') {
            submission.status = 'open';
        }

        submission.updatedAt = new Date();
        await submission.save();

        // Notify all admin users
        try {
            const { createNotification } = require('./notificationController');
            const admins = await User.find({ role: 'admin' }).select('_id').lean();
            const requestId = formatTicketId(submission._id);
            for (const admin of admins) {
                await createNotification(
                    admin._id,
                    `New reply from ${req.user.name} on support request ${requestId}.`,
                    'system',
                    '/admin/support'
                );
            }
        } catch (notifyError) {
            console.error('[User Reply] Admin notification failed:', notifyError.message);
        }

        res.json({
            success: true,
            message: 'Reply sent successfully',
            data: {
                ...submission.toObject(),
                ticketId: formatTicketId(submission._id),
            },
        });
    } catch (error) {
        console.error('Error replying to support request:', error);
        res.status(500).json({ success: false, error: 'Failed to send reply' });
    }
};
