const rateLimit = require('express-rate-limit');

/**
 * Throttles login/register attempts per IP to slow down credential stuffing
 * and brute-force attacks against account credentials.
 */
const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many attempts. Please try again later.',
    },
});

/**
 * Throttles file uploads per IP. Multer already buffers each upload fully into
 * memory (memoryStorage), so without this an attacker can exhaust process
 * memory by firing many concurrent/rapid large uploads — anonymous guest
 * uploads make this reachable with no account required.
 */
const uploadRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many uploads from this address. Please try again later.',
    },
});

module.exports = { authRateLimiter, uploadRateLimiter };
