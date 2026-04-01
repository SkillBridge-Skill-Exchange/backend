/**
 * Express Application Setup
 * ==========================
 * Configures the Express app with middleware and route mounting.
 * This file does NOT start the server — that's in server.js.
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Import route modules
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const skillRoutes = require('./routes/skillRoutes');
const requestRoutes = require('./routes/requestRoutes');
const matchRoutes = require('./routes/matchRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const messengerRoutes = require('./routes/messengerRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const endorsementRoutes = require('./routes/endorsementRoutes');

// Import error handler
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// ==========================================
// Global Middleware
// ==========================================

// Enable CORS for all origins (configurable for production)
app.use(cors());

// HTTP request logging
app.use(morgan('dev'));

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// ==========================================
// API Routes
// ==========================================

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messengerRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/endorsements', endorsementRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SkillBridge API is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
