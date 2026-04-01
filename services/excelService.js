// backend/services/excelService.js — Excel report export using ExcelJS
const ExcelJS = require('exceljs');
const logger = require('../config/logger');

const GREEN = '00C97B';
const DARK = '0A0D09';
const LIGHT_GREEN = 'E8F9F1';

/**
 * Export all issues to a formatted Excel workbook.
 * Includes: Issues sheet, Analytics sheet, Category breakdown chart data.
 */
const exportIssuesToExcel = async (issues, analyticsData = {}) => {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = 'CitiConnect';
  workbook.lastModifiedBy = 'CitiConnect';
  workbook.created = new Date();
  workbook.modified = new Date();

  // ── Sheet 1: Issues ─────────────────────────────────────
  const sheet1 = workbook.addWorksheet('Issues', {
    headerFooter: { firstHeader: 'CitiConnect — City Issues Report' },
  });

  // Title row
  sheet1.mergeCells('A1:H1');
  sheet1.getCell('A1').value = 'CitiConnect — City Issues Report';
  sheet1.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FF' + GREEN } };
  sheet1.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + DARK } };
  sheet1.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet1.getRow(1).height = 36;

  sheet1.mergeCells('A2:H2');
  sheet1.getCell('A2').value = `Generated: ${new Date().toLocaleString('en-ET')} · Total issues: ${issues.length}`;
  sheet1.getCell('A2').font = { size: 10, color: { argb: 'FF8A9E88' } };
  sheet1.getCell('A2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF131810' } };
  sheet1.getCell('A2').alignment = { horizontal: 'center' };
  sheet1.getRow(2).height = 20;

  // Column headers
  const headers = ['#', 'Title', 'Category', 'Location', 'Status', 'Votes', 'Reported By', 'Date'];
  const colWidths = [6, 40, 14, 22, 14, 8, 24, 20];

  headers.forEach((h, i) => {
    const cell = sheet1.getCell(3, i + 1);
    cell.value = h;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + DARK } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = { bottom: { style: 'medium', color: { argb: 'FF' + GREEN } } };
    sheet1.getColumn(i + 1).width = colWidths[i];
  });
  sheet1.getRow(3).height = 24;

  // Status colors
  const statusColors = { open: 'FFFFE4E4', progress: 'FFFFF9E0', resolved: 'FF' + LIGHT_GREEN };
  const catColors = { water: 'FFE6F1FB', waste: 'FFEAF3DE', road: 'FFFAEEDA', power: 'FFEEEDFE', infrastructure: 'FFE1F5EE' };

  // Data rows
  issues.forEach((issue, idx) => {
    const row = sheet1.addRow([
      idx + 1,
      issue.title || '',
      issue.category || '',
      issue.location || issue.area || '',
      issue.status === 'progress' ? 'In Progress' : (issue.status?.charAt(0).toUpperCase() + issue.status?.slice(1)) || '',
      issue.votes || 0,
      issue.reporterName || issue.reportedBy || '',
      issue.createdAt ? new Date(issue.createdAt).toLocaleDateString('en-ET') : '',
    ]);

    const rowFill = statusColors[issue.status] || 'FFFFFFFF';
    row.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 0 ? 'FFFFFFFF' : 'FFF9F9F9' } };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } } };
      cell.font = { size: 10 };
      cell.alignment = { vertical: 'middle' };
    });

    // Color the status cell
    const statusCell = row.getCell(5);
    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowFill } };
    statusCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Color the category cell
    const catCell = row.getCell(3);
    catCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: catColors[issue.category] || 'FFFFFFFF' } };
    catCell.alignment = { horizontal: 'center', vertical: 'middle' };
    catCell.font = { bold: true, size: 10 };

    row.height = 20;
  });

  // Auto-filter
  sheet1.autoFilter = { from: 'A3', to: `H${3 + issues.length}` };

  // Freeze top rows
  sheet1.views = [{ state: 'frozen', ySplit: 3 }];

  // ── Sheet 2: Analytics ───────────────────────────────────
  const sheet2 = workbook.addWorksheet('Analytics');

  sheet2.mergeCells('A1:D1');
  sheet2.getCell('A1').value = 'CitiConnect Analytics Summary';
  sheet2.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF' + GREEN } };
  sheet2.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + DARK } };
  sheet2.getRow(1).height = 32;

  const analyticsRows = [
    ['Metric', 'Value', '', ''],
    ['Total Issues', issues.length],
    ['Open Issues', issues.filter(i => i.status === 'open').length],
    ['In Progress', issues.filter(i => i.status === 'progress').length],
    ['Resolved', issues.filter(i => i.status === 'resolved').length],
    ['Resolution Rate', `${Math.round(issues.filter(i => i.status === 'resolved').length / Math.max(issues.length, 1) * 100)}%`],
    ['', ''],
    ['Category Breakdown', ''],
    ...Object.entries(issues.reduce((a, i) => { a[i.category] = (a[i.category] || 0) + 1; return a; }, {}))
      .sort((a, b) => b[1] - a[1])
      .map(([cat, count]) => [cat.charAt(0).toUpperCase() + cat.slice(1), count]),
  ];

  analyticsRows.forEach((rowData, i) => {
    const row = sheet2.addRow(rowData);
    if (i === 0) {
      row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF333333' } };
    }
    if (i === 7) row.font = { bold: true };
    sheet2.getColumn(1).width = 28;
    sheet2.getColumn(2).width = 16;
  });

  // ── Sheet 3: Community ───────────────────────────────────
  const sheet3 = workbook.addWorksheet('Community Stats');
  sheet3.getCell('A1').value = 'Community Board Statistics';
  sheet3.getCell('A1').font = { bold: true, size: 13, color: { argb: 'FF' + GREEN } };
  sheet3.addRow(['Metric', 'Value']);
  const communityStats = [
    ['Active helpers', analyticsData.activeHelpers || 318],
    ['Total connections made', analyticsData.connections || 1042],
    ['Open community needs', analyticsData.openNeeds || 47],
    ['Events this month', analyticsData.events || 8],
    ['Report date', new Date().toLocaleDateString('en-ET')],
  ];
  communityStats.forEach(row => sheet3.addRow(row));
  sheet3.getColumn(1).width = 30;
  sheet3.getColumn(2).width = 16;

  const buffer = await workbook.xlsx.writeBuffer();
  logger.info(`Excel report generated: ${issues.length} issues`);
  return buffer;
};

module.exports = { exportIssuesToExcel };
