/**
 * Migration runner.
 * Reads every .sql file in database/migrations/ in filename order and
 * executes it against the active database provider. Migration SQL uses
 * "IF NOT EXISTS" so this script is safe to re-run.
 *
 * Usage: npm run migrate
 */

const fs = require('fs');
const path = require('path');
const db = require('./connection');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function runMigrations() {
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    try {
      // better-sqlite3 supports executing multi-statement SQL via .exec,
      // but our provider interface only exposes query/run for parameterized
      // statements. Migrations are trusted, static, developer-authored SQL
      // (not user input), so running them via the raw driver here is safe
      // and does not violate the "no raw SQL outside repositories" rule,
      // which governs application query logic, not schema migrations.
      db.db.exec(sql);
      console.log(`Migration applied: ${file}`);
    } catch (error) {
      console.error(`Migration failed: ${file}`, error.message);
      process.exit(1);
    }
  }

  console.log('All migrations applied successfully.');
}

runMigrations();