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

const http = require('http');
const https = require('https');

/**
 * GET /api/shares/:code/download
 * Validates the share and proxies the Cloudinary download stream to the client.
 * This ensures we can forcibly set the exact original filename and extension,
 * bypassing Cloudinary's naming limitations for raw files.
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

        const initialUrl = storageService.generateDownloadUrl(file);

        console.log(`[DEBUG] Proxying download for ${file.originalName} → ${initialUrl}`);

        // Sanitize filename to prevent header injection errors
        const safeName = file.originalName.replace(/[^\w\d_.-]/g, '_');

        // Set exact content-disposition so the browser saves it with the correct name/extension
        res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);

        // Recursive function to fetch and follow redirects
        const fetchFile = (downloadUrl, redirectCount = 0) => {
            if (redirectCount > 5) {
                if (!res.headersSent) res.status(500).json({ success: false, message: 'Too many redirects from storage provider' });
                return;
            }

            const client = downloadUrl.startsWith('https') ? https : http;

            client.get(downloadUrl, (cloudinaryRes) => {
                // Follow redirects (301, 302, 303, 307, 308)
                if (cloudinaryRes.statusCode >= 300 && cloudinaryRes.statusCode < 400 && cloudinaryRes.headers.location) {
                    // Drain the stream to free up memory before redirecting
                    cloudinaryRes.resume(); 
                    return fetchFile(cloudinaryRes.headers.location, redirectCount + 1);
                }

                if (cloudinaryRes.statusCode !== 200) {
                    console.error('Storage provider returned status:', cloudinaryRes.statusCode);
                    cloudinaryRes.resume();
                    if (!res.headersSent) res.status(502).json({ success: false, message: 'Storage provider error' });
                    return;
                }

                // Forward the content type and length
                if (cloudinaryRes.headers['content-type']) {
                    res.setHeader('Content-Type', cloudinaryRes.headers['content-type']);
                } else {
                    res.setHeader('Content-Type', 'application/octet-stream');
                }
                if (cloudinaryRes.headers['content-length']) {
                    res.setHeader('Content-Length', cloudinaryRes.headers['content-length']);
                }
                
                cloudinaryRes.pipe(res);
            }).on('error', (err) => {
                console.error('Download stream error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ success: false, message: 'Failed to stream file from storage' });
                }
            });
        };

        fetchFile(initialUrl);
        
    } catch (error) {
        if (!res.headersSent) {
            next(error);
        }
    }
};

module.exports = {
    createShare,
    getShare,
    downloadShare,
};
