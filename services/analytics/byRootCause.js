const warrantyRecordRepository = require('../../repositories/warrantyRecordRepository');

async function byRootCause(filters) {
  return warrantyRecordRepository.getBreakdown('rootCause', filters);
}

module.exports = byRootCause;