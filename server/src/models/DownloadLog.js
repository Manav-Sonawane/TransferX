const mongoose = require('mongoose');

const downloadLogSchema = new mongoose.Schema(
    {
        fileId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'File',
            required: true,
        },
        shareId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Share',
            required: true,
        },
        ip: {
            type: String,
            required: true,
        },
        userAgent: {
            type: String,
            default: 'Unknown',
        },
    },
    {
        timestamps: { createdAt: 'timestamp', updatedAt: false }, // Only need timestamp
    }
);

// ─── Indexes ──────────────────────────────────
downloadLogSchema.index({ fileId: 1 });
downloadLogSchema.index({ shareId: 1 });
// Optional: Auto delete logs after some time to save space (e.g., 30 days)
downloadLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const DownloadLog = mongoose.model('DownloadLog', downloadLogSchema);

module.exports = DownloadLog;
