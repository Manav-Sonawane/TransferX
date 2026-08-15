const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET;
const DEFAULT_DURATION_SECONDS = 900; // 15 minutes

/**
 * Generate a short-lived access token for file downloads.
 * This token is issued after successful password validation
 * and is required to download password-protected files.
 *
 * @param {string} fileId - The file/share ID being accessed
 * @param {string} userId - The user ID (or IP for guests)
 * @param {number} durationSeconds - Token lifetime in seconds (default: 900 = 15 min)
 * @returns {{ token: string, expiresAt: Date }}
 */
const generateAccessToken = (fileId, userId, durationSeconds = DEFAULT_DURATION_SECONDS) => {
    const expiresAt = new Date(Date.now() + durationSeconds * 1000);

    const token = jwt.sign(
        {
            fileId,
            userId,
            purpose: 'download-access',
            timestamp: Date.now(),
        },
        ACCESS_TOKEN_SECRET,
        { expiresIn: `${durationSeconds}s` }
    );

    return { token, expiresAt };
};

/**
 * Verify an access token and ensure it matches the expected file and user.
 *
 * @param {string} token - The access token to verify
 * @param {string} fileId - Expected file ID
 * @param {string} userId - Expected user ID
 * @returns {{ valid: boolean, error?: string }}
 */
const verifyAccessToken = (token, fileId, userId) => {
    try {
        if (!token) {
            return { valid: false, error: 'No access token provided' };
        }

        const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);

        if (decoded.purpose !== 'download-access') {
            return { valid: false, error: 'Invalid token purpose' };
        }

        if (decoded.fileId !== fileId) {
            return { valid: false, error: 'Token does not match this file' };
        }

        if (decoded.userId !== userId) {
            return { valid: false, error: 'Token does not match this user' };
        }

        return { valid: true };
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return { valid: false, error: 'Access token expired. Please validate password again.' };
        }
        return { valid: false, error: 'Invalid access token' };
    }
};

module.exports = {
    generateAccessToken,
    verifyAccessToken,
};
