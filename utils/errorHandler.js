const { ValidationError, NotFoundError } = require('./errors');

/**
 * Centralized Express error-handling middleware.
 * Every route/controller in the app funnels errors here via next(err) or by
 * throwing inside an async handler wrapped with asyncHandler (see below).
 *
 * Never leaks stack traces to the client — logs server-side only, per the
 * logging rules (log unexpected exceptions, keep console output minimal).
 */
function errorHandler(err, req, res, next) {
  if (err instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      message: err.message,
      data: null,
    });
  }

  if (err instanceof NotFoundError) {
    return res.status(404).json({
      success: false,
      message: err.message,
      data: null,
    });
  }

  // Unexpected error — log server-side, return a generic message to the client.
  console.error('Unexpected error:', err);
  return res.status(500).json({
    success: false,
    message: 'An unexpected error occurred. Please try again.',
    data: null,
  });
}

/**
 * Wraps an async Express route handler so any rejected promise / thrown
 * error is forwarded to next(err) automatically, reaching errorHandler
 * above instead of crashing the process or hanging the request.
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { errorHandler, asyncHandler };