const db = require('../database/connection');

/**
 * Single source of truth mapping JS (camelCase) field names to their
 * warranty_records column (snake_case). Used by create(), update(), and
 * row-to-object mapping — never duplicated elsewhere.
 */
const FIELD_MAP = {
  reportingMonth: 'reporting_month',
  memoNo: 'memo_no',
  memoDate: 'memo_date',
  customer: 'customer',
  claimNo: 'claim_no',
  claimFailureDate: 'claim_failure_date',
  claimFailureMonth: 'claim_failure_month',
  dealerCode: 'dealer_code',
  dealerName: 'dealer_name',
  state: 'state',
  zone: 'zone',
  physicalPartNumber: 'physical_part_number',
  invoicePartNumber: 'invoice_part_number',
  switchName: 'switch_name',
  customerPartNumber: 'customer_part_number',
  vehicleModel: 'vehicle_model',
  subModel: 'sub_model',
  chassisNo: 'chassis_no',
  chassisMonth: 'chassis_month',
  km: 'km',
  kmCategory: 'km_category',
  vehicleSaleDate: 'vehicle_sale_date',
  switchBatchCode: 'switch_batch_code',
  switchManufacturingMonth: 'switch_manufacturing_month',
  mis: 'mis',
  quantity: 'quantity',
  complaintReported: 'complaint_reported',
  jiDecision: 'ji_decision',

  mrplEndSwitchReceived: 'mrpl_end_switch_received',
  partReceivedOn: 'part_received_on',
  qreObservation: 'qre_observation',
  warrantyCellObservation: 'warranty_cell_observation',
  rootCause: 'root_cause',
  action: 'action',
  cutOffDate: 'cut_off_date',
  finalClassification: 'final_classification',

  status: 'status',
};

// Columns that findAll() is allowed to sort by, mapped the same way.
// Kept here as a repository-level safety net even though the primary
// validation happens in the query validator (Module 5).
const ALLOWED_SORT_COLUMNS = {
  memoNo: 'memo_no',
  customer: 'customer',
  vehicleModel: 'vehicle_model',
  status: 'status',
  quantity: 'quantity',
  claimFailureDate: 'claim_failure_date',
  reportingMonth: 'reporting_month',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};

const DEFAULT_SORT_COLUMN = 'created_at';
const DEFAULT_SORT_DIR = 'DESC';

const ACTIVE_CLAUSE = 'deleted_at IS NULL';

/**
 * Converts a raw DB row (snake_case) into an API-shaped object (camelCase).
 */
function mapRowToRecord(row) {
  if (!row) return null;

  const record = { id: row.id };
  for (const [jsKey, column] of Object.entries(FIELD_MAP)) {
    record[jsKey] = row[column];
  }
  record.version = row.version;
  record.deletedAt = row.deleted_at;
  record.createdAt = row.created_at;
  record.updatedAt = row.updated_at;

  return record;
}

/**
 * Builds a parameterized "column = ?, column = ?" SET clause from a fields
 * object, restricted to keys present in FIELD_MAP. Unknown keys are silently
 * dropped rather than reaching SQL — callers (services) are responsible for
 * validating input completeness before calling update().
 */
function buildSetClause(fields) {
  const columns = [];
  const values = [];

  for (const [jsKey, value] of Object.entries(fields)) {
    const column = FIELD_MAP[jsKey];
    if (!column) continue; // unrecognized field — never interpolated into SQL
    columns.push(`${column} = ?`);
    values.push(value);
  }

  return { columns, values };
}

/**
 * Insert a new warranty record (Phase 1 fields). Status and version default
 * to their table defaults ('Pending Part Receipt' and 1 respectively) —
 * callers do not set them on create.
 */
async function create(fields) {
  const { columns, values } = buildSetClause(fields);
  const columnNames = columns.map((c) => c.split(' = ')[0]);
  const placeholders = columnNames.map(() => '?').join(', ');

  const sql = `
    INSERT INTO warranty_records (${columnNames.join(', ')})
    VALUES (${placeholders})
  `;

  const result = await db.run(sql, values);
  return findById(result.lastInsertId);
}

/**
 * Fetch a single active (non-deleted) record by id.
 */
async function findById(id) {
  const sql = `SELECT * FROM warranty_records WHERE id = ? AND ${ACTIVE_CLAUSE}`;
  const rows = await db.query(sql, [id]);
  return mapRowToRecord(rows[0]);
}

/**
 * Update an existing active record with an arbitrary subset of fields.
 * Always increments version and refreshes updated_at explicitly (no trigger).
 * Returns the updated record, or null if the id does not exist or is
 * soft-deleted.
 */
async function update(id, fields) {
  const { columns, values } = buildSetClause(fields);

  if (columns.length === 0) {
    // Nothing valid to update — return current state unchanged.
    return findById(id);
  }

  const sql = `
    UPDATE warranty_records
    SET ${columns.join(', ')},
        version = version + 1,
        updated_at = datetime('now')
    WHERE id = ? AND ${ACTIVE_CLAUSE}
  `;

  const result = await db.run(sql, [...values, id]);
  if (result.changes === 0) return null;

  return findById(id);
}

/**
 * Soft delete: sets deleted_at, still bumps version/updated_at for
 * consistency with the rule "every update increments version".
 * Returns { id, deletedAt } or null if the record was already
 * inactive/non-existent.
 */
async function softDelete(id) {
  const sql = `
    UPDATE warranty_records
    SET deleted_at = datetime('now'),
        version = version + 1,
        updated_at = datetime('now')
    WHERE id = ? AND ${ACTIVE_CLAUSE}
  `;

  const result = await db.run(sql, [id]);
  if (result.changes === 0) return null;

  const row = await db.query('SELECT id, deleted_at FROM warranty_records WHERE id = ?', [id]);
  return { id: row[0].id, deletedAt: row[0].deleted_at };
}

/**
 * List active records with optional search, filters, sorting, and pagination.
 *
 * @param {Object} options
 * @param {number} options.page - 1-based page number
 * @param {number} options.pageSize
 * @param {string} options.sortBy - camelCase field name, validated against ALLOWED_SORT_COLUMNS
 * @param {string} options.sortDir - 'ASC' | 'DESC'
 * @param {string} [options.search] - free-text search across memo/claim/customer/vehicle model
 * @param {Object} [options.filters] - { customer, vehicleModel, batchCode, rootCause, status, reportingMonth }
 * @returns {Promise<{ records: Array<Object>, totalRecords: number }>}
 */
async function findAll(options) {
  const {
    page = 1,
    pageSize = 25,
    sortBy = DEFAULT_SORT_COLUMN,
    sortDir = DEFAULT_SORT_DIR,
    search = '',
    filters = {},
  } = options;

  const whereClauses = [ACTIVE_CLAUSE];
  const params = [];

  if (search) {
    whereClauses.push('(memo_no LIKE ? OR claim_no LIKE ? OR customer LIKE ? OR vehicle_model LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }

  const filterColumnMap = {
    customer: 'customer',
    vehicleModel: 'vehicle_model',
    batchCode: 'switch_batch_code',
    rootCause: 'root_cause',
    status: 'status',
    reportingMonth: 'reporting_month',
  };

  for (const [filterKey, column] of Object.entries(filterColumnMap)) {
    const value = filters[filterKey];
    if (value) {
      whereClauses.push(`${column} = ?`);
      params.push(value);
    }
  }

  const whereSql = whereClauses.join(' AND ');

  // sortBy/sortDir are expected to already be validated upstream (Module 5),
  // but resolved through the allowlist map here as a second line of defense
  // rather than trusting the caller's string directly in SQL.
  const sortColumn = ALLOWED_SORT_COLUMNS[sortBy] || DEFAULT_SORT_COLUMN;
  const sortDirection = sortDir === 'ASC' ? 'ASC' : 'DESC';

  const countSql = `SELECT COUNT(*) AS total FROM warranty_records WHERE ${whereSql}`;
  const countResult = await db.query(countSql, params);
  const totalRecords = countResult[0].total;

  const offset = (page - 1) * pageSize;
  const listSql = `
    SELECT * FROM warranty_records
    WHERE ${whereSql}
    ORDER BY ${sortColumn} ${sortDirection}
    LIMIT ? OFFSET ?
  `;
  const rows = await db.query(listSql, [...params, pageSize, offset]);

  return {
    records: rows.map(mapRowToRecord),
    totalRecords,
  };
}

module.exports = {
  create,
  findById,
  update,
  softDelete,
  findAll,
  mapRowToRecord, // exported for reuse by dashboard/analytics repository queries later
};