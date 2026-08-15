const File = require('../models/File');
const Share = require('../models/Share');
const storageService = require('../services/storage.service');
const accessTokenService = require('../services/accessToken.service');
const passwordService = require('../services/password.service');
const { sendSuccess } = require('../utils/response');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../utils/errors');

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

        // Authorization: user must own the file or have a share for it
        if (file.owner && file.owner.toString() !== userId) {
            // Check if there's an active share for this file
            const share = await Share.findOne({ fileId: file._id, isActive: true });
            if (!share) {
                throw new ForbiddenError('You do not have access to this file');
            }
        }

        // Check if any active share for this file has a password
        const passwordShare = await Share.findOne({
            fileId: file._id,
            isActive: true,
            password: { $ne: null },
        });

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
        const share = await Share.findOne({
            fileId: file._id,
            isActive: true,
            password: { $ne: null },
        });

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

        // Check if file is password-protected
        const passwordShare = await Share.findOne({
            fileId: file._id,
            isActive: true,
            password: { $ne: null },
        });

        if (passwordShare) {
            // Verify access token
            if (!accessToken) {
                return res.status(401).json({
                    success: false,
                    message: 'Access token required. Please validate password first.',
                });
            }

            const verification = accessTokenService.verifyAccessToken(accessToken, fileId, userId);
            if (!verification.valid) {
                return res.status(401).json({
                    success: false,
                    message: verification.error,
                });
            }
        } else {
            // Not password-protected: just check authorization
            if (file.owner && file.owner.toString() !== userId) {
                const share = await Share.findOne({ fileId: file._id, isActive: true });
                if (!share) {
                    throw new ForbiddenError('You do not have access to this file');
                }
            }
        }

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

        // Check password protection
        const passwordShare = await Share.findOne({
            fileId: file._id,
            isActive: true,
            password: { $ne: null },
        });

        if (passwordShare) {
            if (!accessToken) {
                return res.status(401).json({
                    success: false,
                    message: 'Access token required. Please validate password first.',
                });
            }

            const verification = accessTokenService.verifyAccessToken(accessToken, fileId, userId);
            if (!verification.valid) {
                return res.status(401).json({
                    success: false,
                    message: verification.error,
                });
            }
        } else {
            if (file.owner && file.owner.toString() !== userId) {
                const share = await Share.findOne({ fileId: file._id, isActive: true });
                if (!share) {
                    throw new ForbiddenError('You do not have access to this file');
                }
            }
        }

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
