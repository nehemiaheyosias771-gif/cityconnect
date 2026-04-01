// routes/admin-mock.js — Mock admin dashboard for development
const express = require('express');
const logger = require('../config/logger');

const router = express.Router();

// Mock middleware to check admin role
router.use((req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
});

// Mock security events
const mockSecurityEvents = [
  {
    id: '1',
    type: 'BRUTE_FORCE',
    ip: '192.168.1.100',
    timestamp: new Date().toISOString(),
    resolved: false
  },
  {
    id: '2',
    type: 'RATE_LIMIT',
    ip: '192.168.1.101',
    timestamp: new Date().toISOString(),
    resolved: true
  }
];

// ── GET /api/admin/security/events ───────────────────
router.get('/security/events', (req, res) => {
  res.json(mockSecurityEvents);
});

// ── GET /api/admin/analytics ──────────────────────────
router.get('/analytics', (req, res) => {
  const mockAnalytics = {
    totalUsers: 2847,
    activeIssues: 23,
    resolvedIssues: 142,
    responseTime: '2.4h',
    systemHealth: 98
  };
  res.json(mockAnalytics);
});

// ── POST /api/admin/broadcast ───────────────────────────
router.post('/broadcast', [
  express.json()
], (req, res) => {
  const { message, urgency } = req.body;
  
  logger.info(`Admin broadcast: ${message} (urgency: ${urgency})`);
  
  res.json({
    message: 'Broadcast sent successfully',
    recipients: 'all_users',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
