const authService = require('../services/auth.service');
const { verifyRefreshToken } = require('../utils/jwt');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        const { user, accessToken, refreshToken } = await authService.register({ name, email, password });

        res.cookie('refreshToken', refreshToken, authService.REFRESH_COOKIE_OPTIONS);

        return sendSuccess(res, 201, 'Account created successfully', { user, accessToken });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const { user, accessToken, refreshToken } = await authService.login({ email, password });

        res.cookie('refreshToken', refreshToken, authService.REFRESH_COOKIE_OPTIONS);

        return sendSuccess(res, 200, 'Logged in successfully', { user, accessToken });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        // Derive the user from the refresh token itself rather than req.user —
        // this route has no auth middleware in front of it (by design, so logout
        // works even if the access token already expired), so req.user is never
        // populated here. Without this, the refresh token was never actually
        // revoked server-side; only the cookie was cleared.
        if (refreshToken) {
            try {
                const { id: userId } = verifyRefreshToken(refreshToken);
                await authService.logout(userId, refreshToken);
            } catch {
                // Invalid/expired refresh token — nothing to revoke server-side.
            }
        }

        res.clearCookie('refreshToken', { path: '/' });
        return sendSuccess(res, 200, 'Logged out successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/auth/refresh
 */
const refresh = async (req, res, next) => {
    try {
        const refreshToken = req.cookies?.refreshToken;
        const result = await authService.refreshAccessToken(refreshToken);

        res.cookie('refreshToken', result.refreshToken, authService.REFRESH_COOKIE_OPTIONS);

        return sendSuccess(res, 200, 'Token refreshed', {
            accessToken: result.accessToken,
            user: result.user,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
    try {
        const user = await authService.getMe(req.user.id);
        return sendSuccess(res, 200, 'User profile fetched', { user });
    } catch (error) {
        next(error);
    }
};

module.exports = { register, login, logout, refresh, getMe };
