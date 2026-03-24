/**
 * Custom error class for API errors
 * Usage: throw new AppError('User not found', 404)
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async error handler wrapper
 * Wraps async route handlers to catch errors
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { AppError, asyncHandler };
