const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

const shareSchema = new mongoose.Schema(
    {
        fileId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'File',
            required: [true, 'File ID is required'],
        },
        shareCode: {
            type: String,
            required: [true, 'Share code is required'],
            unique: true,
            trim: true,
        },
        password: {
            type: String,
            default: null, // Optional password protection
        },
        downloadCount: {
            type: Number,
            default: 0,
        },
        downloadLimit: {
            type: Number,
            default: 0, // 0 means unlimited
        },
        expiry: {
            type: Date,
            required: [true, 'Expiry date is required'],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// ─── Indexes ──────────────────────────────────
shareSchema.index({ expiry: 1 });

// ─── Pre-save: Hash password ──────────────────
shareSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) return;
    this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

// ─── Methods ─────────────────────────────────
shareSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) return true; // No password required
    return bcrypt.compare(candidatePassword, this.password);
};

shareSchema.methods.isExpired = function () {
    return new Date() > this.expiry;
};

shareSchema.methods.isDownloadLimitReached = function () {
    return this.downloadLimit > 0 && this.downloadCount >= this.downloadLimit;
};

const Share = mongoose.model('Share', shareSchema);

module.exports = Share;
