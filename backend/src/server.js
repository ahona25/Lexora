require('dotenv').config();
require('express-async-errors');

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const path = require('path');

const config = require('./config');
const { errorHandler } = require('./middleware/errorHandler');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const lawyerRoutes = require('./routes/lawyerRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const server = http.createServer(app);

// ============================================================
// SOCKET.IO REAL-TIME SETUP
// ============================================================
const io = new Server(server, {
  cors: {
    origin: config.frontendUrl,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Online users map: userId -> socketId
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log(`⚡ Socket connected: ${socket.id}`);

  socket.on('user:join', (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    io.emit('users:online', Array.from(onlineUsers.keys()));
    console.log(`👤 User ${userId} joined. Online: ${onlineUsers.size}`);
  });

  socket.on('message:send', (data) => {
    // data: { conversationId, message, toUserId }
    const recipientSocketId = onlineUsers.get(data.toUserId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('message:receive', data);
    }
    // Always echo back to sender to confirm delivery
    socket.emit('message:sent', data);
  });

  socket.on('typing:start', (data) => {
    const recipientSocketId = onlineUsers.get(data.toUserId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('typing:start', { fromUserId: socket.userId });
    }
  });

  socket.on('typing:stop', (data) => {
    const recipientSocketId = onlineUsers.get(data.toUserId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('typing:stop', { fromUserId: socket.userId });
    }
  });

  socket.on('notification:send', (data) => {
    const recipientSocketId = onlineUsers.get(data.toUserId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('notification:receive', data);
    }
  });

  // WebRTC Signaling for Video/Audio
  socket.on('webrtc:offer', (data) => {
    const recipientSocketId = onlineUsers.get(data.toUserId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('webrtc:offer', { ...data, fromSocketId: socket.id });
    }
  });

  socket.on('webrtc:answer', (data) => {
    const recipientSocketId = onlineUsers.get(data.toUserId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('webrtc:answer', data);
    }
  });

  socket.on('webrtc:ice-candidate', (data) => {
    const recipientSocketId = onlineUsers.get(data.toUserId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('webrtc:ice-candidate', data);
    }
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit('users:online', Array.from(onlineUsers.keys()));
    }
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// Expose io to be used in controllers
app.set('io', io);

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(compression());
app.use(cookieParser());

if (config.env !== 'test') {
  app.use(morgan('dev'));
}

// Global Rate Limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { status: 'error', message: 'Too many requests. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict Auth Rate Limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { status: 'error', message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files (local storage dev mode)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ============================================================
// API ROUTES
// ============================================================
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'LegalConnect API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/lawyers', lawyerRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/specializations', categoryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// ============================================================
// NOT FOUND HANDLER
// ============================================================
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Route ${req.originalUrl} not found on this server.`,
  });
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================
app.use(errorHandler);

// ============================================================
// START SERVER
// ============================================================
const PORT = config.port || 5000;
server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║       ⚖️  LegalConnect API Server             ║
  ║──────────────────────────────────────────────║
  ║  Status:    RUNNING                          ║
  ║  Port:      ${PORT}                             ║
  ║  Env:       ${(config.env + '                     ').slice(0, 14)}         ║
  ║  Health:    http://localhost:${PORT}/api/health  ║
  ╚══════════════════════════════════════════════╝
  `);
});

module.exports = { app, server, io };
