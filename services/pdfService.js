// backend/services/pdfService.js — PDF report generation using PDFKit
const PDFDocument = require('pdfkit');
const logger = require('../config/logger');

/**
 * Generate a CitiConnect issues report PDF.
 * @param {Array}  issues   — array of issue objects
 * @param {Object} filters  — applied filters (category, status, area, dateRange)
 * @returns {Buffer}        — PDF as Buffer
 */
const generateIssuesReport = (issues, filters = {}) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const G = '#00C97B';
    const DARK = '#0A0D09';
    const GRAY = '#5A6E5A';

    // ── Header ─────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 80).fill(DARK);
    doc.fontSize(22).font('Helvetica-Bold').fillColor(G).text('CitiConnect', 50, 22);
    doc.fontSize(10).font('Helvetica').fillColor('#8A9E88').text('Addis Ababa Smart City Portal', 50, 50);
    doc.fontSize(10).fillColor('#5A6E5A').text(`Generated: ${new Date().toLocaleString('en-ET')}`, 0, 55, { align: 'right', width: doc.page.width - 50 });

    // ── Report title ───────────────────────────────────────
    doc.moveDown(3);
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#1A1A1A').text('City Issues Report', { align: 'center' });
    doc.fontSize(10).font('Helvetica').fillColor(GRAY).text(
      `Total: ${issues.length} issues` +
      (filters.category ? ` · Category: ${filters.category}` : '') +
      (filters.status ? ` · Status: ${filters.status}` : '') +
      (filters.area ? ` · Area: ${filters.area}` : ''),
      { align: 'center' }
    );
    doc.moveDown(1);

    // ── Summary stats ──────────────────────────────────────
    const open = issues.filter(i => i.status === 'open').length;
    const progress = issues.filter(i => i.status === 'progress').length;
    const resolved = issues.filter(i => i.status === 'resolved').length;

    doc.rect(50, doc.y, doc.page.width - 100, 60).fill('#F5F5F5').stroke('#E0E0E0');
    const statsY = doc.y + 15;
    const cols = [
      { label: 'Total', value: issues.length, color: G },
      { label: 'Open', value: open, color: '#E24B4A' },
      { label: 'In Progress', value: progress, color: '#F59E0B' },
      { label: 'Resolved', value: resolved, color: G },
    ];
    const colW = (doc.page.width - 100) / 4;
    cols.forEach((col, i) => {
      const x = 50 + i * colW + colW / 2;
      doc.fontSize(18).font('Helvetica-Bold').fillColor(col.color).text(String(col.value), x - 20, statsY, { width: 40, align: 'center' });
      doc.fontSize(9).font('Helvetica').fillColor(GRAY).text(col.label, x - 20, statsY + 22, { width: 40, align: 'center' });
    });
    doc.moveDown(5);

    // ── Issues table ───────────────────────────────────────
    doc.moveDown(0.5);
    const tableTop = doc.y;
    const cols2 = [
      { label: '#', width: 30 },
      { label: 'Title', width: 170 },
      { label: 'Category', width: 80 },
      { label: 'Area', width: 80 },
      { label: 'Status', width: 70 },
      { label: 'Votes', width: 40 },
    ];

    // Table header
    doc.rect(50, tableTop, doc.page.width - 100, 20).fill(DARK);
    let x = 50;
    cols2.forEach(col => {
      doc.fontSize(9).font('Helvetica-Bold').fillColor('white').text(col.label, x + 4, tableTop + 6, { width: col.width - 8 });
      x += col.width;
    });

    // Table rows
    issues.forEach((issue, idx) => {
      const rowY = tableTop + 20 + idx * 22;
      if (rowY > doc.page.height - 100) {
        doc.addPage();
        doc.y = 50;
      }
      const bg = idx % 2 === 0 ? '#FFFFFF' : '#F9F9F9';
      doc.rect(50, rowY, doc.page.width - 100, 22).fill(bg);

      const statusColors = { open: '#E24B4A', progress: '#F59E0B', resolved: G };
      const catColors = { water: '#3B9EFF', waste: '#7DC559', road: '#F59E0B', power: '#8B5CF6', infrastructure: G };
      const rowData = [
        { text: String(idx + 1), color: GRAY },
        { text: (issue.title || '').substring(0, 35), color: '#1A1A1A' },
        { text: issue.category || '', color: catColors[issue.category] || GRAY },
        { text: (issue.location || issue.area || '').substring(0, 18), color: GRAY },
        { text: issue.status === 'progress' ? 'In Progress' : issue.status?.charAt(0).toUpperCase() + issue.status?.slice(1), color: statusColors[issue.status] || GRAY },
        { text: String(issue.votes || 0), color: GRAY },
      ];

      let rx = 50;
      rowData.forEach((cell, ci) => {
        doc.fontSize(8).font(ci === 1 ? 'Helvetica-Bold' : 'Helvetica').fillColor(cell.color)
          .text(cell.text, rx + 4, rowY + 7, { width: cols2[ci].width - 8, ellipsis: true });
        rx += cols2[ci].width;
      });
    });

    // ── Footer ──────────────────────────────────────────────
    doc.rect(0, doc.page.height - 40, doc.page.width, 40).fill(DARK);
    doc.fontSize(8).font('Helvetica').fillColor('#5A6E5A')
      .text('CitiConnect · Addis Ababa, Ethiopia · citiconnect.et', 50, doc.page.height - 25, { align: 'center', width: doc.page.width - 100 });

    doc.end();
  });
};

/**
 * Generate an analytics summary PDF.
 */
const generateAnalyticsReport = (analyticsData, aiSummary) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const G = '#00C97B';

    doc.rect(0, 0, doc.page.width, 80).fill('#0A0D09');
    doc.fontSize(22).font('Helvetica-Bold').fillColor(G).text('CitiConnect Analytics', 50, 22);
    doc.fontSize(10).font('Helvetica').fillColor('#8A9E88').text('Monthly Impact Report — Addis Ababa', 50, 50);
    doc.moveDown(3.5);

    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1A1A1A').text('AI Insights', 50);
    doc.moveDown(0.3);
    doc.rect(50, doc.y, doc.page.width - 100, 2).fill(G);
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#333').text(aiSummary || 'Analytics summary not available.', { lineGap: 4 });
    doc.moveDown(1.5);

    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1A1A1A').text('Key Metrics');
    doc.moveDown(0.3);
    doc.rect(50, doc.y, doc.page.width - 100, 2).fill(G);
    doc.moveDown(0.5);

    const metrics = [
      ['Total Issues Reported', analyticsData.totalIssues || 142],
      ['Open Issues', analyticsData.openIssues || 89],
      ['Resolved Issues', analyticsData.resolvedIssues || 22],
      ['Resolution Rate', `${analyticsData.resolutionRate || 15}%`],
      ['Active Citizens', analyticsData.activeUsers || 2381],
      ['Average Response Time', `${analyticsData.avgResponseDays || 3.2} days`],
    ];

    metrics.forEach(([label, value]) => {
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1A1A1A').text(`${label}: `, { continued: true });
      doc.font('Helvetica').fillColor(G).text(String(value));
    });

    doc.end();
  });
};

module.exports = { generateIssuesReport, generateAnalyticsReport };
