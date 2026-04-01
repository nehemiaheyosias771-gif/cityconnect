// middleware/security.js — Input sanitization + suspicious activity detection
const logger = require('../config/logger');
const { sendSecurityAlert } = require('../services/securityService');

// Track suspicious IPs in memory (use Redis in production)
const suspiciousIPs = new Map();
const SUSPICIOUS_THRESHOLD = 5;

/**
 * Custom security middleware:
 * - XSS pattern detection
 * - SQL/NoSQL injection pattern detection
 * - Suspicious request flagging
 * - Automatic admin alerting
 */
const securityMiddleware = async (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const body = JSON.stringify(req.body || {});
  const query = JSON.stringify(req.query || {});
  const combined = body + query;

  // XSS detection patterns
  const xssPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /eval\s*\(/gi,
  ];

  // Injection detection patterns
  const injectionPatterns = [
    /(\$where|\$ne|\$gt|\$lt|\$in|\$regex)/gi,   // NoSQL injection
    /(union\s+select|drop\s+table|insert\s+into)/gi, // SQL injection
    /\.\.\//gi,                                    // Path traversal
  ];

  const allPatterns = [...xssPatterns, ...injectionPatterns];
  const isSuspicious = allPatterns.some(p => p.test(combined));

  if (isSuspicious) {
    // Track this IP
    const count = (suspiciousIPs.get(ip) || 0) + 1;
    suspiciousIPs.set(ip, count);

    logger.warn(`Suspicious request from ${ip} (attempt #${count}): ${req.method} ${req.path}`);

    // Alert admin if threshold exceeded
    if (count >= SUSPICIOUS_THRESHOLD) {
      await sendSecurityAlert({
        type: 'INJECTION_ATTEMPT',
        ip,
        endpoint: `${req.method} ${req.path}`,
        attempts: count,
        payload: combined.substring(0, 200), // Truncate for safety
      }).catch(e => logger.error('Failed to send security alert:', e));
    }

    return res.status(400).json({ error: 'Invalid input detected' });
  }

  // Sanitize string fields in body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  next();
};

/**
 * Recursively sanitize object values — strip dangerous chars from strings.
 */
function sanitizeObject(obj) {
  if (typeof obj === 'string') {
    return obj
      .replace(/[<>]/g, '')       // Strip < >
      .replace(/javascript:/gi, '') // Strip js: protocol
      .trim();
  }
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, sanitizeObject(v)])
    );
  }
  return obj;
}

module.exports = { securityMiddleware, sanitizeObject };
