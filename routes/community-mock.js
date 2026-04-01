// routes/community-mock.js — Mock community board for development
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
let mockPosts = [
  {
    id: '1',
    title: 'Need help with grocery shopping',
    description: 'Elderly resident needs assistance with weekly grocery shopping',
    category: 'help-request',
    location: 'Bole District',
    author: 'John Doe',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Free tutoring available',
    description: 'Offering free math tutoring for high school students',
    category: 'offer',
    location: 'Mekane Yesus',
    author: 'Sarah M.',
    createdAt: new Date().toISOString()
  }
];

// ── GET /api/community ──────────────────────────────────
router.get('/', (req, res) => {
  const { category } = req.query;
  let filteredPosts = mockPosts;
  
  if (category) {
    filteredPosts = filteredPosts.filter(post => post.category === category);
  }
  
  res.json(filteredPosts);
});

// ── POST /api/community ─────────────────────────────────
router.post('/', [
  body('title').trim().isLength({ min: 5, max: 120 }),
  body('description').trim().isLength({ min: 10, max: 1000 }),
  body('category').isIn(['help-request', 'offer', 'announcement']),
  body('location').optional().trim().isLength({ max: 200 })
], validate, (req, res) => {
  const newPost = {
    id: (mockPosts.length + 1).toString(),
    ...req.body,
    author: req.user?.name || 'Anonymous',
    createdAt: new Date().toISOString()
  };
  
  mockPosts.push(newPost);
  logger.info(`New community post: ${newPost.title}`);
  
  res.status(201).json(newPost);
});

module.exports = router;
