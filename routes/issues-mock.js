// routes/issues-mock.js — Mock city issue CRUD for development
const express = require('express');
const { body, validationResult } = require('express-validator');
const logger = require('../config/logger');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

// Mock data store
let mockIssues = [
  {
    id: '1',
    title: 'Broken water pipe',
    category: 'water',
    description: 'Water pipe burst on main street',
    location: 'Bole Road',
    lat: 9.0,
    lng: 38.7,
    status: 'pending',
    createdAt: new Date().toISOString(),
    reportedBy: 'citizen@example.com'
  },
  {
    id: '2',
    title: 'Street light outage',
    category: 'infrastructure',
    description: 'Multiple street lights not working',
    location: 'Mekane Yesus',
    lat: 9.0,
    lng: 38.7,
    status: 'resolved',
    createdAt: new Date().toISOString(),
    reportedBy: 'citizen2@example.com'
  }
];

// ── GET /api/issues ────────────────────────────────────
router.get('/', (req, res) => {
  const { category, status } = req.query;
  let filteredIssues = mockIssues;
  
  if (category) {
    filteredIssues = filteredIssues.filter(issue => issue.category === category);
  }
  if (status) {
    filteredIssues = filteredIssues.filter(issue => issue.status === status);
  }
  
  res.json(filteredIssues);
});

// ── GET /api/issues/:id ────────────────────────────────
router.get('/:id', (req, res) => {
  const issue = mockIssues.find(i => i.id === req.params.id);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }
  res.json(issue);
});

// ── POST /api/issues ────────────────────────────────────
router.post('/', [
  body('title').trim().isLength({ min: 5, max: 120 }),
  body('category').isIn(['water', 'waste', 'road', 'power', 'infrastructure']),
  body('location').trim().isLength({ min: 2, max: 200 }),
  body('description').trim().isLength({ min: 10, max: 2000 }),
], validate, (req, res) => {
  const newIssue = {
    id: (mockIssues.length + 1).toString(),
    ...req.body,
    status: 'pending',
    createdAt: new Date().toISOString(),
    reportedBy: req.user?.email || 'anonymous@example.com'
  };
  
  mockIssues.push(newIssue);
  logger.info(`New issue created: ${newIssue.title}`);
  
  res.status(201).json(newIssue);
});

// ── PATCH /api/issues/:id/status ───────────────────────
router.patch('/:id/status', [
  body('status').isIn(['pending', 'in-progress', 'resolved'])
], validate, (req, res) => {
  const issue = mockIssues.find(i => i.id === req.params.id);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }
  
  issue.status = req.body.status;
  logger.info(`Issue ${req.params.id} status updated to ${req.body.status}`);
  
  res.json(issue);
});

module.exports = router;
