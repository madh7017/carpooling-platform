/**
 * Global error handler middleware
 * Handles all errors thrown in the application
 */
exports.errorHandler = (err, req, res, next) => {
  const isDevelopment = process.env.NODE_ENV === "development";

  // Log error for debugging
  console.error("Error:", {
    message: err.message,
    status: err.statusCode || 500,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    ...(isDevelopment && { stack: err.stack }),
  });

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors,
      statusCode: 400,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`,
      statusCode: 400,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
      statusCode: 401,
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired",
      statusCode: 401,
    });
  }

  // Default error response
  res.status(statusCode).json({
    success: false,
    message,
    statusCode,
    ...(isDevelopment && { stack: err.stack }),
  });
};

/**
 * Async error wrapper - use with route handlers
 * Catches errors and passes them to the error handler
 */
exports.asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
