// middleware/auth.js — Firebase token verification + role-based access
const admin = require('../config/firebase');
const logger = require('../config/logger');

/**
 * Verifies Firebase ID token from Authorization header.
 * Attaches decoded user to req.user.
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No authorization token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      role: decoded.role || 'citizen',   // Custom claim set during registration
      name: decoded.name,
      emailVerified: decoded.email_verified,
    };
    next();
  } catch (err) {
    logger.warn(`Invalid token from IP ${req.ip}: ${err.message}`);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Role-based access control middleware factory.
 * Usage: requireRole('admin') or requireRole('authority', 'admin')
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (!roles.includes(req.user.role)) {
    logger.warn(`Unauthorized role access: user ${req.user.uid} (${req.user.role}) tried to access restricted route`);
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

/**
 * Ensure email is verified before sensitive operations.
 */
const requireEmailVerified = (req, res, next) => {
  if (!req.user?.emailVerified) {
    return res.status(403).json({ error: 'Please verify your email address to continue' });
  }
  next();
};

module.exports = { verifyToken, requireRole, requireEmailVerified };
