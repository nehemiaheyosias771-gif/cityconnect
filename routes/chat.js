// routes/chat.js — Chat room endpoints
const express = require('express');
const router = express.Router();
const logger = require('../config/logger');

// Get chat rooms
router.get('/rooms', async (req, res) => {
  try {
    // Mock data for development
    const rooms = [
      { id: 'general', name: 'General Discussion', members: 15 },
      { id: 'issues', name: 'City Issues', members: 8 },
      { id: 'transport', name: 'Transport Updates', members: 12 }
    ];
    res.json(rooms);
  } catch (error) {
    logger.error('Error fetching chat rooms:', error);
    res.status(500).json({ error: 'Failed to fetch chat rooms' });
  }
});

// Get messages for a room
router.get('/messages/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    // Mock messages for development
    const messages = [
      {
        id: '1',
        userId: 'user1',
        name: 'John Doe',
        text: 'Welcome to the chat!',
        timestamp: new Date().toISOString()
      }
    ];
    res.json(messages);
  } catch (error) {
    logger.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

module.exports = router;
