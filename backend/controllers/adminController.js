const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Settings = require('../models/Settings');
const { validateCommissionInput } = require('../utils/commissionCalculator');
const { buildVerificationOverview } = require('../utils/verificationUtils');
const { serializeUserForClient } = require('../utils/userAvatar');

const AUDIT_ACTIONS = {
    USER_MANAGEMENT_VIEW: 'User management actions',
    USER_VERIFICATION: 'User verification',
    APPROVAL: 'Approval',
    REJECTION: 'Rejection',
    SETTINGS_UPDATE: 'Update system settings'
};

// ... existing code ...

// @desc    Get system settings
// @route   GET /api/admin/settings
// @access  Private/Admin
exports.getSettings = async (req, res, next) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({ platformFeePercentage: 3 });
        }
        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error retrieving settings' });
    }
};

// @desc    Update system settings
// @route   PUT /api/admin/settings
// @access  Private/Admin
exports.updateSettings = async (req, res, next) => {
    try {
        const {
            platformFeePercentage,
            commissionEnabled,
            commissionChargedTo,
            platformBankDetails,
            platformMobileMoney
        } = req.body;
        
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings();
        }

        const nextEnabled = commissionEnabled !== undefined ? Boolean(commissionEnabled) : settings.commissionEnabled;
        const nextRate = platformFeePercentage !== undefined ? Number(platformFeePercentage) : settings.platformFeePercentage;

        const validationError = validateCommissionInput({
            commissionEnabled: nextEnabled,
            platformFeePercentage: nextRate
        });
        if (validationError) {
            return res.status(400).json({ success: false, error: validationError });
        }

        if (commissionChargedTo !== undefined && !['manufacturer', 'wholesaler'].includes(commissionChargedTo)) {
            return res.status(400).json({ success: false, error: 'Commission must be charged to manufacturer or wholesaler.' });
        }
        
        if (platformFeePercentage !== undefined) settings.platformFeePercentage = nextRate;
        if (commissionEnabled !== undefined) settings.commissionEnabled = nextEnabled;
        if (commissionChargedTo !== undefined) settings.commissionChargedTo = commissionChargedTo;
        if (platformBankDetails) {
            settings.platformBankDetails = platformBankDetails;
            settings.markModified('platformBankDetails');
        }
        if (platformMobileMoney) {
            settings.platformMobileMoney = platformMobileMoney;
            settings.markModified('platformMobileMoney');
        }
        
        await settings.save();

        await AuditLog.create({
            action: AUDIT_ACTIONS.SETTINGS_UPDATE,
            performedBy: req.user.id,
            targetEntity: 'settings',
            status: 'success'
        });

        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error updating settings' });
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
    try {
        const users = await User.find().select('-password').lean();
        const normalizedUsers = users.map((user) => serializeUserForClient(user));
        try {
            await AuditLog.create({
                action: AUDIT_ACTIONS.USER_MANAGEMENT_VIEW,
                performedBy: req.user.id,
                targetEntity: 'user',
                status: 'success'
            });
        } catch (auditErr) {
            console.error('[AdminController] getUsers audit log failed:', auditErr.message);
        }
        res.status(200).json({ success: true, count: normalizedUsers.length, data: normalizedUsers });
    } catch (error) {
        console.error('[AdminController] getUsers error:', error);
        res.status(500).json({ success: false, error: 'Server error retrieving users' });
    }
};

// @desc    Verification stats + pending queue (single source of truth)
// @route   GET /api/admin/verifications/overview
// @access  Private/Admin
exports.getVerificationOverview = async (req, res, next) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' } }).select('-password').lean();
        const overview = buildVerificationOverview(users);
        res.status(200).json({
            success: true,
            data: overview
        });
    } catch (error) {
        console.error('[AdminController] getVerificationOverview error:', error);
        res.status(500).json({ success: false, error: 'Server error retrieving verification overview' });
    }
};

// @desc    Get pending verifications
// @route   GET /api/admin/verifications/pending
// @access  Private/Admin
exports.getPendingVerifications = async (req, res, next) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' } }).select('-password').lean();
        const { pendingUsers } = buildVerificationOverview(users);
        res.status(200).json({ success: true, count: pendingUsers.length, data: pendingUsers });
    } catch (error) {
        console.error('[AdminController] getPendingVerifications error:', error);
        res.status(500).json({ success: false, error: 'Server error retrieving pending verifications' });
    }
};

// @desc    Update user verification status
// @route   PUT /api/admin/users/:id/verify
// @access  Private/Admin
exports.verifyUser = async (req, res, next) => {
    try {
        const { isVerified, rejectionReason, adminNotes } = req.body;

        if (typeof isVerified !== 'boolean') {
            return res.status(400).json({
                success: false,
                error: 'isVerified must be a boolean value (true or false)',
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const reviewedAt = new Date();
        const update = {
            'businessDetails.isVerified': isVerified,
            verificationStatus: isVerified ? 'approved' : 'rejected',
            verificationReviewedAt: reviewedAt,
        };

        if (!isVerified && rejectionReason) {
            update.verificationRejectionReason = String(rejectionReason).slice(0, 500);
        }
        if (adminNotes !== undefined) {
            update.verificationAdminNotes = String(adminNotes).slice(0, 2000);
        }

        const updateOps = { $set: update };
        if (isVerified) {
            updateOps.$unset = { verificationRejectionReason: '' };
        }

        // Update only verification fields — avoid full-document save() re-validating
        // unrelated profile data (e.g. legacy invalid city/phone) that blocks approval.
        const updatedUser = await User.findByIdAndUpdate(req.params.id, updateOps, {
            new: true,
            runValidators: false,
        }).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        try {
            const { createNotification } = require('./notificationController');
            const dashboardLink =
                updatedUser.role === 'wholesaler' ? '/wholesaler/dashboard' : '/manufacturer/dashboard';
            await createNotification(
                updatedUser._id,
                isVerified
                    ? 'Verification approved — your business credentials have been verified.'
                    : `Verification rejected${rejectionReason ? `: ${rejectionReason}` : ''}. Please review and resubmit.`,
                'alert',
                isVerified ? dashboardLink : '/verify-business'
            );
        } catch (notifyErr) {
            console.error('[AdminController] verification notification failed:', notifyErr.message);
        }

        await AuditLog.create([
            {
                action: AUDIT_ACTIONS.USER_VERIFICATION,
                performedBy: req.user.id,
                targetEntity: `user:${updatedUser._id}`,
                status: 'success'
            },
            {
                action: isVerified ? AUDIT_ACTIONS.APPROVAL : AUDIT_ACTIONS.REJECTION,
                performedBy: req.user.id,
                targetEntity: `user:${updatedUser._id}`,
                status: 'success'
            }
        ]);

        res.status(200).json({ success: true, data: updatedUser });
    } catch (error) {
        console.error('[AdminController] verifyUser error:', error.message, error.stack);
        await AuditLog.create({
            action: AUDIT_ACTIONS.USER_VERIFICATION,
            performedBy: req.user?.id,
            targetEntity: `user:${req.params.id}`,
            status: 'failure'
        }).catch(() => { });
        // Handle invalid MongoDB ObjectId format
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, error: 'Invalid user ID format' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                error: error.message || 'Verification update validation failed',
            });
        }
        res.status(500).json({ success: false, error: 'Server error updating verification status' });
    }
};

// @desc    Save internal admin notes for a verification applicant
// @route   PUT /api/admin/users/:id/verification-notes
// @access  Private/Admin
exports.updateVerificationNotes = async (req, res, next) => {
    try {
        const { adminNotes } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        user.verificationAdminNotes = adminNotes != null ? String(adminNotes).slice(0, 2000) : '';
        await user.save();

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error('[AdminController] updateVerificationNotes error:', error);
        res.status(500).json({ success: false, error: 'Server error saving admin notes' });
    }
};

// @desc    Block user
// @route   PUT /api/admin/users/:id/block
// @access  Private/Admin
exports.blockUser = async (req, res, next) => {
    try {
        const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';
        if (!reason) {
            return res.status(400).json({ success: false, error: 'Suspension reason is required' });
        }
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isBlocked: true, blockReason: reason },
            { new: true, runValidators: false }
        );
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        await AuditLog.create({
            action: 'Block user',
            performedBy: req.user.id,
            targetEntity: `user:${user._id}`,
            status: 'success'
        });

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error('[AdminController] blockUser error:', error);
        res.status(500).json({ success: false, error: 'Server error blocking user' });
    }
};

// @desc    Unblock user
// @route   PUT /api/admin/users/:id/unblock
// @access  Private/Admin
exports.unblockUser = async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isBlocked: false, $unset: { blockReason: '' } },
            { new: true, runValidators: false }
        );
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        await AuditLog.create({
            action: 'Unblock user',
            performedBy: req.user.id,
            targetEntity: `user:${user._id}`,
            status: 'success'
        });

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error('[AdminController] unblockUser error:', error);
        res.status(500).json({ success: false, error: 'Server error unblocking user' });
    }
};

// @desc    Get system logs
// @route   GET /api/admin/logs
// @access  Private/Admin
exports.getSystemLogs = async (req, res, next) => {
    try {
        const logs = await AuditLog.find().sort({ timestamp: -1 }).populate('performedBy', 'name email');
        res.status(200).json({ success: true, count: logs.length, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error retrieving logs' });
    }
};

// @desc    Get system analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
exports.getAnalytics = async (req, res, next) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalOrders = await Order.countDocuments();
        const totalProducts = await Product.countDocuments();

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalOrders,
                totalProducts
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error retrieving analytics' });
    }
};

// @desc    Unified operations summary (single refunded count across modules)
// @route   GET /api/admin/operations/summary
// @access  Private/Admin
exports.getOperationsSummary = async (req, res, next) => {
    try {
        const Order = require('../models/Order');
        const Payout = require('../models/Payout');
        const Escrow = require('../models/Escrow');
        const Dispute = require('../models/Dispute');
        const {
            loadOperationsContext,
            reconcileAllOperations,
            computeUnifiedOperationsStats,
            PAYMENT_STATUS,
            PAYOUT_STATUS,
            isPaymentReviewRecord,
            reconcileOrderPaymentStatus,
        } = require('../utils/operationStatus');

        const ctx = await loadOperationsContext();
        const [orders, payouts, escrows, disputes] = await Promise.all([
            Order.find().lean(),
            Payout.find().populate('order', 'status paymentStatus isPaymentVerified sellerStats').lean(),
            Escrow.find().lean(),
            Dispute.find().select('status order seller').lean(),
        ]);

        await reconcileAllOperations(orders, payouts, ctx);

        const operationsSummary = computeUnifiedOperationsStats(orders, payouts, escrows, disputes, ctx);

        const enrichedOrders = await Promise.all(
            orders.map((o) => reconcileOrderPaymentStatus(o, ctx))
        );

        const reviewOrders = enrichedOrders.filter((o) => isPaymentReviewRecord(o, ctx));

        res.status(200).json({
            success: true,
            data: {
                ...operationsSummary,
                payments: {
                    total: reviewOrders.length,
                    pending: reviewOrders.filter((o) => o.resolvedPaymentStatus === PAYMENT_STATUS.PENDING_VERIFICATION).length,
                    verified: reviewOrders.filter((o) => o.resolvedPaymentStatus === PAYMENT_STATUS.VERIFIED).length,
                    rejected: reviewOrders.filter((o) => o.resolvedPaymentStatus === PAYMENT_STATUS.REJECTED).length,
                    refunded: operationsSummary.refundedOrders,
                },
                payouts: {
                    total: payouts.length,
                    holding: payouts.filter((p) => {
                        const oid = String(p.order?._id || p.order);
                        return !operationsSummary.refundedOrderIds.includes(oid)
                            && !['Approved', 'Paid'].includes(String(p.status));
                    }).length,
                    approved: payouts.filter((p) => ['Approved', 'Paid'].includes(String(p.status))).length,
                    refunded: operationsSummary.refundedOrders,
                },
                escrow: {
                    total: escrows.length,
                    refunded: operationsSummary.refundedOrders,
                },
            },
        });
    } catch (error) {
        console.error('[AdminController] getOperationsSummary error:', error);
        res.status(500).json({ success: false, error: 'Server error retrieving operations summary' });
    }
};

// @desc    Get all manual seller payouts
// @route   GET /api/admin/payouts
// @access  Private/Admin
exports.getPayouts = async (req, res, next) => {
    try {
        const Order = require('../models/Order');
        const Payout = require('../models/Payout');
        const Escrow = require('../models/Escrow');
        const Dispute = require('../models/Dispute');
        const {
            loadOperationsContext,
            reconcileAllOperations,
            reconcilePayoutRecord,
            getPayoutDisplayAmounts,
            computeUnifiedOperationsStats,
            buildRefundedOrderIds,
            PAYOUT_STATUS,
        } = require('../utils/operationStatus');

        const ctx = await loadOperationsContext();
        const orders = await Order.find().lean();
        await reconcileAllOperations(orders, [], ctx);

        const payouts = await Payout.find()
            .populate('seller', 'name email businessDetails paymentDetails')
            .populate('order', 'status paymentStatus isPaymentVerified createdAt _id transactionReference paymentMethod sellerStats')
            .sort({ createdAt: -1 })
            .lean();

        const refundedOrderIds = buildRefundedOrderIds(orders, ctx);

        const enriched = await Promise.all(
            payouts.map(async (p) => {
                const orderId = String(p.order?._id || p.order || '');
                const forceRefunded = refundedOrderIds.has(orderId);
                const reconciled = await reconcilePayoutRecord(p, ctx);
                if (forceRefunded) {
                    reconciled.resolvedPayoutStatus = PAYOUT_STATUS.REFUNDED;
                    reconciled.payoutStatusLabel = 'Refunded';
                    reconciled.displayAmounts = { gross: 0, commission: 0, net: 0 };
                }
                return {
                    ...reconciled,
                    resolvedPayoutStatus: reconciled.resolvedPayoutStatus,
                    payoutStatusLabel: reconciled.payoutStatusLabel,
                    displayAmounts: reconciled.displayAmounts
                        || getPayoutDisplayAmounts(reconciled, reconciled.resolvedPayoutStatus, ctx),
                };
            })
        );

        const [escrows, disputes] = await Promise.all([
            Escrow.find().lean(),
            Dispute.find().select('status order').lean(),
        ]);
        const operationsSummary = computeUnifiedOperationsStats(orders, payouts, escrows, disputes, ctx);

        const stats = {
            holding: enriched.filter((p) => p.resolvedPayoutStatus === PAYOUT_STATUS.HOLDING).length,
            approved: enriched.filter((p) => p.resolvedPayoutStatus === PAYOUT_STATUS.APPROVED).length,
            refunded: operationsSummary.refundedOrders,
            total: enriched.length,
        };

        res.status(200).json({ success: true, count: enriched.length, stats, operationsSummary, data: enriched });
    } catch (error) {
        console.error('[AdminController] getPayouts error:', error);
        res.status(500).json({ success: false, error: 'Server error retrieving payouts' });
    }
};

// @desc    Mark payout as paid
// @route   PUT /api/admin/payouts/:id/pay
// @access  Private/Admin
exports.markPayoutAsPaid = async (req, res, next) => {
    try {
        const Payout = require('../models/Payout');
        const AuditLog = require('../models/AuditLog');
        
        const payout = await Payout.findById(req.params.id);
        if (!payout) {
            return res.status(404).json({ success: false, error: 'Payout not found' });
        }
        
        if (payout.status === 'Paid') {
            return res.status(400).json({ success: false, error: 'Payout is already marked as paid' });
        }

        payout.status = 'Paid';
        payout.paymentDate = Date.now();
        payout.notes = req.body.notes || payout.notes;
        await payout.save();

        await AuditLog.create({
            action: 'Mark payout as Paid',
            performedBy: req.user.id,
            targetEntity: `payout:${payout._id}`,
            status: 'success'
        });

        res.status(200).json({ success: true, data: payout });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error marking payout as paid' });
    }
};

// @desc    Get all contact messages
// @route   GET /api/admin/contact-messages
// @access  Private/Admin
exports.getContactMessages = async (req, res, next) => {
    try {
        const ContactSubmission = require('../models/ContactSubmission');
        const { formatTicketId } = require('../controllers/contactController');
        const messages = await ContactSubmission.find().sort({ createdAt: -1 });
        const data = messages.map((message) => ({
            ...message.toObject(),
            ticketId: formatTicketId(message._id),
        }));
        res.status(200).json({ success: true, count: data.length, data });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error retrieving contact messages' });
    }
};

exports.getContactMessageById = async (req, res) => {
    try {
        const ContactSubmission = require('../models/ContactSubmission');
        const { formatTicketId } = require('../controllers/contactController');
        const message = await ContactSubmission.findById(req.params.id);
        if (!message) {
            return res.status(404).json({ success: false, error: 'Contact message not found' });
        }
        res.status(200).json({
            success: true,
            data: {
                ...message.toObject(),
                ticketId: formatTicketId(message._id),
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error retrieving contact message' });
    }
};

exports.updateContactMessageStatus = async (req, res) => {
    try {
        const ContactSubmission = require('../models/ContactSubmission');
        const { status } = req.body;
        const allowed = ['open', 'in_progress', 'replied', 'closed'];
        if (!allowed.includes(status)) {
            return res.status(400).json({ success: false, error: 'Invalid support ticket status' });
        }

        const submission = await ContactSubmission.findById(req.params.id);
        if (!submission) {
            return res.status(404).json({ success: false, error: 'Contact message not found' });
        }

        submission.status = status;
        if (status === 'replied') {
            submission.isReplied = true;
        }
        await submission.save();

        res.status(200).json({ success: true, data: submission });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update support ticket status' });
    }
};

exports.closeContactMessage = async (req, res) => {
    try {
        const ContactSubmission = require('../models/ContactSubmission');
        const submission = await ContactSubmission.findById(req.params.id);
        if (!submission) {
            return res.status(404).json({ success: false, error: 'Contact message not found' });
        }

        submission.status = 'closed';
        await submission.save();

        res.status(200).json({ success: true, data: submission });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to close support ticket' });
    }
};

exports.replyContactMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { replyMessage } = req.body;
        const { sanitizeText, formatTicketId } = require('../controllers/contactController');
        const sanitizedReply = sanitizeText(replyMessage, 5000);

        if (!sanitizedReply) {
            return res.status(400).json({ success: false, error: 'Reply message cannot be empty' });
        }

        const ContactSubmission = require('../models/ContactSubmission');
        const User = require('../models/User');
        const sendEmail = require('../utils/sendEmail');
        const { createNotification } = require('./notificationController');

        const submission = await ContactSubmission.findById(id);
        if (!submission) {
            return res.status(404).json({ success: false, error: 'Contact message not found' });
        }
        if (submission.status === 'closed') {
            return res.status(400).json({ success: false, error: 'This support ticket is closed' });
        }

        const adminName = req.user?.name || 'GearUp Support Team';
        submission.replies.push({
            message: sanitizedReply,
            adminName,
            admin: req.user.id,
            createdAt: new Date(),
        });
        submission.status = 'replied';
        submission.isReplied = true;
        await submission.save();

        const isSuspensionAppeal = submission.category === 'Suspension Appeal';
        const emailSubject = isSuspensionAppeal
            ? 'GearUp Support – Suspension Appeal Update'
            : 'GearUp Support – Reply to Your Request';

        const emailHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #334155;">
                <h2 style="color: #0F172A;">GearUp Support</h2>
                <p>Hello ${submission.name},</p>
                <p>Thank you for contacting GearUp Support.</p>
                <p>We have reviewed your support request.</p>
                <p style="font-size: 14px; font-weight: 700; color: #0F172A; margin-bottom: 8px;">Support Reply</p>
                <div style="background-color: #F8FAFC; padding: 16px; border-left: 4px solid #00A878; margin: 20px 0;">
                    <p style="margin: 0; white-space: pre-wrap;">${sanitizedReply}</p>
                </div>
                <p>If further action is required, you may reply to this email or submit another support request.</p>
                <p style="margin-top: 24px;">Regards,<br/>GearUp Support Team</p>
                <hr style="border: 0; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
                <p style="font-size: 12px; color: #94A3B8;">Ticket ${formatTicketId(submission._id)} &copy; ${new Date().getFullYear()}</p>
            </div>
        `;

        let emailSent = true;
        try {
            await sendEmail({
                email: submission.email,
                subject: emailSubject,
                html: emailHtml,
            });
        } catch (emailError) {
            emailSent = false;
            console.error('[Support Reply] Email failed:', emailError.message);
        }

        if (submission.user) {
            try {
                const ticketUser = await User.findById(submission.user).select('role');
                const supportLink =
                    ticketUser?.role === 'wholesaler' ? '/wholesaler/support' : '/manufacturer/support';
                await createNotification(
                    submission.user,
                    'Support replied to your request.',
                    'system',
                    supportLink
                );
            } catch (notifyError) {
                console.error('[Support Reply] Notification failed:', notifyError.message);
            }
        }

        res.json({
            success: true,
            message: emailSent
                ? 'Reply sent successfully'
                : 'Reply saved successfully. Email could not be sent.',
            emailSent,
            data: {
                ...submission.toObject(),
                ticketId: formatTicketId(submission._id),
            },
        });
    } catch (error) {
        console.error('Error replying to contact message:', error);
        res.status(500).json({ success: false, error: 'Failed to save reply' });
    }
};
