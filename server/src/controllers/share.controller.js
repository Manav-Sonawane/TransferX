const shareService = require('../services/share.service');
const storageService = require('../services/storage.service');
const passwordService = require('../services/password.service');
const accessTokenService = require('../services/accessToken.service');
const { sendSuccess } = require('../utils/response');
const { Readable } = require('stream');

/**
 * Shared rate-limit → validate → track sequence used by both downloadShare
 * and redirectDownload. Centralized so a future fix (as nearly happened with
 * the raw-file format bug) can't be applied to one copy and missed in the
 * other. Returns a discriminated result rather than throwing for the
 * rate-limited/wrong-password cases, since each caller renders those into a
 * slightly different response shape.
 */
const resolveShareDownload = async ({ shareCode, ip, userAgent, password, token, validateOnly }) => {
    let preValidated = false;
    if (token) {
        const verification = accessTokenService.verifyAccessToken(token, shareCode, 'guest');
        preValidated = verification.valid;
    }

    if (!preValidated) {
        const rateLimit = await passwordService.checkRateLimit(shareCode, ip);
        if (rateLimit.blocked) {
            return { blocked: true };
        }
    }

    try {
        const file = await shareService.downloadShare(shareCode, password, ip, userAgent, validateOnly, preValidated);
        if (!preValidated && password) {
            await passwordService.clearFailedAttempts(shareCode, ip);
        }
        return { file };
    } catch (err) {
        if (err.statusCode === 403 && !preValidated) {
            const attempts = await passwordService.recordFailedAttempt(shareCode, ip);
            const remaining = Math.max(0, passwordService.MAX_FAILED_ATTEMPTS - attempts);
            return { wrongPassword: true, message: err.message, attemptsRemaining: remaining };
        }
        throw err;
    }
};

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
 * POST /api/shares/:code/download
 * Validates the share (password, expiry, limits) and returns the
 * direct Cloudinary download URL as JSON for the frontend to use,
 * plus a short-lived access token the client can use to fetch
 * /redirect without resending the plaintext password.
 */
const downloadShare = async (req, res, next) => {
    try {
        const password = req.body?.password || req.query?.password || null;
        const ip = req.ip || 'unknown';
        const userAgent = req.headers['user-agent'];
        const shareCode = req.params.code;

        const result = await resolveShareDownload({ shareCode, ip, userAgent, password, validateOnly: true });

        if (result.blocked) {
            return res.status(429).json({
                success: false,
                message: 'Too many failed attempts. Please try again later.',
                attemptsRemaining: 0,
            });
        }
        if (result.wrongPassword) {
            return res.status(403).json({
                success: false,
                message: result.message,
                attemptsRemaining: result.attemptsRemaining,
            });
        }

        const { file } = result;

        // Generate the Cloudinary URL for direct browser access
        const downloadUrl = storageService.generateDownloadUrl(file);

        // Issue a short-lived, single-purpose token bound to this share code so
        // the follow-up /redirect navigation never needs the password again.
        const { token: accessToken, expiresAt } = accessTokenService.generateAccessToken(
            shareCode,
            'guest',
            300 // 5 minutes — just long enough to click "Download"
        );

        return sendSuccess(res, 200, 'Download URL generated', {
            downloadUrl,
            filename: file.originalName,
            accessToken,
            accessTokenExpiresAt: expiresAt,
        });

    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/shares/:code/redirect
 * Returns an HTTP 302 redirect directly to the Cloudinary URL.
 *
 * For password-protected shares, accepts the `token` query param obtained
 * from POST /download or direct `password` fallback query param.
 * For shares with no password, no token is needed.
 *
 * This is the preferred method for browsers — Cloudinary sends the correct
 * Content-Type headers so PDFs, ZIPs, etc. download with proper MIME types.
 */
const redirectDownload = async (req, res, next) => {
    try {
        const { token, password } = req.query;
        const ip = req.ip || 'unknown';
        const userAgent = req.headers['user-agent'];
        const shareCode = req.params.code;

        const result = await resolveShareDownload({ shareCode, ip, userAgent, password: password || null, token, validateOnly: false });

        if (result.blocked) {
            return res.status(429).json({
                success: false,
                message: 'Too many failed attempts. Please try again later.',
            });
        }
        if (result.wrongPassword) {
            return res.status(403).json({
                success: false,
                message: result.message,
            });
        }

        const downloadUrl = storageService.generateDownloadUrl(result.file);

        // HTTP 302 Redirect — browser follows this to Cloudinary
        return res.redirect(302, downloadUrl);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/shares/:code/file
 * Streams the Cloudinary asset through this API so clients download the file
 * from TransferX instead of being redirected to the storage provider.
 */
const downloadFile = async (req, res, next) => {
    try {
        const { token, password } = req.query;
        const ip = req.ip || 'unknown';
        const userAgent = req.headers['user-agent'];
        const shareCode = req.params.code;

        const result = await resolveShareDownload({
            shareCode,
            ip,
            userAgent,
            password: password || null,
            token,
            validateOnly: false,
        });

        if (result.blocked) {
            return res.status(429).json({ success: false, message: 'Too many failed attempts. Please try again later.' });
        }
        if (result.wrongPassword) {
            return res.status(403).json({ success: false, message: result.message });
        }

        const file = result.file;
        const downloadUrl = storageService.generateDownloadUrl(file);
        const upstream = await fetch(downloadUrl);

        if (!upstream.ok || !upstream.body) {
            throw new Error(`Cloudinary file fetch failed with status ${upstream.status}`);
        }

        const filename = String(file.originalName || 'download')
            .replace(/[\r\n"]/g, '_');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
        if (upstream.headers.get('content-length')) {
            res.setHeader('Content-Length', upstream.headers.get('content-length'));
        }

        return Readable.fromWeb(upstream.body).pipe(res);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createShare,
    getShare,
    downloadShare,
    redirectDownload,
    downloadFile,
};
