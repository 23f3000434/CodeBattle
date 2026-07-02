require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { setupSocketHandlers } = require('./services/socketHandler');

const authRoutes = require('./routes/authRoutes');
const matchRoutes = require('./routes/matchRoutes');
const problemRoutes = require('./routes/problemRoutes');

const app = express();
const server = http.createServer(app);

const isProduction = process.env.NODE_ENV === 'production';

// Determine allowed origins
const allowedOrigins = isProduction
  ? [process.env.CLIENT_URL, process.env.RENDER_EXTERNAL_URL].filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:3000'];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  // Production WebSocket settings
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

// Security
app.use(helmet({
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "wss:", "ws:", "https://emkc.org"],
      imgSrc: ["'self'", "data:", "blob:"]
    }
  } : false
}));

app.use(cors({
  origin: isProduction ? allowedOrigins : '*',
  credentials: true
}));

// Logging
if (isProduction) {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 100 : 200,
  message: { success: false, message: 'Too many requests' }
});
app.use('/api/', limiter);

// Trust proxy for Render/Railway
if (isProduction) {
  app.set('trust proxy', 1);
}

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/problems', problemRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'CodeBattle API running', env: process.env.NODE_ENV });
});

// Serve React build in production
if (isProduction) {
  const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientBuildPath));

  // SPA fallback — serve index.html for all non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io/')) {
      return next();
    }
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// 404 for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: isProduction ? 'Internal server error' : err.message
  });
});

// Setup WebSocket handlers
setupSocketHandlers(io);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`CodeBattle server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
});
