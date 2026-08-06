/**
 * DatabaseProvider — the contract every concrete database provider must implement.
 *
 * Repositories depend ONLY on this shape, never on a specific driver (better-sqlite3,
 * pg, mssql, etc). Swapping the underlying database later means writing a new
 * provider file that implements these same four methods — nothing above the
 * repository layer changes.
 *
 * This file is documentation + a runtime safety net (throws if a method is
 * left unimplemented) rather than a class repositories inherit from.
 */

class DatabaseProvider {
  /**
   * Run a SELECT and return an array of result rows.
   * @param {string} sql - parameterized SQL (never string-concatenated input)
   * @param {Array} params
   * @returns {Promise<Array<Object>>}
   */
  async query(sql, params = []) {
    throw new Error('DatabaseProvider.query() must be implemented by the concrete provider');
  }

  /**
   * Run an INSERT / UPDATE / DELETE statement.
   * @param {string} sql
   * @param {Array} params
   * @returns {Promise<{ lastInsertId: number|null, changes: number }>}
   */
  async run(sql, params = []) {
    throw new Error('DatabaseProvider.run() must be implemented by the concrete provider');
  }

  /**
   * Run a function within a database transaction. The function receives no
   * arguments and should perform its queries via the same provider instance;
   * the provider is responsible for commit/rollback semantics.
   * @param {Function} fn
   * @returns {Promise<*>}
   */
  async transaction(fn) {
    throw new Error('DatabaseProvider.transaction() must be implemented by the concrete provider');
  }

  /** Close the underlying connection/pool. */
  async close() {
    throw new Error('DatabaseProvider.close() must be implemented by the concrete provider');
  }
}

module.exports = DatabaseProvider;