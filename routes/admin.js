// routes/admin.js — Admin dashboard: security events, analytics, broadcasts
const express = require('express');
const { db } = require('../config/firebase');
const { requireRole } = require('../middleware/auth');
const { getSecurityEvents, getSecurityStats, resolveSecurityEvent } = require('../services/securityService');
const { sendDailyDigest } = require('../services/emailService');
const { broadcastUrgentAlert } = require('../services/smsService');
const logger = require('../config/logger');

const router = express.Router();

// All admin routes require 'admin' role
router.use(requireRole('admin'));

// GET /api/admin/security/events
router.get('/security/events', async (req, res, next) => {
  try {
    const events = await getSecurityEvents(100);
    res.json(events);
  } catch (err) { next(err); }
});

// GET /api/admin/security/stats
router.get('/security/stats', async (req, res, next) => {
  try {
    const stats = await getSecurityStats();
    res.json(stats);
  } catch (err) { next(err); }
});

// PATCH /api/admin/security/events/:id/resolve
router.patch('/security/events/:id/resolve', async (req, res, next) => {
  try {
    await resolveSecurityEvent(req.params.id, req.user.uid);
    res.json({ resolved: true });
  } catch (err) { next(err); }
});

// GET /api/admin/analytics — platform-wide stats
router.get('/analytics', async (req, res, next) => {
  try {
    const [issuesSnap, usersSnap, postsSnap] = await Promise.all([
      db.collection('issues').get(),
      db.collection('users').get(),
      db.collection('community_posts').get(),
    ]);
    const issues = issuesSnap.docs.map(d => d.data());
    const today = new Date().toDateString();
    res.json({
      totalIssues: issues.length,
      openIssues: issues.filter(i => i.status === 'open').length,
      resolvedIssues: issues.filter(i => i.status === 'resolved').length,
      totalUsers: usersSnap.size,
      totalPosts: postsSnap.size,
      issuesByCategory: issues.reduce((a, i) => { a[i.category] = (a[i.category] || 0) + 1; return a; }, {}),
      newReportsToday: issues.filter(i => new Date(i.createdAt).toDateString() === today).length,
    });
  } catch (err) { next(err); }
});

// POST /api/admin/broadcast/sms — urgent SMS broadcast
router.post('/broadcast/sms', async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });
    const usersSnap = await db.collection('users').where('notifySMS', '==', true).get();
    const phones = usersSnap.docs.map(d => d.data().phone).filter(Boolean);
    const result = await broadcastUrgentAlert(phones, message);
    logger.info(`Admin SMS broadcast by ${req.user.uid}: "${message}" → ${result.sent} sent`);
    res.json(result);
  } catch (err) { next(err); }
});

// POST /api/admin/broadcast/email — daily digest trigger
router.post('/broadcast/email/digest', async (req, res, next) => {
  try {
    const usersSnap = await db.collection('users').where('notifyEmail', '==', true).get();
    const emails = usersSnap.docs.map(d => d.data().email).filter(Boolean);
    const issuesSnap = await db.collection('issues').get();
    const issues = issuesSnap.docs.map(d => d.data());
    const today = new Date().toDateString();
    const stats = {
      newReports: issues.filter(i => new Date(i.createdAt).toDateString() === today).length,
      resolved: issues.filter(i => i.status === 'resolved' && new Date(i.updatedAt).toDateString() === today).length,
      activeUsers: usersSnap.size,
      openIssues: issues.filter(i => i.status === 'open').length,
    };
    await sendDailyDigest(emails, stats);
    res.json({ sent: emails.length, stats });
  } catch (err) { next(err); }
});

module.exports = router;


// ─────────────────────────────────────────────────────────────
// routes/chat.js — Chat message history (REST fallback for Socket.io)
// ─────────────────────────────────────────────────────────────
const chatRouter = express.Router();
const chatDb = require('../config/firebase').db;

// GET /api/chat/:room/messages — load recent messages
chatRouter.get('/:room/messages', async (req, res, next) => {
  try {
    const { room } = req.params;
    const { limit = 50 } = req.query;
    const allowed = ['general', 'bole', 'kirkos', 'yeka', 'alerts'];
    if (!allowed.includes(room)) return res.status(400).json({ error: 'Invalid room' });

    const snap = await chatDb
      .collection('chat_messages').doc(room)
      .collection('messages')
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit))
      .get();

    const messages = snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse();
    res.json(messages);
  } catch (err) { next(err); }
});

module.exports = { adminRouter: router, chatRouter };
