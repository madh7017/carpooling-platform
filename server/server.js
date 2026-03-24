const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { errorHandler } = require('./src/middlewares/errorMiddleware');
const streamManager = require('./src/utils/streamManager');

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please check your .env file and ensure all required variables are set.');
  process.exit(1);
}

const app = express();
app.set("stream", streamManager);

const defaultLocalOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://localhost:8080',
];

const configuredOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = configuredOrigins.length ? configuredOrigins : defaultLocalOrigins;
const isDevelopment = (process.env.NODE_ENV || 'development') !== 'production';

const isNgrokOrigin = (origin = '') => {
  try {
    const { hostname } = new URL(origin);
    return hostname.endsWith('.ngrok-free.app') || hostname.endsWith('.ngrok-free.dev');
  } catch {
    return false;
  }
};

const isPrivateNetworkOrigin = (origin = '') => {
  try {
    const { hostname } = new URL(origin);

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return true;
    }

    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return true;
    }

    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return true;
    }

    const match172 = hostname.match(/^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
    if (match172) {
      const secondOctet = Number(match172[1]);
      return secondOctet >= 16 && secondOctet <= 31;
    }

    return false;
  } catch {
    return false;
  }
};

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      if (isDevelopment && isNgrokOrigin(origin)) {
        return callback(null, true);
      }

      if (isDevelopment && isPrivateNetworkOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS not allowed for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method.padEnd(6)} ${req.path}`);
  next();
});

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    console.log(`Database: ${process.env.MONGO_URI.split('/').pop()}`);
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    console.error('Make sure MongoDB is running or check your MONGO_URI in .env');
    process.exit(1);
  });

// Routes - Import from src/routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/rides', require('./src/routes/rideRoutes'));
app.use('/api/bookings', require('./src/routes/bookingRoutes'));
app.use('/api/chat', require('./src/routes/chatRoutes'));
app.use('/api/calls', require('./src/routes/callRoutes'));
app.use('/api/support', require('./src/routes/supportRoutes'));
app.use('/api/drivers', require('./src/routes/driverRoutes'));
app.use('/api/driver', require('./src/routes/driverRoutes'));
app.use('/api/passengers', require('./src/routes/passengerRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));
app.use('/api/stream', require('./src/routes/streamRoutes'));
app.use('/api/share', require('./src/routes/shareRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    uptime: process.uptime(),
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
    statusCode: 404,
  });
});

// Global error handler (MUST be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log('CarPool Server is running');
  console.log(`URL:         http://localhost:${PORT}`);
  console.log(`API:         http://localhost:${PORT}/api`);
  console.log(`Health:      http://localhost:${PORT}/api/health`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS:        ${allowedOrigins.join(', ')}`);
  console.log(`${'='.repeat(60)}\n`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nSIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});
