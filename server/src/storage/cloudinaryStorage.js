const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
const path = require('path');

/**
 * Determine the Cloudinary resource type based on MIME type
 * @param {string} mimeType 
 * @returns {'image' | 'video' | 'raw'}
 */
const getResourceType = (mimeType) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/') || mimeType.startsWith('audio/')) return 'video';
    return 'raw';
};

/**
 * Upload a file buffer to Cloudinary using upload_stream with preserved name and extension
 * @param {Buffer} fileBuffer 
 * @param {string} originalName
 * @param {string} mimeType
 * @param {string} folder 
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadToCloudinary = (fileBuffer, originalName, mimeType, folder = 'transferx/uploads') => {
    return new Promise((resolve, reject) => {
        const parsed = path.parse(originalName);
        const cleanName = parsed.name.replace(/[^a-zA-Z0-9-_]/g, '_');
        const ext = parsed.ext;
        
        const resourceType = getResourceType(mimeType);
        
        // Generate a collision-resistant unique public_id suffix
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        
        // CRITICAL: Raw resource types require the extension to be explicitly present in the public_id
        const publicId = resourceType === 'raw'
            ? `${cleanName}_${uniqueSuffix}${ext}`
            : `${cleanName}_${uniqueSuffix}`;

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: resourceType,
                public_id: publicId,
                overwrite: false,
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
};

/**
 * Delete a file from Cloudinary specifying its correct resource type
 * @param {string} publicId 
 * @param {'image' | 'video' | 'raw'} resourceType
 */
const deleteFromCloudinary = async (publicId, resourceType) => {
    try {
        if (!publicId) return;
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (error) {
        console.error('Cloudinary delete error:', error);
    }
};

module.exports = { 
    uploadToCloudinary, 
    deleteFromCloudinary,
    getResourceType
};
