const config = require('../config');

/**
 * Instantiates and exports a single, shared DatabaseProvider instance for the
 * lifetime of the application. This is the ONLY place that decides which
 * concrete provider is active, based on config.database.type.
 *
 * Repositories require() this module and call db.query()/db.run()/etc —
 * they never import a driver or a provider class directly.
 */

let provider;

switch (config.database.type) {
  case 'sqlite': {
    const SqliteProvider = require('./sqliteProvider');
    provider = new SqliteProvider(config.database.sqlitePath);
    break;
  }
  // Future: case 'postgres': provider = new (require('./postgresProvider'))(...); break;
  default:
    throw new Error(`Unsupported database type: "${config.database.type}"`);
}

module.exports = provider;