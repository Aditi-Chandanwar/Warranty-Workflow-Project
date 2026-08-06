const { ValidationError } = require('../errors');

// Fields marked mandatory (*) on the approved New Claim wireframe.
const MANDATORY_FIELDS = [
  { key: 'reportingMonth', label: 'Reporting Month' },
  { key: 'memoNo', label: 'Memo No.' },
  { key: 'memoDate', label: 'Memo Date' },
  { key: 'customer', label: 'Customer' },
  { key: 'claimNo', label: 'Claim No.' },
  { key: 'claimFailureDate', label: 'Claim Failure Date' },
  { key: 'vehicleModel', label: 'Vehicle Model' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'jiDecision', label: 'JI Decision' },
];

const JI_DECISION_VALUES = ['Accepted', 'Rejected'];

function isBlank(value) {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

/**
 * Validates a Claim Registration payload (create, or a claim-info edit).
 * Collects ALL problems before throwing, so the user sees every issue at
 * once rather than one field per submit attempt.
 *
 * @param {Object} data
 * @throws {ValidationError} if any check fails
 */
function validateClaimRegistration(data) {
  const errors = [];

  for (const field of MANDATORY_FIELDS) {
    if (isBlank(data[field.key])) {
      errors.push(`${field.label} is required.`);
    }
  }

  if (!isBlank(data.quantity)) {
    const qty = Number(data.quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      errors.push('Quantity must be a positive whole number.');
    }
  }

  if (!isBlank(data.jiDecision) && !JI_DECISION_VALUES.includes(data.jiDecision)) {
    errors.push(`JI Decision must be one of: ${JI_DECISION_VALUES.join(', ')}.`);
  }

  if (!isBlank(data.km)) {
    const km = Number(data.km);
    if (Number.isNaN(km) || km < 0) {
      errors.push('KM must be a non-negative number.');
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join(' '));
  }
}

module.exports = { validateClaimRegistration };