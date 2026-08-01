const { sendError } = require('../utils/response');

/**
 * Middleware factory for Zod schema validation
 * @param {import('zod').ZodSchema} schema
 * @param {'body' | 'query' | 'params'} target
 */
const validate = (schema, target = 'body') => {
    return (req, res, next) => {
        const result = schema.safeParse(req[target]);

        if (!result.success) {
            const errors = result.error.errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            }));
            return sendError(res, 422, 'Validation failed', errors);
        }

        // Replace with cleaned/parsed data
        req[target] = result.data;
        next();
    };
};

module.exports = { validate };
