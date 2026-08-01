const { verifyAccessToken } = require('../utils/jwt');
const { sendError } = require('../utils/response');
const User = require('../models/User');

/**
 * Protect route — verifies JWT access token
 * Attaches req.user = { id, email, role }
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return sendError(res, 401, 'Authentication required. No token provided.');
        }

        const token = authHeader.split(' ')[1];

        const decoded = verifyAccessToken(token);
        req.user = decoded; // { id, email, role, iat, exp }
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return sendError(res, 401, 'Token expired. Please refresh your session.');
        }
        return sendError(res, 401, 'Invalid token. Please login again.');
    }
};

/**
 * Optional auth — attaches user if token present, but doesn't block guests
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = verifyAccessToken(token);
            req.user = decoded;
        }
    } catch {
        // Ignore token errors for optional auth
    }
    next();
};

/**
 * Authorize by role
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return sendError(res, 401, 'Authentication required.');
        }
        if (!roles.includes(req.user.role)) {
            return sendError(res, 403, 'You do not have permission to perform this action.');
        }
        next();
    };
};

module.exports = { authenticate, optionalAuth, authorize };
