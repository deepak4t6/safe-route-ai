require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const routeRoutes = require('./routes/routes.routes');
const safetyRoutes = require('./routes/safety.routes');
const sosRoutes = require('./routes/sos.routes');
const aiRoutes = require('./routes/ai.routes');
const adminRoutes = require('./routes/admin.routes');
const mapsRoutes = require('./routes/maps.routes');
const { notFoundHandler, globalErrorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Basic rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  }
});
app.use('/api/', limiter);

// Root Healthcheck
app.get('/', (req, res) => {
  res.json({
    app: 'Safe Route AI — Backend API',
    tagline: 'Reach safely, not just quickly.',
    version: '1.0.0',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/maps', mapsRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Start server only when run directly
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🛡️  Safe Route AI Backend Server running on port ${PORT}`);
    console.log(`📍  API URL: http://localhost:${PORT}/api`);
    console.log(`🗺️  Maps API: http://localhost:${PORT}/api/maps/autocomplete`);
    console.log(`🚀  Health Check: http://localhost:${PORT}/health`);
    console.log(`=======================================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ [PORT CONFLICT] Port ${PORT} is already in use by another process.`);
      console.error(`👉 Run this one-line command in PowerShell to free port ${PORT}:`);
      console.error(`   Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force\n`);
    } else {
      console.error('[Server Error]', err);
    }
  });
}

module.exports = app;
