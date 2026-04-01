// services/securityService.js — Threat detection, logging, and alerting
const { db } = require('../config/firebase');
const { sendAdminSecurityAlert } = require('./emailService');
const { sendSecuritySMS } = require('./smsService');
const logger = require('../config/logger');

/**
 * Log a security event to Firestore audit log and alert admins.
 * Called by rate limiter, security middleware, and auth middleware.
 */
const sendSecurityAlert = async ({ type, ip, endpoint, attempts, payload }) => {
  const event = {
    type,          // e.g. 'BRUTE_FORCE', 'INJECTION_ATTEMPT', 'UNAUTHORIZED_ACCESS'
    ip,
    endpoint,
    attempts: attempts || 1,
    payload: payload || null,
    timestamp: new Date().toISOString(),
    resolved: false,
  };

  try {
    // Persist to Firestore audit log
    await db.collection('security_events').add(event);
    logger.warn(`Security event logged: ${type} from ${ip}`);

    // Email admin
    await sendAdminSecurityAlert(event);

    // SMS admin for high-severity events
    if (['BRUTE_FORCE', 'INJECTION_ATTEMPT'].includes(type)) {
      await sendSecuritySMS(event);
    }
  } catch (err) {
    logger.error(`Failed to process security alert: ${err.message}`);
  }
};

/**
 * Get all security events (for admin dashboard).
 * @param {number} limit  — max results to return
 */
const getSecurityEvents = async (limit = 50) => {
  const snap = await db
    .collection('security_events')
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

/**
 * Mark a security event as resolved.
 */
const resolveSecurityEvent = async (eventId, resolvedBy) => {
  await db.collection('security_events').doc(eventId).update({
    resolved: true,
    resolvedBy,
    resolvedAt: new Date().toISOString(),
  });
};

/**
 * Get summary stats for admin security dashboard.
 */
const getSecurityStats = async () => {
  const snap = await db.collection('security_events').get();
  const events = snap.docs.map(d => d.data());
  return {
    total: events.length,
    unresolved: events.filter(e => !e.resolved).length,
    byType: events.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {}),
    last24h: events.filter(e =>
      new Date(e.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length,
  };
};

module.exports = {
  sendSecurityAlert,
  getSecurityEvents,
  resolveSecurityEvent,
  getSecurityStats,
};
