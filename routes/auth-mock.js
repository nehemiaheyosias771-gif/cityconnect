// routes/auth-mock.js — Mock authentication for development
const express = require('express');
const { body, validationResult } = require('express-validator');
const logger = require('../config/logger');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

// ── POST /api/auth/register ────────────────────────────────
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('name').trim().isLength({ min: 2, max: 80 }),
    body('phone').optional().isMobilePhone(),
    body('role').optional().isIn(['citizen', 'teacher', 'volunteer']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password, name, phone, role = 'citizen' } = req.body;

      // Mock user creation
      const mockUser = {
        uid: 'mock-user-' + Date.now(),
        email,
        displayName: name,
        phoneNumber: phone || null,
        emailVerified: false,
      };

      logger.info(`Mock registration: ${email}`);

      res.status(201).json({
        message: 'User registered successfully',
        user: mockUser
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/auth/login ────────────────────────────────────
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
], validate, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Mock authentication - accept any email/password
    if (email && password) {
      const mockUser = {
        uid: 'mock-user-123',
        email,
        displayName: email.split('@')[0],
        emailVerified: true,
        customClaims: { role: 'citizen' }
      };

      // Mock JWT token
      const mockToken = 'mock-jwt-token-' + Date.now();

      logger.info(`Mock login: ${email}`);

      res.json({
        message: 'Login successful',
        token: mockToken,
        user: mockUser
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err) {
    next(err);
  }
});

// ── GET /api/auth/me ──────────────────────────────────────
router.get('/me', async (req, res, next) => {
  try {
    // Mock user profile
    const mockProfile = {
      uid: 'mock-user-123',
      email: 'mock@example.com',
      name: 'Mock User',
      role: 'citizen',
      phone: '+1234567890',
      createdAt: new Date().toISOString()
    };

    res.json({ user: mockProfile });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/verify-token ────────────────────────────
router.post('/verify-token', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Mock token verification
    if (token.startsWith('mock-jwt')) {
      const mockUser = {
        uid: 'mock-user-123',
        email: 'mock@example.com',
        name: 'Mock User',
        role: 'citizen',
        emailVerified: true
      };

      res.json({ user: mockUser });
    } else {
      res.status(401).json({ error: 'Invalid token' });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
