const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema(
    {
        socketId: {
            type: String,
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null, // Null for guests
        },
        name: {
            type: String,
            required: true, // Display name
        },
    },
    { _id: false }
);

const sessionSchema = new mongoose.Schema(
    {
        sessionCode: {
            type: String,
            required: [true, 'Session code is required'],
            unique: true,
            trim: true,
        },
        hostId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null, // Null for guests
        },
        participants: [participantSchema],
        status: {
            type: String,
            enum: ['waiting', 'active', 'closed'],
            default: 'waiting',
        },
    },
    {
        timestamps: true,
    }
);

// ─── Indexes ──────────────────────────────────
// sessionCode already gets a unique index from `unique: true` above — no need
// to declare it again here.
// Sessions should expire fairly quickly if abandoned
sessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 }); // Auto delete after 1 hour

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
