// middleware/auth-mock.js — Mock authentication middleware
const logger = require('../config/logger');

/**
 * Mock token verification - accepts any Bearer token for development
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No authorization token provided' });
  }

  const token = authHeader.split(' ')[1];

  // Mock token validation - accept any token that starts with "mock-jwt"
  if (token.startsWith('mock-jwt')) {
    req.user = {
      uid: 'mock-user-123',
      email: 'mock@example.com',
      role: 'citizen',
      name: 'Mock User',
      emailVerified: true,
    };
    return next();
  }

  // For development, also accept any token
  req.user = {
    uid: 'mock-user-123',
    email: 'dev@example.com',
    role: 'citizen',
    name: 'Dev User',
    emailVerified: true,
  };
  next();
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (!roles.includes(req.user.role)) {
    logger.warn(`Unauthorized role access: user ${req.user.uid} (${req.user.role}) tried to access restricted route`);
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

const requireEmailVerified = (req, res, next) => {
  if (!req.user?.emailVerified) {
    return res.status(403).json({ error: 'Please verify your email address to continue' });
  }
  next();
};

module.exports = { verifyToken, requireRole, requireEmailVerified };
