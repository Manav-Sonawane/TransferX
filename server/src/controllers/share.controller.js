const shareService = require('../services/share.service');
const storageService = require('../services/storage.service');
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

        console.log(`[DEBUG] Returned Response (GetShare):`, JSON.stringify(responsePayload, null, 2));

        return sendSuccess(res, 200, 'Share metadata fetched successfully', responsePayload);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/shares/:code/download
 */
const downloadShare = async (req, res, next) => {
    try {
        const { password } = req.query;
        const ip = req.ip || req.headers['x-forwarded-for'];
        const userAgent = req.headers['user-agent'];

        const file = await shareService.downloadShare(
            req.params.code,
            password,
            ip,
            userAgent
        );

        const downloadUrl = storageService.generateDownloadUrl(file);
        
        const axios = require('axios');
        const response = await axios({
            url: downloadUrl,
            method: 'GET',
            responseType: 'stream'
        });

        res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
        res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
        
        // Ensure content-length is passed along if available
        if (response.headers['content-length']) {
            res.setHeader('Content-Length', response.headers['content-length']);
        }

        console.log(`[DEBUG] Streaming file ${file.originalName} from Cloudinary`);
        response.data.pipe(res);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createShare,
    getShare,
    downloadShare,
};
