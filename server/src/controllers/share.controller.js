const shareService = require('../services/share.service');
const storageService = require('../services/storage.service');
const passwordService = require('../services/password.service');
const { sendSuccess } = require('../utils/response');

/**
 * POST /api/shares
 */
const createShare = async (req, res, next) => {
    try {
        const { fileId, password, downloadLimit, expiryDays } = req.body;
        const userId = req.user?.id; // Optional: Guest won't have req.user

        const share = await shareService.createShare({
            userId,
            fileId,
            password,
            downloadLimit,
            expiryDays,
        });

        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const shareUrl = `${clientUrl}/share/${share.shareCode}`;

        return sendSuccess(res, 201, 'Share link generated successfully', {
            shareCode: share.shareCode,
            shareUrl,
            expiry: share.expiry,
            hasPassword: !!share.password,
            downloadLimit: share.downloadLimit,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/shares/:code
 */
const getShare = async (req, res, next) => {
    try {
        const share = await shareService.getShareByCode(req.params.code);

        const responsePayload = {
            shareCode: share.shareCode,
            file: share.fileId,
            hasPassword: !!share.password,
            expiry: share.expiry,
            downloadCount: share.downloadCount,
            downloadLimit: share.downloadLimit,
        };

        return sendSuccess(res, 200, 'Share metadata fetched successfully', responsePayload);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/shares/:code/download
 * Validates the share (password, expiry, limits) and returns the
 * direct Cloudinary download URL as JSON for the frontend to use.
 */
const downloadShare = async (req, res, next) => {
    try {
        const { password } = req.query;
        const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
        const userAgent = req.headers['user-agent'];
        const shareCode = req.params.code;

        // Rate limiting check for password-protected shares
        const rateLimit = await passwordService.checkRateLimit(shareCode, ip);
        if (rateLimit.blocked) {
            return res.status(429).json({
                success: false,
                message: 'Too many failed attempts. Please try again later.',
                attemptsRemaining: 0,
            });
        }

        // All security checks (expiry, password, download limit) happen inside downloadShare
        let file;
        try {
            file = await shareService.downloadShare(shareCode, password, ip, userAgent, true);
        } catch (err) {
            // If password was wrong, record the failed attempt
            if (err.statusCode === 403 && password) {
                const attempts = await passwordService.recordFailedAttempt(shareCode, ip);
                const remaining = Math.max(0, passwordService.MAX_FAILED_ATTEMPTS - attempts);
                return res.status(403).json({
                    success: false,
                    message: err.message,
                    attemptsRemaining: remaining,
                });
            }
            throw err;
        }

        // Clear failed attempts on successful password entry
        if (password) {
            await passwordService.clearFailedAttempts(shareCode, ip);
        }

        // Generate the Cloudinary URL for direct browser access
        const downloadUrl = storageService.generateDownloadUrl(file);

        return sendSuccess(res, 200, 'Download URL generated', {
            downloadUrl,
            filename: file.originalName,
        });

    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/shares/:code/redirect
 * Same validation as downloadShare, but returns an HTTP 302 redirect
 * directly to the Cloudinary URL instead of JSON.
 *
 * This is the preferred method for browsers — Cloudinary sends the correct
 * Content-Type headers so PDFs, ZIPs, etc. download with proper MIME types.
 */
const redirectDownload = async (req, res, next) => {
    try {
        const { password } = req.query;
        const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
        const userAgent = req.headers['user-agent'];
        const shareCode = req.params.code;

        // Rate limiting check
        const rateLimit = await passwordService.checkRateLimit(shareCode, ip);
        if (rateLimit.blocked) {
            return res.status(429).json({
                success: false,
                message: 'Too many failed attempts. Please try again later.',
            });
        }

        let file;
        try {
            file = await shareService.downloadShare(shareCode, password, ip, userAgent, false);
        } catch (err) {
            if (err.statusCode === 403 && password) {
                await passwordService.recordFailedAttempt(shareCode, ip);
            }
            throw err;
        }

        if (password) {
            await passwordService.clearFailedAttempts(shareCode, ip);
        }

        const downloadUrl = storageService.generateDownloadUrl(file);

        // HTTP 302 Redirect — browser follows this to Cloudinary
        return res.redirect(302, downloadUrl);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createShare,
    getShare,
    downloadShare,
    redirectDownload,
};
