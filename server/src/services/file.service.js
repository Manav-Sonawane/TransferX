const File = require('../models/File');
const User = require('../models/User');
const { uploadToCloudinary, deleteFromCloudinary, getResourceType } = require('../storage/cloudinaryStorage');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const crypto = require('crypto');
const path = require('path');

/**
 * Upload a file to Cloudinary and save metadata with transactional cleanup
 */
const uploadFile = async ({ user, file, expiryDays = 7, visibility = 'public' }) => {
    const { originalname, mimetype, size, buffer } = file;

    // Calculate expiry date
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + parseInt(expiryDays, 10));

    // Calculate SHA256 checksum
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    // Parse file extensions
    const parsedPath = path.parse(originalname);
    const extension = parsedPath.ext || '';
    const cleanFileName = parsedPath.name;

    // 1. Upload to Cloudinary first
    let uploadResult;
    try {
        uploadResult = await uploadToCloudinary(buffer, originalname, mimetype);
    } catch (uploadError) {
        throw new Error(`Cloudinary upload failed: ${uploadError.message}`);
    }

    // 2. Insert metadata into MongoDB (with rollback/cleanup on failure)
    try {
        const fileDoc = await File.create({
            owner: user ? user.id : null,
            originalName: originalname,
            fileName: cleanFileName,
            extension,
            mimeType: mimetype,
            size,
            publicId: uploadResult.public_id,
            resourceType: uploadResult.resource_type,
            format: uploadResult.format || null,
            sha256,
            expiry,
            visibility: user ? visibility : 'public', // Guests are always public
        });

        // 3. Update user storage quota if authenticated
        if (user) {
            await User.findByIdAndUpdate(user.id, { $inc: { storageUsed: size } });
        }

        return fileDoc;
    } catch (dbError) {
        // Rollback: delete from Cloudinary to prevent orphan files
        console.error('Database write failed. Rolling back Cloudinary upload...', dbError);
        await deleteFromCloudinary(uploadResult.public_id, uploadResult.resource_type);
        throw dbError;
    }
};

/**
 * Get all files owned by a user
 */
const getUserFiles = async (userId) => {
    return File.find({ owner: userId }).sort({ createdAt: -1 });
};

/**
 * Delete a file completely from Cloudinary and DB
 */
const deleteFile = async (fileId, userId) => {
    const file = await File.findById(fileId);

    if (!file) {
        throw new NotFoundError('File not found');
    }

    // Authorization check
    if (file.owner && file.owner.toString() !== userId) {
        throw new ForbiddenError('You do not have permission to delete this file');
    }

    // 1. Delete from Cloudinary using the stored resourceType
    await deleteFromCloudinary(file.publicId, file.resourceType);

    // 2. Delete from MongoDB
    await file.deleteOne();

    // 3. Deduct from user storage quota if authenticated
    if (file.owner) {
        await User.findByIdAndUpdate(file.owner, { $inc: { storageUsed: -file.size } });
    }

    return true;
};

module.exports = {
    uploadFile,
    getUserFiles,
    deleteFile,
};
