const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const {
    ConflictError,
    UnauthorizedError,
    NotFoundError,
} = require('../utils/errors');

// ─── Cookie Options ───────────────────────────
const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
};

/**
 * Register a new user
 */
const register = async ({ name, email, password }) => {
    // Check for existing email
    const existing = await User.findOne({ email });
    if (existing) {
        throw new ConflictError('An account with this email already exists');
    }

    const user = await User.create({ name, email, password });

    const accessToken = generateAccessToken({
        id: user._id,
        email: user.email,
        role: user.role,
    });

    const refreshToken = generateRefreshToken({ id: user._id });

    // Store refresh token
    user.refreshTokens.push(refreshToken);
    await user.save({ validateBeforeSave: false });

    return { user: user.toPublicJSON(), accessToken, refreshToken };
};

/**
 * Login an existing user
 */
const login = async ({ email, password }) => {
    // Include password in query (normally excluded)
    const user = await User.findOne({ email }).select('+password +refreshTokens');

    if (!user) {
        throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
        throw new UnauthorizedError('Your account has been deactivated');
    }

    const accessToken = generateAccessToken({
        id: user._id,
        email: user.email,
        role: user.role,
    });

    const refreshToken = generateRefreshToken({ id: user._id });

    // Rotate: add new refresh token (keep max 5 sessions)
    user.refreshTokens.push(refreshToken);
    if (user.refreshTokens.length > 5) {
        user.refreshTokens = user.refreshTokens.slice(-5);
    }
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    return { user: user.toPublicJSON(), accessToken, refreshToken };
};

/**
 * Logout — invalidate refresh token
 */
const logout = async (userId, refreshToken) => {
    const user = await User.findById(userId).select('+refreshTokens');
    if (!user) return;

    user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
    await user.save({ validateBeforeSave: false });
};

/**
 * Refresh access token using refresh token
 */
const refreshAccessToken = async (refreshToken) => {
    if (!refreshToken) {
        throw new UnauthorizedError('Refresh token not provided');
    }

    let decoded;
    try {
        decoded = verifyRefreshToken(refreshToken);
    } catch {
        throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await User.findById(decoded.id).select('+refreshTokens');
    if (!user) {
        throw new UnauthorizedError('User not found');
    }

    // Check refresh token is in the stored list
    if (!user.refreshTokens.includes(refreshToken)) {
        // Token reuse detected — invalidate all sessions
        user.refreshTokens = [];
        await user.save({ validateBeforeSave: false });
        throw new UnauthorizedError('Session invalid. Please login again.');
    }

    const newAccessToken = generateAccessToken({
        id: user._id,
        email: user.email,
        role: user.role,
    });

    const newRefreshToken = generateRefreshToken({ id: user._id });

    // Rotate refresh token
    user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
    user.refreshTokens.push(newRefreshToken);
    await user.save({ validateBeforeSave: false });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken, user: user.toPublicJSON() };
};

/**
 * Get current user profile
 */
const getMe = async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new NotFoundError('User not found');
    }
    return user.toPublicJSON();
};

module.exports = { register, login, logout, refreshAccessToken, getMe, REFRESH_COOKIE_OPTIONS };
