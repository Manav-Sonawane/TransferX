const { z } = require('zod');

const createShareSchema = z.object({
    fileId: z
        .string({ required_error: 'File ID is required' })
        .regex(/^[0-9a-fA-F]{24}$/, 'Invalid File ID format'),
        
    password: z
        .string()
        .min(4, 'Password must be at least 4 characters')
        .optional()
        .or(z.literal(''))
        .transform(val => val === '' ? undefined : val),

    downloadLimit: z
        .number()
        .min(0, 'Download limit must be a positive number')
        .optional()
        .default(0), // 0 means unlimited

    expiryDays: z
        .number()
        .min(1, 'Expiry must be at least 1 day')
        .max(30, 'Expiry cannot exceed 30 days')
        .optional()
        .default(7),
});

const getShareSchema = z.object({
    code: z
        .string({ required_error: 'Share code is required' })
        .length(5, 'Share code must be exactly 5 characters')
        .regex(/^[A-Z0-9]{5}$/, 'Share code must be alphanumeric and uppercase'),
});

module.exports = { createShareSchema, getShareSchema };

