const File = require('../models/File');
const Share = require('../models/Share');
const storageService = require('../services/storage.service');
const accessTokenService = require('../services/accessToken.service');
const passwordService = require('../services/password.service');
const { sendSuccess } = require('../utils/response');
const { NotFoundError, ForbiddenError, BadRequestError, UnauthorizedError } = require('../utils/errors');

/**
 * Look up whether a file has an active password-protected share.
 */
const findPasswordShare = (fileId) =>
    Share.findOne({ fileId, isActive: true, password: { $ne: null } });

/**
 * Authorize a request for one of the /download/private/:fileId/* routes.
 * These routes take no share code — the caller can only be the file's owner,
 * or (for password-protected files) hold a valid access token from
 * validate-access. Previously, non-password files fell back to "does *any*
 * active share exist for this file", which granted access to anyone who
 * merely guessed the fileId, without that person ever presenting a share
 * code or password. Centralized here so the three call sites can't drift.
 *
 * @throws {UnauthorizedError|ForbiddenError} when access is not authorized
 * @returns {Promise<{ passwordShare: object|null }>}
 */
const authorizePrivateFileAccess = async (file, userId, accessToken) => {
    const passwordShare = await findPasswordShare(file._id);

    if (passwordShare) {
        if (!accessToken) {
            throw new UnauthorizedError('Access token required. Please validate password first.');
        }
        const verification = accessTokenService.verifyAccessToken(accessToken, file._id.toString(), userId);
        if (!verification.valid) {
            throw new UnauthorizedError(verification.error);
        }
    } else if (!file.owner || file.owner.toString() !== userId) {
        throw new ForbiddenError('You do not have access to this file');
    }

    return { passwordShare };
};

/**
 * GET /api/download/private/:fileId
 * Get file metadata for an authenticated user.
 * Returns file info and whether password validation is required.
 */
const getFileMetadata = async (req, res, next) => {
    try {
        const { fileId } = req.params;
        const userId = req.user.id;

        const file = await File.findById(fileId);
        if (!file) {
            throw new NotFoundError('File not found');
        }

        // Check if any active share for this file has a password
        const passwordShare = await findPasswordShare(file._id);

        // Only the owner may see metadata for a non-shared file; a
        // password-protected share additionally requires an access token,
        // which this metadata endpoint doesn't have yet — so it only needs to
        // know whether one exists, not verify it.
        if (!passwordShare && (!file.owner || file.owner.toString() !== userId)) {
            throw new ForbiddenError('You do not have access to this file');
        }

        return sendSuccess(res, 200, 'File metadata retrieved', {
            fileId: file._id,
            fileName: file.originalName,
            fileSize: file.size,
            mimeType: file.mimeType,
            extension: file.extension,
            expiry: file.expiry,
            isPasswordProtected: !!passwordShare,
            requiresValidation: !!passwordShare,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/download/private/:fileId/validate-access
 * Validate password and return a short-lived access token.
 * The access token is then used to download the file.
 */
const validateAccess = async (req, res, next) => {
    try {
        const { fileId } = req.params;
        const { password } = req.body;
        const userId = req.user.id;

        if (!password) {
            throw new BadRequestError('Password is required');
        }

        const file = await File.findById(fileId);
        if (!file) {
            throw new NotFoundError('File not found');
        }

        // Find the password-protected share for this file
        const share = await findPasswordShare(file._id);

        if (!share) {
            throw new BadRequestError('This file is not password-protected');
        }

        // Rate limiting check
        const rateLimit = await passwordService.checkRateLimit(fileId, userId);
        if (rateLimit.blocked) {
            return res.status(429).json({
                success: false,
                message: 'Too many failed attempts. Please try again later.',
                attemptsRemaining: 0,
            });
        }

        // Validate password against share
        const isMatch = await share.comparePassword(password);
        if (!isMatch) {
            const attempts = await passwordService.recordFailedAttempt(fileId, userId);
            const remaining = Math.max(0, passwordService.MAX_FAILED_ATTEMPTS - attempts);
            return res.status(401).json({
                success: false,
                message: 'Invalid password',
                attemptsRemaining: remaining,
            });
        }

        // Clear failed attempts on success
        await passwordService.clearFailedAttempts(fileId, userId);

        // Generate a short-lived access token (15 minutes)
        const { token, expiresAt } = accessTokenService.generateAccessToken(
            fileId,
            userId,
            900 // 15 minutes
        );

        return sendSuccess(res, 200, 'Password validated successfully', {
            accessToken: token,
            expiresIn: 900,
            expiresAt,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/download/private/:fileId/download
 * Download a file for an authenticated user.
 * If the file is password-protected, requires a valid access token
 * (obtained from validate-access endpoint).
 *
 * Returns an HTTP 302 redirect to the Cloudinary URL.
 */
const downloadFile = async (req, res, next) => {
    try {
        const { fileId } = req.params;
        const userId = req.user.id;
        const accessToken = req.headers['x-access-token'] || req.query.token;

        const file = await File.findById(fileId);
        if (!file) {
            throw new NotFoundError('File not found');
        }

        // Check expiry
        if (file.expiry && new Date() > file.expiry) {
            throw new BadRequestError('This file has expired');
        }

        await authorizePrivateFileAccess(file, userId, accessToken);

        // Generate signed Cloudinary URL
        const downloadUrl = storageService.generateDownloadUrl(file);

        // HTTP 302 Redirect to Cloudinary
        return res.redirect(302, downloadUrl);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/download/private/:fileId/download-url
 * Same as downloadFile but returns the URL as JSON instead of redirecting.
 * Useful for frontend apps that need to handle the download programmatically.
 */
const getDownloadUrl = async (req, res, next) => {
    try {
        const { fileId } = req.params;
        const userId = req.user.id;
        const accessToken = req.headers['x-access-token'] || req.query.token;

        const file = await File.findById(fileId);
        if (!file) {
            throw new NotFoundError('File not found');
        }

        if (file.expiry && new Date() > file.expiry) {
            throw new BadRequestError('This file has expired');
        }

        await authorizePrivateFileAccess(file, userId, accessToken);

        const downloadUrl = storageService.generateDownloadUrl(file);

        return sendSuccess(res, 200, 'Download URL generated', {
            downloadUrl,
            fileName: file.originalName,
            mimeType: file.mimeType,
            fileSize: file.size,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getFileMetadata,
    validateAccess,
    downloadFile,
    getDownloadUrl,
};
