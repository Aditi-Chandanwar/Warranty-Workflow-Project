const path = require("path");

const config = {
  server: {
    port: process.env.PORT || 3000,
  },
  database: {
    type: process.env.DB_TYPE || "sqlite",
    sqlitePath:
      process.env.DB_PATH || path.join(__dirname, "..", "data", "warranty.db"),
  },
  pagination: {
    defaultPageSize: 25,
    minPageSize: 10,
    maxPageSize: 100,
  },
  dropdowns: {
    directory: path.join(__dirname, "dropdowns"),
    allowedFields: [
      "customers",
      "dealers",
      "vehicleModels",
      "rootCauses",
      "zones",
      "kmCategories",
    ],
  },
  workflow: {
    statuses: [
      "Pending Part Receipt",
      "Part Received",
      "Under Analysis",
      "Completed",
    ],
  },
};

module.exports = config;
