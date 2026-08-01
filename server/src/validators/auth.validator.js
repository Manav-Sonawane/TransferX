const { z } = require('zod');

const registerSchema = z.object({
    name: z
        .string({ required_error: 'Name is required' })
        .trim()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name cannot exceed 50 characters'),

    email: z
        .string({ required_error: 'Email is required' })
        .trim()
        .toLowerCase()
        .email('Please provide a valid email'),

    password: z
        .string({ required_error: 'Password is required' })
        .min(8, 'Password must be at least 8 characters')
        .max(72, 'Password cannot exceed 72 characters'),

    confirmPassword: z
        .string({ required_error: 'Please confirm your password' }),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

const loginSchema = z.object({
    email: z
        .string({ required_error: 'Email is required' })
        .trim()
        .toLowerCase()
        .email('Please provide a valid email'),

    password: z
        .string({ required_error: 'Password is required' })
        .min(1, 'Password is required'),
});

module.exports = { registerSchema, loginSchema };
