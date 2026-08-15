const bcrypt = require('bcrypt');
const FailedAttempt = require('../models/FailedAttempt');

const SALT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;

/**
 * Hash a password using bcrypt.
 * @param {string} password - Plaintext password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
    return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare a plaintext password against a bcrypt hash.
 * @param {string} password - Plaintext password
 * @param {string} hash - Bcrypt hash
 * @returns {Promise<boolean>} Whether the password matches
 */
const comparePassword = async (password, hash) => {
    return bcrypt.compare(password, hash);
};

/**
 * Build a rate-limit identifier from a share/file ID and requester info.
 * @param {string} resourceId - Share code or file ID
 * @param {string} requesterId - User ID or IP address
 * @returns {string} Identifier string
 */
const buildRateLimitKey = (resourceId, requesterId) => {
    return `${resourceId}:${requesterId}`;
};

/**
 * Check if the requester has exceeded the max failed password attempts.
 * @param {string} resourceId - Share code or file ID
 * @param {string} requesterId - User ID or IP address
 * @returns {Promise<{ blocked: boolean, attempts: number, remaining: number }>}
 */
const checkRateLimit = async (resourceId, requesterId) => {
    const key = buildRateLimitKey(resourceId, requesterId);
    const attempts = await FailedAttempt.getAttemptCount(key);
    return {
        blocked: attempts >= MAX_FAILED_ATTEMPTS,
        attempts,
        remaining: Math.max(0, MAX_FAILED_ATTEMPTS - attempts),
    };
};

/**
 * Record a failed password attempt.
 * @param {string} resourceId - Share code or file ID
 * @param {string} requesterId - User ID or IP address
 * @returns {Promise<number>} Updated attempt count
 */
const recordFailedAttempt = async (resourceId, requesterId) => {
    const key = buildRateLimitKey(resourceId, requesterId);
    return FailedAttempt.recordFailure(key);
};

/**
 * Clear failed attempts after successful password entry.
 * @param {string} resourceId - Share code or file ID
 * @param {string} requesterId - User ID or IP address
 */
const clearFailedAttempts = async (resourceId, requesterId) => {
    const key = buildRateLimitKey(resourceId, requesterId);
    return FailedAttempt.clearAttempts(key);
};

module.exports = {
    hashPassword,
    comparePassword,
    checkRateLimit,
    recordFailedAttempt,
    clearFailedAttempts,
    MAX_FAILED_ATTEMPTS,
};
