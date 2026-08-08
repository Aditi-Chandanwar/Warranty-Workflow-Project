const warrantyRecordRepository = require('../repositories/warrantyRecordRepository');
const workflowEngine = require('./workflowEngine');
const { validateClaimRegistration } = require('../utils/validators/claimValidator');
const { ValidationError, NotFoundError } = require('../utils/errors');

const PHASE1_FIELD_KEYS = [
  'reportingMonth', 'memoNo', 'memoDate', 'customer', 'claimNo',
  'claimFailureDate', 'dealerCode', 'dealerName', 'state', 'zone',
  'physicalPartNumber', 'invoicePartNumber', 'switchName', 'customerPartNumber',
  'vehicleModel', 'subModel', 'chassisNo', 'chassisMonth', 'km', 'kmCategory',
  'vehicleSaleDate', 'switchBatchCode', 'switchManufacturingMonth', 'mis',
  'quantity', 'complaintReported', 'jiDecision',
];

function pickPhase1Fields(source) {
  const result = {};
  for (const key of PHASE1_FIELD_KEYS) {
    if (source[key] !== undefined) {
      result[key] = source[key];
    }
  }
  return result;
}

function deriveClaimFailureMonth(claimFailureDate) {
  if (!claimFailureDate || typeof claimFailureDate !== 'string') return null;
  const match = claimFailureDate.match(/^(\d{4}-\d{2})-\d{2}$/);
  return match ? match[1] : null;
}

async function registerClaim(requestData) {
  const fields = pickPhase1Fields(requestData);
  fields.claimFailureMonth = deriveClaimFailureMonth(fields.claimFailureDate);

  validateClaimRegistration(fields);

  const created = await warrantyRecordRepository.create(fields);

  const eligibleStatus = workflowEngine.advanceIfEligible(created.status, created);
  if (eligibleStatus !== created.status) {
    const updated = await warrantyRecordRepository.update(created.id, { status: eligibleStatus });
    workflowEngine.notifyTransition({
      recordId: created.id,
      fromStatus: created.status,
      toStatus: eligibleStatus,
    });
    return updated;
  }

  return created;
}

async function updateClaimInfo(id, requestData) {
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('A valid record id is required.');
  }

  const existing = await warrantyRecordRepository.findById(id);
  if (!existing) {
    throw new NotFoundError(`Warranty record ${id} was not found.`);
  }

  const incomingFields = pickPhase1Fields(requestData);
  const mergedForValidation = { ...existing, ...incomingFields };
  mergedForValidation.claimFailureMonth = deriveClaimFailureMonth(mergedForValidation.claimFailureDate);

  validateClaimRegistration(mergedForValidation);

  const fieldsToUpdate = {
    ...incomingFields,
    claimFailureMonth: mergedForValidation.claimFailureMonth,
  };

  const eligibleStatus = workflowEngine.advanceIfEligible(existing.status, mergedForValidation);
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

module.exports = { registerClaim, updateClaimInfo };