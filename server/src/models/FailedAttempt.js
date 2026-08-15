const mongoose = require('mongoose');

const failedAttemptSchema = new mongoose.Schema(
    {
        identifier: {
            type: String,
            required: true,
            // Format: "shareCode:ip" or "fileId:userId"
        },
        attempts: {
            type: Number,
            default: 1,
        },
        lastAttemptAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// ─── Indexes ──────────────────────────────────
// Unique lookup by identifier
failedAttemptSchema.index({ identifier: 1 }, { unique: true });

// Auto-delete failed attempt records after 15 minutes (rate limit window)
failedAttemptSchema.index({ lastAttemptAt: 1 }, { expireAfterSeconds: 900 });

// ─── Statics ──────────────────────────────────

/**
 * Record a failed password attempt. Creates or increments the counter.
 * @param {string} identifier - Unique key (e.g. "SHARE_CODE:127.0.0.1")
 * @returns {number} Updated attempt count
 */
failedAttemptSchema.statics.recordFailure = async function (identifier) {
    const result = await this.findOneAndUpdate(
        { identifier },
        {
            $inc: { attempts: 1 },
            $set: { lastAttemptAt: new Date() },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return result.attempts;
};

/**
 * Get the current failed attempt count for an identifier.
 * @param {string} identifier
 * @returns {number} Current attempt count (0 if no record)
 */
failedAttemptSchema.statics.getAttemptCount = async function (identifier) {
    const record = await this.findOne({ identifier });
    return record ? record.attempts : 0;
};

/**
 * Clear failed attempts (e.g. after successful password entry).
 * @param {string} identifier
 */
failedAttemptSchema.statics.clearAttempts = async function (identifier) {
    await this.deleteOne({ identifier });
};

const FailedAttempt = mongoose.model('FailedAttempt', failedAttemptSchema);

module.exports = FailedAttempt;
