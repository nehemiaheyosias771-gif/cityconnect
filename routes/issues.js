// routes/issues.js — City issue CRUD + notifications
const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { db } = require('../config/firebase');
const { requireRole, requireEmailVerified } = require('../middleware/auth');
const { notifyIssueReported, notifyIssueStatusChanged } = require('../services/emailService');
const { notifyIssueUpdate } = require('../services/smsService');
const logger = require('../config/logger');

const router = express.Router();

// ── Validation rules ───────────────────────────────────────
const issueValidation = [
  body('title').trim().isLength({ min: 5, max: 120 }).withMessage('Title must be 5–120 characters'),
  body('category').isIn(['water', 'waste', 'road', 'power', 'infrastructure']).withMessage('Invalid category'),
  body('location').trim().isLength({ min: 2, max: 200 }).withMessage('Location required'),
  body('description').trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be 10–2000 characters'),
  body('lat').isFloat({ min: 8.7, max: 9.3 }).withMessage('Invalid latitude for Addis Ababa'),
  body('lng').isFloat({ min: 38.5, max: 39.0 }).withMessage('Invalid longitude for Addis Ababa'),
  body('notifyEmail').optional().isBoolean(),
  body('notifySMS').optional().isBoolean(),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// ── GET /api/issues — list all issues ─────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { category, status, area, limit = 50, offset = 0 } = req.query;
    let q = db.collection('issues').orderBy('createdAt', 'desc');

    if (category) q = q.where('category', '==', category);
    if (status) q = q.where('status', '==', status);
    if (area) q = q.where('area', '==', area);

    q = q.limit(parseInt(limit)).offset(parseInt(offset));

    const snap = await q.get();
    const issues = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ issues, count: issues.length });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/issues/:id — single issue ────────────────────
router.get('/:id', param('id').isString(), async (req, res, next) => {
  try {
    const doc = await db.collection('issues').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Issue not found' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/issues — create issue ───────────────────────
router.post('/', requireEmailVerified, issueValidation, validate, async (req, res, next) => {
  try {
    const { title, category, location, description, lat, lng, notifyEmail, notifySMS } = req.body;

    const issue = {
      title,
      category,
      location,
      description,
      lat,
      lng,
      status: 'open',
      votes: 0,
      voterIds: [],
      commentCount: 0,
      reportedBy: req.user.uid,
      reporterEmail: req.user.email,
      reporterName: req.user.name || req.user.email?.split('@')[0],
      notifyEmail: notifyEmail !== false,
      notifySMS: notifySMS === true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const ref = await db.collection('issues').add(issue);
    const created = { id: ref.id, ...issue };

    // Real-time broadcast via Socket.io
    req.app.get('io')?.emit('issue_created', created);

    // Email notification
    if (issue.notifyEmail) {
      notifyIssueReported(created, issue.reporterName, issue.reporterEmail)
        .catch(e => logger.error('Issue email failed:', e));
      // Also notify city authority
      notifyIssueReported(created, issue.reporterName, process.env.ADMIN_EMAIL)
        .catch(e => logger.error('Admin issue email failed:', e));
    }

    logger.info(`Issue created: ${ref.id} by ${req.user.uid}`);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/issues/:id/status — update status ──────────
router.patch(
  '/:id/status',
  requireRole('authority', 'admin'),
  body('status').isIn(['open', 'progress', 'resolved']),
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const ref = db.collection('issues').doc(id);
      const doc = await ref.get();
      if (!doc.exists) return res.status(404).json({ error: 'Issue not found' });

      const issue = doc.data();
      await ref.update({ status, updatedAt: new Date().toISOString() });

      // Real-time broadcast
      req.app.get('io')?.emit('issue_updated', { id, status });

      // Notify original reporter
      if (issue.notifyEmail && issue.reporterEmail) {
        notifyIssueStatusChanged({ ...issue, id }, status, issue.reporterEmail)
          .catch(e => logger.error('Status email failed:', e));
      }
      if (issue.notifySMS && issue.reporterPhone) {
        notifyIssueUpdate(issue.reporterPhone, { ...issue, id }, status)
          .catch(e => logger.error('Status SMS failed:', e));
      }

      res.json({ id, status, updated: true });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/issues/:id/vote — upvote ────────────────────
router.post('/:id/vote', async (req, res, next) => {
  try {
    const { id } = req.params;
    const uid = req.user.uid;
    const ref = db.collection('issues').doc(id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: 'Issue not found' });

    const data = doc.data();
    const hasVoted = data.voterIds?.includes(uid);

    await ref.update({
      votes: data.votes + (hasVoted ? -1 : 1),
      voterIds: hasVoted
        ? data.voterIds.filter(v => v !== uid)
        : [...(data.voterIds || []), uid],
    });

    req.app.get('io')?.emit('vote_update', { id, votes: data.votes + (hasVoted ? -1 : 1) });
    res.json({ voted: !hasVoted, votes: data.votes + (hasVoted ? -1 : 1) });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/issues/:id/comments ──────────────────────────
router.get('/:id/comments', async (req, res, next) => {
  try {
    const snap = await db
      .collection('issues').doc(req.params.id)
      .collection('comments')
      .orderBy('createdAt', 'asc')
      .limit(100)
      .get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (err) {
    next(err);
  }
});

// ── POST /api/issues/:id/comments ─────────────────────────
router.post(
  '/:id/comments',
  body('text').trim().isLength({ min: 1, max: 500 }),
  validate,
  async (req, res, next) => {
    try {
      const comment = {
        text: req.body.text,
        userId: req.user.uid,
        name: req.user.name || req.user.email?.split('@')[0],
        createdAt: new Date().toISOString(),
      };

      const ref = await db
        .collection('issues').doc(req.params.id)
        .collection('comments')
        .add(comment);

      // Increment comment count
      await db.collection('issues').doc(req.params.id)
        .update({ commentCount: db.FieldValue.increment(1) });

      // Real-time broadcast
      req.app.get('io')?.to(`issue_${req.params.id}`).emit('new_comment', { id: ref.id, issueId: req.params.id, ...comment });

      res.status(201).json({ id: ref.id, ...comment });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
