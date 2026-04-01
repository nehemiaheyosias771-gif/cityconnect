// services/smsService.js — Twilio SMS notifications
const twilio = require('twilio');
const logger = require('../config/logger');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const FROM = process.env.TWILIO_PHONE_NUMBER;

/**
 * Core SMS send function.
 * @param {string} to   — recipient phone in E.164 format (+251...)
 * @param {string} body — message text (max 160 chars recommended)
 */
const sendSMS = async (to, body) => {
  // Enforce max length to avoid multi-part billing
  const truncated = body.substring(0, 160);
  try {
    const msg = await client.messages.create({ from: FROM, to, body: truncated });
    logger.info(`SMS sent to ${to}: SID ${msg.sid}`);
    return { success: true, sid: msg.sid };
  } catch (err) {
    logger.error(`SMS failed to ${to}: ${err.message}`);
    return { success: false, error: err.message };
  }
};

/**
 * Notify citizen when their reported issue status changes.
 */
const notifyIssueUpdate = async (phone, issue, newStatus) => {
  const body = `[CitiConnect] Your report "${issue.title.substring(0, 40)}" is now: ${newStatus}. Track it at citiconnect.et`;
  return sendSMS(phone, body);
};

/**
 * Alert admin of security threat via SMS.
 */
const sendSecuritySMS = async (alert) => {
  const body = `[CitiConnect SECURITY] ${alert.type} from ${alert.ip} — ${alert.attempts} attempt(s). Check admin panel immediately.`;
  return sendSMS(process.env.ADMIN_PHONE, body);
};

/**
 * Notify user of a new community connection.
 */
const notifyConnection = async (phone, connectorName) => {
  const body = `[CitiConnect] ${connectorName} wants to connect with you on the community board. Log in to respond.`;
  return sendSMS(phone, body);
};

/**
 * Broadcast urgent city alert to multiple citizens.
 * Used for critical issues (flooding, power outages, etc.)
 */
const broadcastUrgentAlert = async (phones, message) => {
  const body = `[CitiConnect ALERT] ${message}`;
  const results = await Promise.allSettled(phones.map(p => sendSMS(p, body)));
  const failed = results.filter(r => r.status === 'rejected').length;
  logger.info(`Broadcast sent to ${phones.length} numbers. Failed: ${failed}`);
  return { sent: phones.length - failed, failed };
};

module.exports = {
  sendSMS,
  notifyIssueUpdate,
  sendSecuritySMS,
  notifyConnection,
  broadcastUrgentAlert,
};
