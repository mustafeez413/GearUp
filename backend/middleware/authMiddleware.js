const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Optionally attach req.user when a valid Bearer token is present.
 * Never fails; req.user is null for guests or invalid tokens.
 * Used for marketplace product reads where rules depend on the caller.
 */
exports.optionalAuth = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
        token = req.query.token;
    }
    req.user = null;
    if (!token) {
        return next();
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user) {
            req.user = user;
        }
    } catch {
        // Treat as anonymous for public listing behavior
    }
    next();
};

// Protect routes
exports.protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        // Set token from Bearer token in header
        token = req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
        token = req.query.token;
    }
    // else if (req.cookies.token) {
    //   token = req.cookies.token;
    // }

    // Make sure token exists and is not a corrupted placeholder
    if (!token || token === 'null' || token === 'undefined') {
        return res.status(401).json({ success: false, error: 'Not authorized to access this route (token missing)' });
    }

    token = token.trim();

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);

        if (!req.user) {
            return res.status(401).json({ success: false, error: `Not authorized to access this route (user not found with ID ${decoded.id})` });
        }

        if (req.user.isBlocked) {
            const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
            if (mutatingMethods.includes(req.method)) {
                const requestPath = (req.originalUrl || '').split('?')[0];
                const readOnlyAllowedPaths = ['/api/contact'];
                const isAllowed = readOnlyAllowedPaths.some(
                    (allowedPath) => requestPath === allowedPath || requestPath.startsWith(`${allowedPath}/`)
                );

                if (!isAllowed) {
                    const reasonText = req.user.blockReason ? ` Reason: ${req.user.blockReason}` : '';
                    return res.status(403).json({
                        success: false,
                        error: 'READ_ONLY_MODE',
                        message: `Your account is suspended and in read-only mode.${reasonText} You cannot perform this action until your account is reactivated.`,
                        blockReason: req.user.blockReason || ''
                    });
                }
            }
        }

        next();
    } catch (err) {
        return res.status(401).json({ success: false, error: `Not authorized to access this route (token verification failed: ${err.message})` });
    }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: `User role ${req.user?.role || 'undefined'} is not authorized to access this route (requires: ${roles.join(', ')})`
            });
        }
        next();
    };
};
