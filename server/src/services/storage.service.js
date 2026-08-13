const cloudinary = require('../config/cloudinary');

/**
 * Produce a URL-path-safe filename for the Cloudinary fl_attachment parameter.
 *
 * Cloudinary embeds the attachment name directly into the URL path, e.g.:
 *   /fl_attachment:my_safe_name.pdf/
 * Any character that isn't alphanumeric, a dot, a hyphen, or an underscore will
 * break the URL and result in a 400 error.
 *
 * Strategy:
 *  1. Separate the extension from the base name.
 *  2. Replace every non-safe character (including spaces) with underscore.
 *  3. Collapse consecutive underscores and trim leading/trailing ones.
 *  4. Limit total length to avoid Cloudinary parameter size limits.
 *  5. Guarantee an extension so the OS knows the file type.
 */
const buildAttachmentFilename = (file) => {
    const originalName = file.originalName || '';

    // ── Extract extension ──────────────────────────────────────────
    // Prefer the stored `format` field (always reliable for Cloudinary resources).
    // Fall back to whatever is at the end of originalName.
    let ext = '';
    if (file.format) {
        ext = file.format.toLowerCase().replace(/[^a-z0-9]/g, '');
    } else {
        const dotIdx = originalName.lastIndexOf('.');
        if (dotIdx > 0) {
            ext = originalName.slice(dotIdx + 1).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);
        }
    }

    // ── Build a safe base name ─────────────────────────────────────
    const rawBase = ext
        ? originalName.slice(0, originalName.lastIndexOf('.'))   // strip ext
        : originalName;

    const safeBase = rawBase
        .replace(/\s+/g, '_')             // spaces → underscore
        .replace(/[^a-zA-Z0-9_-]/g, '_') // everything else unsafe → underscore
        .replace(/_{2,}/g, '_')           // collapse multiples
        .replace(/^_+|_+$/g, '')          // trim leading/trailing underscores
        .slice(0, 80)                     // max 80-char base
        || 'file';                        // ultimate fallback

    return ext ? `${safeBase}.${ext}` : safeBase;
};

/**
 * Generate a Cloudinary download URL that forces the browser to save the file
 * with the correct filename and extension.
 *
 * @param {Object} file - MongoDB file documents
 *   Expected: { publicId, resourceType, format, originalName }
 * @returns {string} Cloudinary download URL
 */
const generateDownloadUrl = (file) => {
    const options = {
        resource_type: file.resourceType,
        secure: true,
        // Sign the URL so Cloudinary serves it regardless of account delivery restrictions.
        // The signature is computed using the API secret and expires after 10 minutes.
        sign_url: true,
        expires_at: Math.floor(Date.now() / 1000) + 600, // 10 minutes
    };

    // Pin the format so Cloudinary doesn't transcode images/videos on download.
    // Raw files shouldn't have a format in the URL builder because it's baked into their publicId.
    if (file.resourceType !== 'raw' && file.format) {
        options.format = file.format;
    }

    return cloudinary.url(file.publicId, options);
};

module.exports = { generateDownloadUrl };
