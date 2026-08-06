const { ValidationError } = require('../errors');
const config = require('../../config');

// Mirrors repositories/warrantyRecordRepository.js ALLOWED_SORT_COLUMNS keys.
// Kept as an independent allowlist here (not imported from the repository)
// so the validation layer does not depend on repository internals — this is
// the upstream check; the repository's own map is the defense-in-depth
// fallback, not the other way around.
const ALLOWED_SORT_FIELDS = [
  'memoNo',
  'customer',
  'vehicleModel',
  'status',
  'quantity',
  'claimFailureDate',
  'reportingMonth',
  'createdAt',
  'updatedAt',
];

const ALLOWED_SORT_DIRECTIONS = ['asc', 'desc'];

const ALLOWED_DASHBOARD_BREAKDOWNS = [
  'customer',
  'rootCause',
  'month',
  'batchCode',
  'vehicleModel',
  'status',
];

/**
 * Validates and normalizes list/search query parameters shared by the
 * Records endpoint, dashboard summary, and export endpoint.
 *
 * @param {Object} query - raw req.query
 * @returns {{ page: number, pageSize: number, sortBy: string, sortDir: string }}
 * @throws {ValidationError}
 */
function validateListQuery(query) {
  const errors = [];

  let page = 1;
  if (query.page !== undefined) {
    page = Number(query.page);
    if (!Number.isInteger(page) || page < 1) {
      errors.push('page must be a positive whole number.');
      page = 1;
    }
  }

  let pageSize = config.pagination.defaultPageSize;
  if (query.pageSize !== undefined) {
    pageSize = Number(query.pageSize);
    const { minPageSize, maxPageSize } = config.pagination;
    if (!Number.isInteger(pageSize) || pageSize < minPageSize || pageSize > maxPageSize) {
      errors.push(`pageSize must be a whole number between ${minPageSize} and ${maxPageSize}.`);
      pageSize = config.pagination.defaultPageSize;
    }
  }

  let sortBy = 'createdAt';
  if (query.sortBy !== undefined) {
    if (!ALLOWED_SORT_FIELDS.includes(query.sortBy)) {
      errors.push(`sortBy must be one of: ${ALLOWED_SORT_FIELDS.join(', ')}.`);
    } else {
      sortBy = query.sortBy;
    }
  }

  let sortDir = 'desc';
  if (query.sortDir !== undefined) {
    const normalized = String(query.sortDir).toLowerCase();
    if (!ALLOWED_SORT_DIRECTIONS.includes(normalized)) {
      errors.push(`sortDir must be one of: ${ALLOWED_SORT_DIRECTIONS.join(', ')}.`);
    } else {
      sortDir = normalized;
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join(' '));
  }

  return {
    page,
    pageSize,
    sortBy,
    sortDir: sortDir.toUpperCase(),
  };
}

/**
 * Validates the dashboard chart breakdown selector.
 * @param {string} by
 * @returns {string}
 * @throws {ValidationError}
 */
function validateDashboardBreakdown(by) {
  if (!ALLOWED_DASHBOARD_BREAKDOWNS.includes(by)) {
    throw new ValidationError(
      `Dashboard 'by' parameter must be one of: ${ALLOWED_DASHBOARD_BREAKDOWNS.join(', ')}.`
    );
  }
  return by;
}

/**
 * Validates the dropdown field name against config's allowlist.
 * @param {string} field
 * @returns {string}
 * @throws {ValidationError}
 */
function validateDropdownField(field) {
  if (!config.dropdowns.allowedFields.includes(field)) {
    throw new ValidationError(
      `Unknown dropdown field. Must be one of: ${config.dropdowns.allowedFields.join(', ')}.`
    );
  }
  return field;
}

module.exports = {
  validateListQuery,
  validateDashboardBreakdown,
  validateDropdownField,
};