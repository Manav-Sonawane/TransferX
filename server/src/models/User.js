const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [50, 'Name cannot exceed 50 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters'],
            select: false, // never returned in queries by default
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
        storageUsed: {
            type: Number,
            default: 0, // bytes
        },
        refreshTokens: {
            type: [String],
            select: false,
            default: [],
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        lastLoginAt: {
            type: Date,
        },
    },
    {
        timestamps: true, // adds createdAt + updatedAt
    }
);


// ─── Pre-save: Hash password ──────────────────
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});


// ─── Methods ─────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublicJSON = function () {
    return {
        id: this._id,
        name: this.name,
        email: this.email,
        role: this.role,
        storageUsed: this.storageUsed,
        createdAt: this.createdAt,
    };
};

const User = mongoose.model('User', userSchema);

module.exports = User;
