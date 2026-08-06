const config = require('../config');

/**
 * workflowEngine
 *
 * Responsible for advancing a warranty record's business-lifecycle `status`
 * based on which fields are currently populated. Status represents the
 * HIGHEST milestone the case has ever reached — it never regresses when a
 * field is later edited or cleared. Phase 1 and Phase 2 fields both remain
 * freely editable; only the workflow engine ever changes `status`, and only
 * ever forward.
 *
 * This module is intentionally free of database access and HTTP concerns —
 * callers (claimRegistrationService, analysisService) pass in a plain record
 * object and persist the returned status themselves via the repository.
 */

const MILESTONES = config.workflow.statuses;
// ['Pending Part Receipt', 'Part Received', 'Under Analysis', 'Completed']

/**
 * Determines the highest milestone the given record data currently
 * qualifies for, evaluated independently of what status is currently
 * stored. Checked from highest to lowest so multi-field updates in a
 * single save correctly skip ahead when all conditions for a higher
 * milestone are already satisfied.
 *
 * @param {Object} record - merged record data (existing + incoming changes)
 * @returns {string} one of MILESTONES
 */
function evaluateMilestone(record) {
  if (record.rootCause && record.action && record.finalClassification) {
    return 'Completed';
  }

  if (isNonEmpty(record.qreObservation) || isNonEmpty(record.warrantyCellObservation)) {
    return 'Under Analysis';
  }

  if (isNonEmpty(record.partReceivedOn)) {
    return 'Part Received';
  }

  return 'Pending Part Receipt';
}

/**
 * Given the record's current stored status and its current field data,
 * returns the status the record SHOULD have after this save — advancing
 * forward if the data now qualifies for a higher milestone, otherwise
 * returning the current status unchanged. Never returns a lower milestone
 * than currentStatus.
 *
 * @param {string} currentStatus - the status currently stored for this record
 * @param {Object} record - merged record data (existing + incoming changes)
 * @returns {string} the status to persist
 */
function advanceIfEligible(currentStatus, record) {
  const eligibleStatus = evaluateMilestone(record);

  const currentIndex = MILESTONES.indexOf(currentStatus);
  const eligibleIndex = MILESTONES.indexOf(eligibleStatus);

  // Defensive fallback: an unrecognized stored status (shouldn't happen given
  // the CHECK constraint) is treated as the lowest milestone rather than
  // throwing, so a bad legacy value can't block future advancement.
  const safeCurrentIndex = currentIndex === -1 ? 0 : currentIndex;

  return eligibleIndex > safeCurrentIndex ? eligibleStatus : currentStatus;
}

/**
 * Treats a value as "started" if it is a non-null, non-empty string after
 * trimming whitespace. Non-string truthy values (should not occur for these
 * fields, but defensively handled) are treated as present.
 */
function isNonEmpty(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return Boolean(value);
}

// ---- Extension seam for future notifications / SLA / escalation features ----
// Not used in Version 1. Registering a listener here, and calling it from
// notifyTransition() below, is the entire integration point for those
// features later — no change to claimRegistrationService, analysisService,
// or this engine's core logic will be required.

const transitionListeners = [];

/**
 * Registers a callback to be invoked whenever a real status transition
 * occurs. Unused in V1 — reserved for future notification/SLA features.
 * @param {Function} handler - ({ recordId, fromStatus, toStatus }) => void
 */
function onTransition(handler) {
  transitionListeners.push(handler);
}

/**
 * Invoked by services after persisting a status change, only when
 * fromStatus !== toStatus. Fires all registered listeners synchronously.
 * Safe to call even with zero listeners registered (V1 default).
 */
function notifyTransition({ recordId, fromStatus, toStatus }) {
  if (fromStatus === toStatus) return;
  for (const handler of transitionListeners) {
    handler({ recordId, fromStatus, toStatus });
  }
}

module.exports = {
  evaluateMilestone,
  advanceIfEligible,
  onTransition,
  notifyTransition,
};