const crypto = require('crypto');

/**
 * Deterministic, one-way digest for storing long-lived bearer tokens (refresh
 * tokens) at rest. Refresh tokens are already high-entropy random JWTs, so a
 * fast cryptographic hash (unlike bcrypt, which is deliberately slow for
 * low-entropy secrets like passwords) is the right tool: a DB read no longer
 * hands over directly reusable sessions the way storing the raw token would.
 */
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

module.exports = { hashToken };
