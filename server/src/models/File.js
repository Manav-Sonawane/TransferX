const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false, // Guests won't have an owner
        },
        fileName: {
            type: String,
            required: [true, 'File name is required'],
            trim: true,
        },
        mimeType: {
            type: String,
            required: [true, 'MIME type is required'],
        },
        size: {
            type: Number,
            required: [true, 'File size is required'],
        },
        storageUrl: {
            type: String,
            required: [true, 'Storage URL is required'],
        },
        publicId: {
            type: String,
            required: [true, 'Cloudinary Public ID is required'],
        },
        sha256: {
            type: String,
            default: null, // For optional file deduplication later
        },
        expiry: {
            type: Date,
            required: [true, 'Expiry date is required'],
        },
        visibility: {
            type: String,
            enum: ['public', 'private'],
            default: 'public',
        },
    },
    {
        timestamps: true,
    }
);

// ─── Indexes ──────────────────────────────────
fileSchema.index({ owner: 1 });
fileSchema.index({ expiry: 1 }); // Useful for cleanup jobs

const File = mongoose.model('File', fileSchema);

module.exports = File;
