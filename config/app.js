const express = require("express");
const path = require("path");

function createApp() {
  const app = express();

  app.use(express.json());
  app.use(express.static(path.join(__dirname, "..", "public")));

  // Routes mounted here as each module is completed:
  // app.use('/api/warranty-records', require('../routes/warrantyRecords'));
  // app.use('/api/dashboard', require('../routes/dashboard'));
  // app.use('/api/exports', require('../routes/exports'));
  // app.use('/api/dropdowns', require('../routes/dropdowns'));

  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "views", "dashboard.html"));
  });

  app.use("/api", (req, res) => {
    res
      .status(404)
      .json({ success: false, message: "Resource not found", data: null });
  });

  // Centralized error middleware added in Validation Layer step:
  // app.use(require('../utils/errorHandler'));

  return app;
}

module.exports = createApp;
