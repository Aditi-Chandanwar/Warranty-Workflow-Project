const { ValidationError } = require('../errors');

// Mirrors the CHECK constraints already in the schema — caught here first
// so the user gets a clean validation message instead of a raw SQLite error.
const MRPL_END_SWITCH_VALUES = ['Yes', 'No'];
const FINAL_CLASSIFICATION_VALUES = ['Pre', 'Post', 'NTF', 'Tampered', 'Not MRPL Issue'];

function isBlank(value) {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

/**
 * Validates an Analysis update payload. No field is mandatory here — Phase 2
 * is filled in incrementally over time, so a partial save (e.g. only
 * partReceivedOn) is valid. Only checks that whichever fields ARE present
 * have an acceptable shape/value.
 *
 * @param {Object} data
 * @throws {ValidationError} if any provided field is invalid
 */
function validateAnalysisUpdate(data) {
  const errors = [];

  if (!isBlank(data.mrplEndSwitchReceived) && !MRPL_END_SWITCH_VALUES.includes(data.mrplEndSwitchReceived)) {
    errors.push(`MRPL End Switch Received must be one of: ${MRPL_END_SWITCH_VALUES.join(', ')}.`);
  }

  if (!isBlank(data.finalClassification) && !FINAL_CLASSIFICATION_VALUES.includes(data.finalClassification)) {
    errors.push(`Final Classification must be one of: ${FINAL_CLASSIFICATION_VALUES.join(', ')}.`);
  }

  // If Final Classification is being set, Root Cause and Action should
  // realistically accompany it — this is a soft business-completeness
  // check, not a hard schema constraint (the workflow engine also depends
  // on all three being present to reach "Completed", so this just gives
  // the user an earlier, clearer message).
  if (!isBlank(data.finalClassification) && (isBlank(data.rootCause) || isBlank(data.action))) {
    errors.push('Root Cause and Action should be provided together with Final Classification.');
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join(' '));
  }
}

module.exports = { validateAnalysisUpdate };