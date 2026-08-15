const Share = require('../models/Share');
const File = require('../models/File');
const storageService = require('./storage.service');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../utils/errors');
const crypto = require('crypto');

/**
 * Generate a secure, unique, and URL-safe share code (5-character uppercase alphanumeric)
 * @returns {string} 5-character code
 */
const generateUniqueShareCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};


/**
 * Create a secure share link for a file
 */
const createShare = async ({ userId, fileId, password, downloadLimit, expiryDays }) => {
    const file = await File.findById(fileId);
    if (!file) {
        throw new NotFoundError('File not found');
    }

    // Auth check: If file has an owner, check authorization
    if (file.owner && file.owner.toString() !== userId) {
        throw new ForbiddenError('You do not have permission to share this file');
    }

    // Role check: Guests (unauthenticated users) cannot password protect files
    if (!userId && password) {
        throw new BadRequestError('Guests cannot password-protect shares. Please log in.');
    }

    // Ensure share expiry does not exceed the file's expiry date
    const calculatedExpiry = new Date();
    calculatedExpiry.setDate(calculatedExpiry.getDate() + expiryDays);

    const expiry = calculatedExpiry > file.expiry ? file.expiry : calculatedExpiry;

    // Generate unique share code
    let shareCode;
    let isUnique = false;
    while (!isUnique) {
        shareCode = generateUniqueShareCode();
        const existing = await Share.findOne({ shareCode });
        if (!existing) isUnique = true;
    }

    const share = await Share.create({
        fileId: file._id,
        shareCode,
        password: password || null,
        downloadLimit: downloadLimit || 0,
        expiry,
        isActive: true,
    });

    return share;
};

/**
 * Retrieve share record by its code (excluding password)
 */
const getShareByCode = async (shareCode) => {
    const share = await Share.findOne({ shareCode, isActive: true })
        .populate({
            path: 'fileId',
            select: 'originalName fileName size extension mimeType owner visibility publicId resourceType format',
        });

    if (!share) {
        throw new NotFoundError('Share link not found or has been deactivated');
    }

    // Check expiry
    if (new Date() > share.expiry) {
        share.isActive = false;
        await share.save();
        throw new BadRequestError('This share link has expired');
    }

    // Check download limits
    if (share.downloadLimit > 0 && share.downloadCount >= share.downloadLimit) {
        share.isActive = false;
        await share.save();
        throw new BadRequestError('Download limit reached for this link');
    }

    return share;
};

const DownloadLog = require('../models/DownloadLog');

/**
 * Validate password and execute download tracking (increment download counts, log analytics)
 */
const downloadShare = async (shareCode, password, ip, userAgent) => {
    // 1. Fetch share with populated file and include password in query for validation
    const share = await Share.findOne({ shareCode, isActive: true })
        .populate('fileId');

    if (!share) {
        throw new NotFoundError('Share link not found or has been deactivated');
    }

    // 2. Validate Expiry
    if (new Date() > share.expiry) {
        share.isActive = false;
        await share.save();
        throw new BadRequestError('This share link has expired');
    }

    // 3. Validate Download Limit
    if (share.downloadLimit > 0 && share.downloadCount >= share.downloadLimit) {
        share.isActive = false;
        await share.save();
        throw new BadRequestError('Download limit reached for this link');
    }

    // 4. Validate Password if required
    if (share.password) {
        if (!password) {
            throw new ForbiddenError('Password is required to download this file');
        }
        const isMatch = await share.comparePassword(password);
        if (!isMatch) {
            throw new ForbiddenError('Incorrect password');
        }
    }

    // 5. Track Download: Increment count & check limit closure
    share.downloadCount += 1;
    if (share.downloadLimit > 0 && share.downloadCount >= share.downloadLimit) {
        share.isActive = false;
    }
    await share.save();

    // 6. Log Download Analytics
    await DownloadLog.create({
        fileId: share.fileId._id,
        shareId: share._id,
        ip: ip || 'unknown',
        userAgent: userAgent || 'unknown',
    });

    return share.fileId; // Returns the file document containing storageUrl virtual
};

module.exports = {
    createShare,
    getShareByCode,
    downloadShare,
};
