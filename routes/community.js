// routes/community.js — Community help board
const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/firebase');
const { notifyCommunityConnection } = require('../services/emailService');
const { notifyConnection } = require('../services/smsService');
const logger = require('../config/logger');

const router = express.Router();
const validate = (req, res, next) => {
  const e = validationResult(req);
  if (!e.isEmpty()) return res.status(400).json({ errors: e.array() });
  next();
};

// GET /api/community — list posts
router.get('/', async (req, res, next) => {
  try {
    const { type, category, limit = 30 } = req.query;
    let q = db.collection('community_posts').orderBy('createdAt', 'desc').limit(parseInt(limit));
    if (type) q = q.where('type', '==', type);
    if (category) q = q.where('category', '==', category);
    const snap = await q.get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (err) { next(err); }
});

// POST /api/community — create post
router.post('/',
  [
    body('title').trim().isLength({ min: 5, max: 150 }),
    body('type').isIn(['seeking', 'offering', 'event']),
    body('description').trim().isLength({ min: 10, max: 1000 }),
    body('category').trim().isLength({ min: 2, max: 50 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { title, type, description, category, notifyEmail, notifySMS } = req.body;
      const post = {
        title, type, description, category,
        userId: req.user.uid,
        userName: req.user.name || req.user.email?.split('@')[0],
        userEmail: req.user.email,
        notifyEmail: notifyEmail !== false,
        notifySMS: notifySMS === true,
        connectionCount: 0,
        createdAt: new Date().toISOString(),
      };
      const ref = await db.collection('community_posts').add(post);
      res.status(201).json({ id: ref.id, ...post });
    } catch (err) { next(err); }
  }
);

// POST /api/community/:id/connect — connect with poster
router.post('/:id/connect', async (req, res, next) => {
  try {
    const doc = await db.collection('community_posts').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Post not found' });
    const post = doc.data();

    // Don't connect with yourself
    if (post.userId === req.user.uid) {
      return res.status(400).json({ error: 'Cannot connect with your own post' });
    }

    // Record connection
    await db.collection('community_posts').doc(req.params.id)
      .collection('connections')
      .doc(req.user.uid)
      .set({ uid: req.user.uid, name: req.user.name, email: req.user.email, connectedAt: new Date().toISOString() });

    // Notify poster
    const poster = { email: post.userEmail, phone: post.userPhone };
    const connector = { name: req.user.name || 'Someone', email: req.user.email };

    if (post.notifyEmail) notifyCommunityConnection(poster, connector).catch(logger.error);
    if (post.notifySMS && post.userPhone) notifyConnection(post.userPhone, connector.name).catch(logger.error);

    res.json({ connected: true });
  } catch (err) { next(err); }
});

module.exports = router;
