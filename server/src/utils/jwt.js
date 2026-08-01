const jwt = require('jsonwebtoken');

const {
    JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET,
    JWT_ACCESS_EXPIRES = '15m',
    JWT_REFRESH_EXPIRES = '7d',
} = process.env;

/**
 * Generate JWT access token
 * @param {object} payload - { id, email, role }
 */
const generateAccessToken = (payload) => {
    return jwt.sign(payload, JWT_ACCESS_SECRET, {
        expiresIn: JWT_ACCESS_EXPIRES.trim(),
    });
};

/**
 * Generate JWT refresh token
 * @param {object} payload - { id }
 */
const generateRefreshToken = (payload) => {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRES.trim(),
    });
};

/**
 * Verify access token
 * @param {string} token
 */
const verifyAccessToken = (token) => {
    return jwt.verify(token, JWT_ACCESS_SECRET);
};

/**
 * Verify refresh token
 * @param {string} token
 */
const verifyRefreshToken = (token) => {
    return jwt.verify(token, JWT_REFRESH_SECRET);
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
};
