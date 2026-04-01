// services/emailService.js — SendGrid email notifications
const sgMail = require('@sendgrid/mail');
const logger = require('../config/logger');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM = process.env.EMAIL_FROM || 'noreply@citiconnect.et';

// ── Template builders ──────────────────────────────────────

const issueReportedTemplate = (issue, reporterName) => ({
  subject: `[CitiConnect] New issue reported: ${issue.title}`,
  html: `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#f9f9f9;border-radius:12px;overflow:hidden">
      <div style="background:#00C97B;padding:24px;text-align:center">
        <h1 style="color:#0A0D09;margin:0;font-size:22px">CitiConnect</h1>
        <p style="color:#0A0D09;margin:4px 0 0;opacity:.7;font-size:13px">Addis Ababa Smart City Portal</p>
      </div>
      <div style="padding:28px 32px;background:#fff">
        <h2 style="color:#111;margin-top:0">New issue reported</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:8px 0;color:#666;width:120px">Title</td><td style="padding:8px 0;font-weight:600">${issue.title}</td></tr>
          <tr><td style="padding:8px 0;color:#666">Category</td><td style="padding:8px 0">${issue.category}</td></tr>
          <tr><td style="padding:8px 0;color:#666">Location</td><td style="padding:8px 0">${issue.location}</td></tr>
          <tr><td style="padding:8px 0;color:#666">Reported by</td><td style="padding:8px 0">${reporterName}</td></tr>
          <tr><td style="padding:8px 0;color:#666">Status</td><td style="padding:8px 0"><span style="background:#FFE4E4;color:#CC0000;padding:2px 8px;border-radius:20px;font-size:12px">Open</span></td></tr>
        </table>
        <p style="color:#555;margin-top:16px;font-size:14px">${issue.description || ''}</p>
        <div style="text-align:center;margin-top:24px">
          <a href="${process.env.CLIENT_URL}/issues/${issue.id}" style="background:#00C97B;color:#0A0D09;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">View on map</a>
        </div>
      </div>
      <div style="padding:16px 32px;background:#f9f9f9;font-size:12px;color:#999;text-align:center">
        CitiConnect · Addis Ababa, Ethiopia · <a href="${process.env.CLIENT_URL}/unsubscribe" style="color:#999">Unsubscribe</a>
      </div>
    </div>`,
});

const issueStatusChangedTemplate = (issue, newStatus, userEmail) => ({
  subject: `[CitiConnect] Update on your report: ${issue.title}`,
  html: `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <div style="background:#00C97B;padding:20px;text-align:center;border-radius:12px 12px 0 0">
        <h1 style="color:#0A0D09;margin:0;font-size:20px">Issue Update</h1>
      </div>
      <div style="padding:28px;background:#fff">
        <p>Your reported issue <strong>"${issue.title}"</strong> has been updated.</p>
        <p><strong>New status:</strong> <span style="background:#E8F9F1;color:#006644;padding:3px 10px;border-radius:20px">${newStatus}</span></p>
        <a href="${process.env.CLIENT_URL}/issues/${issue.id}" style="display:inline-block;margin-top:16px;background:#00C97B;color:#0A0D09;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:700">View issue</a>
      </div>
    </div>`,
});

const communityConnectionTemplate = (poster, connector) => ({
  subject: `[CitiConnect] ${connector.name} wants to connect with you`,
  html: `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <div style="background:#00C97B;padding:20px;text-align:center;border-radius:12px 12px 0 0">
        <h1 style="color:#0A0D09;margin:0;font-size:20px">New connection request</h1>
      </div>
      <div style="padding:28px;background:#fff">
        <p><strong>${connector.name}</strong> (${connector.email}) saw your community post and wants to connect.</p>
        <p>Log in to CitiConnect to view their profile and respond.</p>
        <a href="${process.env.CLIENT_URL}/community" style="display:inline-block;margin-top:16px;background:#00C97B;color:#0A0D09;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:700">Respond</a>
      </div>
    </div>`,
});

const securityAlertTemplate = (alert) => ({
  subject: `⚠️ [CitiConnect Security] ${alert.type} detected`,
  html: `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;border:2px solid #FF4D4D;border-radius:12px;overflow:hidden">
      <div style="background:#FF4D4D;padding:20px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:20px">⚠ Security Alert</h1>
      </div>
      <div style="padding:28px;background:#fff">
        <h3 style="color:#CC0000">Alert type: ${alert.type}</h3>
        <table style="width:100%;font-size:14px;border-collapse:collapse">
          <tr><td style="padding:6px 0;color:#666;width:120px">IP Address</td><td style="font-family:monospace">${alert.ip}</td></tr>
          <tr><td style="padding:6px 0;color:#666">Endpoint</td><td style="font-family:monospace">${alert.endpoint}</td></tr>
          <tr><td style="padding:6px 0;color:#666">Attempts</td><td style="font-weight:700;color:#CC0000">${alert.attempts}</td></tr>
          <tr><td style="padding:6px 0;color:#666">Time</td><td>${new Date().toISOString()}</td></tr>
          ${alert.payload ? `<tr><td style="padding:6px 0;color:#666">Payload</td><td style="font-family:monospace;font-size:12px;word-break:break-all">${alert.payload}</td></tr>` : ''}
        </table>
        <p style="margin-top:16px;font-size:13px;color:#555">Take immediate action in the <a href="${process.env.CLIENT_URL}/admin/security">admin security dashboard</a>.</p>
      </div>
    </div>`,
});

const dailyDigestTemplate = (stats) => ({
  subject: `[CitiConnect] Daily city report — ${new Date().toLocaleDateString('en-ET')}`,
  html: `
    <div style="font-family:sans-serif;max-width:600px;margin:auto">
      <div style="background:#00C97B;padding:20px;text-align:center;border-radius:12px 12px 0 0">
        <h1 style="color:#0A0D09;margin:0">Daily City Digest</h1>
        <p style="color:#0A0D09;opacity:.7;margin:4px 0 0;font-size:13px">${new Date().toDateString()}</p>
      </div>
      <div style="padding:28px;background:#fff">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
          ${[
            { label: 'New reports', value: stats.newReports, color: '#3B9EFF' },
            { label: 'Resolved today', value: stats.resolved, color: '#00C97B' },
            { label: 'Active citizens', value: stats.activeUsers, color: '#8B5CF6' },
            { label: 'Open issues', value: stats.openIssues, color: '#FF4D4D' },
          ].map(s => `
            <div style="text-align:center;padding:16px;background:#f9f9f9;border-radius:10px">
              <div style="font-size:28px;font-weight:700;color:${s.color}">${s.value}</div>
              <div style="font-size:12px;color:#888;margin-top:4px">${s.label}</div>
            </div>`).join('')}
        </div>
        <a href="${process.env.CLIENT_URL}/analytics" style="display:block;text-align:center;background:#00C97B;color:#0A0D09;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">View full analytics</a>
      </div>
    </div>`,
});

// ── Send functions ─────────────────────────────────────────

/**
 * Generic send function — wraps SendGrid with error logging.
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    await sgMail.send({ to, from: FROM, subject, html });
    logger.info(`Email sent to ${to}: ${subject}`);
    return { success: true };
  } catch (err) {
    logger.error(`Email failed to ${to}: ${err.message}`);
    return { success: false, error: err.message };
  }
};

const notifyIssueReported = async (issue, reporterName, recipientEmail) => {
  const tmpl = issueReportedTemplate(issue, reporterName);
  return sendEmail({ to: recipientEmail, ...tmpl });
};

const notifyIssueStatusChanged = async (issue, newStatus, userEmail) => {
  const tmpl = issueStatusChangedTemplate(issue, newStatus, userEmail);
  return sendEmail({ to: userEmail, ...tmpl });
};

const notifyCommunityConnection = async (poster, connector) => {
  const tmpl = communityConnectionTemplate(poster, connector);
  return sendEmail({ to: poster.email, ...tmpl });
};

const sendAdminSecurityAlert = async (alert) => {
  const tmpl = securityAlertTemplate(alert);
  return sendEmail({ to: process.env.ADMIN_EMAIL, ...tmpl });
};

const sendDailyDigest = async (subscriberEmails, stats) => {
  const tmpl = dailyDigestTemplate(stats);
  // Send in batches to avoid rate limits
  const BATCH_SIZE = 100;
  for (let i = 0; i < subscriberEmails.length; i += BATCH_SIZE) {
    const batch = subscriberEmails.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(batch.map(email => sendEmail({ to: email, ...tmpl })));
  }
};

module.exports = {
  sendEmail,
  notifyIssueReported,
  notifyIssueStatusChanged,
  notifyCommunityConnection,
  sendAdminSecurityAlert,
  sendDailyDigest,
};
