const Database = require('better-sqlite3');
const DatabaseProvider = require('./DatabaseProvider');

/**
 * SQLite implementation of DatabaseProvider, backed by better-sqlite3.
 *
 * better-sqlite3 is synchronous by nature; every method here still returns a
 * Promise so the provider interface stays consistent with future async
 * providers (e.g. Postgres). Callers should always `await` these methods.
 */
class SqliteProvider extends DatabaseProvider {
  /**
   * @param {string} filePath - path to the SQLite database file
   */
  constructor(filePath) {
    super();
    this.db = new Database(filePath);

    // WAL mode reduces writer/reader contention — cheap to enable now,
    // avoids avoidable SQLITE_BUSY errors as concurrent usage grows.
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
  }

  async query(sql, params = []) {
    const stmt = this.db.prepare(sql);
    return stmt.all(params);
  }

  async run(sql, params = []) {
    const stmt = this.db.prepare(sql);
    const result = stmt.run(params);
    return {
      lastInsertId: result.lastInsertRowid ?? null,
      changes: result.changes,
    };
  }

  async transaction(fn) {
    const txn = this.db.transaction(fn);
    return txn();
  }

  async close() {
    this.db.close();
  }
}

module.exports = SqliteProvider;