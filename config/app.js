/**
 * Builds and configures the Express application.
 * Exported (not started) so it can be reused by tests without binding a port.
 * Route registration is added incrementally as each module is implemented.
 */

const express = require('express');
const path = require('path');

function createApp() {
  const app = express();

  // ----- Core middleware -----
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // ----- API routes (mounted here as each module is completed) -----
  app.use('/api/warranty-records', require('../routes/warrantyRecords'));
  app.use('/api/dashboard', require('../routes/dashboard'));
  // app.use('/api/exports', require('../routes/exports'));
  // app.use('/api/dropdowns', require('../routes/dropdowns'));

  // ----- View fallback -----
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'dashboard.html'));
  });

  // ----- 404 handler for unmatched API routes -----
  app.use('/api', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'Resource not found',
      data: null,
    });
  });

  // ----- Centralized error-handling middleware -----
  // Must be registered AFTER all routes (Express convention: 4-arg middleware
  // is only treated as an error handler when placed last in the chain).
  const { errorHandler } = require('../utils/errorHandler');
  app.use(errorHandler);

  return app;
}

module.exports = createApp;