// routes/auth.js — Firebase Auth integration (register, login, MFA, profile)
const express = require('express');
const { body, validationResult } = require('express-validator');
const admin = require('../config/firebase');
const { db } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');
const { sendEmail } = require('../services/emailService');
const logger = require('../config/logger');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

// ── POST /api/auth/register ────────────────────────────────
// Creates user in Firebase Auth + Firestore profile
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/).withMessage('Must contain uppercase letter')
      .matches(/[0-9]/).withMessage('Must contain a number'),
    body('name').trim().isLength({ min: 2, max: 80 }),
    body('phone').optional().isMobilePhone(),
    body('role').optional().isIn(['citizen', 'teacher', 'volunteer']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password, name, phone, role = 'citizen' } = req.body;

      // Create Firebase Auth user
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: name,
        phoneNumber: phone || undefined,
        emailVerified: false,
      });

      // Set custom role claim
      await admin.auth().setCustomUserClaims(userRecord.uid, { role });

      // Save profile to Firestore
      await db.collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email,
        name,
        phone: phone || null,
        role,
        notifyEmail: true,
        notifySMS: !!phone,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        issuesReported: 0,
        upvotesGiven: 0,
      });

      // Send welcome + verification email
      const verificationLink = await admin.auth().generateEmailVerificationLink(email);
      await sendEmail({
        to: email,
        subject: 'Welcome to CitiConnect — verify your email',
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:auto">
            <div style="background:#00C97B;padding:20px;text-align:center;border-radius:12px 12px 0 0">
              <h1 style="color:#0A0D09;margin:0">Welcome, ${name}!</h1>
            </div>
            <div style="padding:24px;background:#fff">
              <p>You've joined CitiConnect — Addis Ababa's smart city community portal.</p>
              <p>Please verify your email to unlock all features:</p>
              <a href="${verificationLink}" style="display:inline-block;margin-top:12px;background:#00C97B;color:#0A0D09;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">Verify email</a>
              <p style="margin-top:20px;font-size:12px;color:#999">If you did not register, ignore this email.</p>
            </div>
          </div>`,
      });

      logger.info(`User registered: ${userRecord.uid} (${email})`);
      res.status(201).json({
        uid: userRecord.uid,
        email,
        name,
        role,
        message: 'Registration successful. Check your email to verify your account.',
      });
    } catch (err) {
      if (err.code === 'auth/email-already-exists') {
        return res.status(409).json({ error: 'An account with this email already exists' });
      }
      next(err);
    }
  }
);

// ── POST /api/auth/verify-token ───────────────────────────
// Validates a Firebase ID token and returns user profile
router.post('/verify-token', verifyToken, async (req, res, next) => {
  try {
    const doc = await db.collection('users').doc(req.user.uid).get();
    if (!doc.exists) return res.status(404).json({ error: 'User profile not found' });

    // Update last active
    await doc.ref.update({ lastActive: new Date().toISOString() });

    res.json({ user: { uid: req.user.uid, ...doc.data() } });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/auth/profile ──────────────────────────────────
router.get('/profile', verifyToken, async (req, res, next) => {
  try {
    const doc = await db.collection('users').doc(req.user.uid).get();
    if (!doc.exists) return res.status(404).json({ error: 'Profile not found' });
    res.json(doc.data());
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/auth/profile ────────────────────────────────
router.patch(
  '/profile',
  verifyToken,
  [
    body('name').optional().trim().isLength({ min: 2, max: 80 }),
    body('phone').optional().isMobilePhone(),
    body('notifyEmail').optional().isBoolean(),
    body('notifySMS').optional().isBoolean(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const allowed = ['name', 'phone', 'notifyEmail', 'notifySMS'];
      const updates = Object.fromEntries(
        Object.entries(req.body).filter(([k]) => allowed.includes(k))
      );
      updates.updatedAt = new Date().toISOString();

      await db.collection('users').doc(req.user.uid).update(updates);

      // Sync name to Firebase Auth
      if (updates.name) {
        await admin.auth().updateUser(req.user.uid, { displayName: updates.name });
      }

      res.json({ updated: true, ...updates });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/auth/mfa/enroll ─────────────────────────────
// Returns MFA enrollment info. Actual TOTP enrolment handled client-side via Firebase SDK.
router.post('/mfa/enroll', verifyToken, async (req, res) => {
  // Firebase MFA (TOTP) is enforced client-side using Firebase Auth SDK.
  // This endpoint logs the intent and returns instructions.
  logger.info(`MFA enrollment initiated for user: ${req.user.uid}`);
  res.json({
    message: 'Use the Firebase Auth SDK on the client to enroll in MFA (TOTP or phone).',
    docsUrl: 'https://firebase.google.com/docs/auth/web/multi-factor-authentication',
  });
});

// ── DELETE /api/auth/account ──────────────────────────────
router.delete('/account', verifyToken, async (req, res, next) => {
  try {
    await db.collection('users').doc(req.user.uid).delete();
    await admin.auth().deleteUser(req.user.uid);
    logger.info(`Account deleted: ${req.user.uid}`);
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
