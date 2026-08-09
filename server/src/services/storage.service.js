const cloudinary = require('../config/cloudinary');

/**
 * Sanitize a filename so it is safe to pass as a Cloudinary fl_attachment value.
 * Cloudinary's fl_attachment parameter must not contain: / : * ? " < > | \
 * We also replace spaces with underscores to avoid URL issues.
 * @param {string} filename
 * @returns {string}
 */
const sanitizeFilename = (filename) => {
    return filename
        .replace(/[/\\:*?"<>|]/g, '_')   // strip forbidden chars
        .replace(/\s+/g, '_')             // spaces → underscores
        .replace(/_{2,}/g, '_')           // collapse multiple underscores
        .slice(0, 180);                   // Cloudinary has a parameter length limit
};

/**
 * Generate a Cloudinary download URL that forces the browser to save the file
 * with the original filename (including its extension).
 *
 * @param {Object} file - The file document from MongoDB
 *   Expected fields: publicId, resourceType, format, originalName
 * @returns {string} The downloadable Cloudinary URL
 */
const generateDownloadUrl = (file) => {
    // Build a safe attachment filename that includes the original extension.
    // We prefer file.originalName which already has the user's full filename
    // (e.g. "report.pdf", "image.png"). Fallback to publicId basename + format.
    let attachmentName;
    if (file.originalName) {
        attachmentName = sanitizeFilename(file.originalName);
    } else if (file.format) {
        // Derive from the publicId's last segment + the stored format extension
        const base = file.publicId.split('/').pop().split('.')[0];
        attachmentName = sanitizeFilename(`${base}.${file.format}`);
    } else {
        attachmentName = sanitizeFilename(file.publicId.split('/').pop());
    }

    const options = {
        resource_type: file.resourceType,
        secure: true,
        // fl_attachment:<name> tells Cloudinary to send a Content-Disposition: attachment
        // header with the given filename, so the browser saves it with the right name & extension.
        flags: `attachment:${attachmentName}`,
    };

    // For non-raw resources (images, video) also pin the format so Cloudinary
    // serves the correct file format and doesn't transcode.
    if (file.resourceType !== 'raw' && file.format) {
        options.format = file.format;
    }

    return cloudinary.url(file.publicId, options);
};

module.exports = {
    generateDownloadUrl,
};
