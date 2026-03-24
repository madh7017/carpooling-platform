/**
 * Application Configuration
 * Centralized configuration for the application
 */

module.exports = {
  // Server
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/carpooling',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  
  // Security
  BCRYPT_ROUNDS: 12,
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
  
  // API
  API_TIMEOUT: 30000, // 30 seconds
  MAX_REQUEST_SIZE: '10mb',
  
  // Pagination
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
};
