/**
 * Typed application errors. Services throw these; they carry no HTTP
 * knowledge themselves — utils/errorHandler.js is the only place that maps
 * an error type to a status code.
 */

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
  }
}

module.exports = { ValidationError, NotFoundError };