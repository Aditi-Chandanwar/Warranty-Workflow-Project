const warrantyRecordRepository = require('../repositories/warrantyRecordRepository');
const workflowEngine = require('./workflowEngine');
const { validateAnalysisUpdate } = require('../utils/validators/analysisValidator');
const { ValidationError, NotFoundError } = require('../utils/errors');

// The only fields this module is allowed to write. Phase 1 fields, status,
// version, and id are never touched here, even if present in the request body.
const PHASE2_FIELD_KEYS = [
  'mrplEndSwitchReceived',
  'partReceivedOn',
  'qreObservation',
  'warrantyCellObservation',
  'rootCause',
  'action',
  'cutOffDate',
  'finalClassification',
];

function pickPhase2Fields(source) {
  const result = {};
  for (const key of PHASE2_FIELD_KEYS) {
    if (source[key] !== undefined) {
      result[key] = source[key];
    }
  }
  return result;
}

async function updateAnalysis(id, requestData) {
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('A valid record id is required.');
  }

  const existing = await warrantyRecordRepository.findById(id);
  if (!existing) {
    throw new NotFoundError(`Warranty record ${id} was not found.`);
  }

  const incomingFields = pickPhase2Fields(requestData);

  const mergedForValidation = { ...existing, ...incomingFields };
  validateAnalysisUpdate(mergedForValidation);

  const eligibleStatus = workflowEngine.advanceIfEligible(existing.status, mergedForValidation);

  const fieldsToUpdate = { ...incomingFields };
  if (eligibleStatus !== existing.status) {
    fieldsToUpdate.status = eligibleStatus;
  }

  const updated = await warrantyRecordRepository.update(id, fieldsToUpdate);

  if (eligibleStatus !== existing.status) {
    workflowEngine.notifyTransition({
      recordId: id,
      fromStatus: existing.status,
      toStatus: eligibleStatus,
    });
  }

  return updated;
}

module.exports = { updateAnalysis };