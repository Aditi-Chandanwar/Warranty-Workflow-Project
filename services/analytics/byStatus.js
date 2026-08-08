const warrantyRecordRepository = require('../../repositories/warrantyRecordRepository');

async function byStatus(filters) {
  return warrantyRecordRepository.getBreakdown('status', filters);
}

module.exports = byStatus;