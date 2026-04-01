// server.js — CitiConnect API entry point
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const logger = require('./config/logger');
const { verifyToken } = require('./middleware/auth-mock');
const { securityMiddleware } = require('./middleware/security');

// ── Route imports ──────────────────────────────────────────
const issuesRouter = require('./routes/issues-mock');
const communityRouter = require('./routes/community-mock');
const chatRouter = require('./routes/chat');
const adminRouter = require('./routes/admin-mock');
const authRouter = require('./routes/auth-mock'); // Use mock auth for development

const app = express();
const httpServer = http.createServer(app);

// ── Socket.io setup ────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Attach io to app so routes can emit events
app.set('io', io);

// ── Security middleware ────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
      fontSrc: ["'self'", 'fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', '*.openstreetmap.org', 'images.unsplash.com'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", 'wss:', 'ws:'],
    },
  },
}));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── General rate limiter ───────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded: ${req.ip}`);
    res.status(429).json({ error: 'Too many requests. Please try again later.' });
  },
});

// Strict limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 10,
  handler: async (req, res) => {
    logger.warn(`Auth brute-force attempt from IP: ${req.ip}`);
    // Trigger security alert
    const { sendSecurityAlert } = require('./services/securityService');
    await sendSecurityAlert({
      type: 'BRUTE_FORCE',
      ip: req.ip,
      endpoint: req.path,
      attempts: 10,
    });
    res.status(429).json({ error: 'Too many login attempts. Account temporarily locked.' });
  },
});

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);

// ── Body parsing + sanitization ───────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(mongoSanitize());    // Prevent NoSQL injection
app.use(hpp());              // Prevent HTTP parameter pollution
app.use(securityMiddleware); // Custom XSS + input sanitization
app.use(morgan('combined', { stream: { write: msg => logger.http(msg.trim()) } }));

// ── Health check ───────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// ── API routes ─────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/issues', issuesRouter);
app.use('/api/community', communityRouter);
app.use('/api/chat', verifyToken, chatRouter);
app.use('/api/admin', verifyToken, adminRouter);

// ── Global error handler ───────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} — ${err.message} — ${req.originalUrl} — ${req.method} — ${req.ip}`);
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// ── Socket.io — real-time chat ────────────────────────────
io.use(async (socket, next) => {
  // Verify Firebase token on socket connection
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const admin = require('./config/firebase');
    const decoded = await admin.auth().verifyIdToken(token);
    socket.user = decoded;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.user?.uid} (${socket.id})`);

  // Join a chat room
  socket.on('join_room', (room) => {
    socket.join(room);
    logger.info(`User ${socket.user?.uid} joined room: ${room}`);
  });

  // Send a message to a room
  socket.on('send_message', async (data) => {
    const { room, text } = data;
    if (!text?.trim() || !room) return;

    const message = {
      id: Date.now().toString(),
      userId: socket.user.uid,
      name: socket.user.name || socket.user.email?.split('@')[0] || 'User',
      text: text.trim().substring(0, 500), // Enforce max length
      room,
      timestamp: new Date().toISOString(),
    };

    // Persist to Firestore
    try {
      const admin = require('./config/firebase');
      await admin.firestore()
        .collection('chat_messages')
        .doc(room)
        .collection('messages')
        .add(message);
    } catch (e) {
      logger.error('Failed to persist chat message:', e);
    }

    // Broadcast to room
    io.to(room).emit('new_message', message);
  });

  // Issue comment posted in real-time
  socket.on('new_comment', (data) => {
    socket.to(`issue_${data.issueId}`).emit('comment_update', data);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.user?.uid}`);
  });
});

// ── Start server ───────────────────────────────────────────
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  logger.info(`CitiConnect API running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

module.exports = { app, io };
