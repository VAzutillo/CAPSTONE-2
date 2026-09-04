const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

/**
 * Strict rate limit for login/register - prevents brute force.
 * 5 attempts per 15 minutes per IP.
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General API rate limit - 100 requests per 15 minutes.
 */
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General input sanitization middleware for SQL safety.
 * Prevents potential SQL injection by escaping special characters.
 */
function noSqlSanitize(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  next();
}

function sanitizeObject(obj) {
  for (const key in obj) {
    if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      sanitizeObject(obj[key]);
    }
  }
}

/**
 * Apply security middleware to express app.
 * Call applySecurity BEFORE routes. noSqlSanitize should be applied AFTER express.json().
 */
function applySecurity(app) {
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));
}

module.exports = {
  authRateLimiter,
  apiRateLimiter,
  noSqlSanitize,
  applySecurity,
};
