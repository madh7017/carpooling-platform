const { validationResult } = require("express-validator");

/**
 * Validation middleware
 * Checks for validation errors and returns them in a consistent format
 */
exports.runValidation = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
      })),
      statusCode: 400,
    });
  }

  next();
};

/**
 * Sanitization helpers
 */
exports.sanitizeEmail = (email) => {
  return email ? email.toLowerCase().trim() : email;
};

exports.sanitizeName = (name) => {
  return name ? name.trim() : name;
};
