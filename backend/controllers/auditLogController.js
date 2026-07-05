const AuditLog = require('../models/AuditLog');

// GET /api/audit-logs
exports.getAuditLogs = async (req, res) => {
    try {
        const { action, status, date } = req.query;
        const query = {};

        if (action) query.action = { $regex: action, $options: 'i' };
        if (status) query.status = status;
        if (date) {
            const start = new Date(date);
            if (!Number.isNaN(start.getTime())) {
                const end = new Date(start);
                end.setDate(end.getDate() + 1);
                query.timestamp = { $gte: start, $lt: end };
            }
        }

        const logs = await AuditLog.find(query)
            .sort({ timestamp: -1 })
            .populate('performedBy', 'name email role');

        res.status(200).json({ success: true, count: logs.length, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error retrieving audit logs' });
    }
};

// POST /api/audit-logs
exports.createAuditLog = async (req, res) => {
    try {
        const { action, targetEntity, status } = req.body;
        if (!action || !targetEntity || !status) {
            return res.status(400).json({ success: false, error: 'action, targetEntity and status are required' });
        }

        const log = await AuditLog.create({
            action,
            targetEntity,
            status,
            performedBy: req.user.id
        });

        res.status(201).json({ success: true, data: log });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error creating audit log' });
    }
};
