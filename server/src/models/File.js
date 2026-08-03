const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');

const fileSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false, // Guests won't have an owner
        },
        originalName: {
            type: String,
            required: [true, 'Original name is required'],
            trim: true,
        },
        fileName: {
            type: String,
            required: [true, 'File name is required'],
            trim: true,
        },
        extension: {
            type: String,
            required: [true, 'Extension is required'],
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
        publicId: {
            type: String,
            required: [true, 'Cloudinary Public ID is required'],
        },
        resourceType: {
            type: String,
            required: [true, 'Resource type is required'],
            enum: ['image', 'video', 'raw'],
        },
        format: {
            type: String,
            default: null,
        },
        sha256: {
            type: String,
            default: null,
        },
        uploadedAt: {
            type: Date,
            default: Date.now,
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
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// ─── Virtuals ──────────────────────────────────
// Dynamically generate the Cloudinary URL using the SDK and force download via flags
fileSchema.virtual('storageUrl').get(function () {
    return cloudinary.url(this.publicId, {
        resource_type: this.resourceType,
        format: this.resourceType === 'raw' ? null : this.format,
        secure: true,
        flags: 'attachment',
    });
});

// For backwards compatibility
fileSchema.virtual('fileNameLegacy').get(function () {
    return this.originalName;
});

// ─── Indexes ──────────────────────────────────
fileSchema.index({ owner: 1 });
fileSchema.index({ expiry: 1 });

const File = mongoose.model('File', fileSchema);

module.exports = File;
