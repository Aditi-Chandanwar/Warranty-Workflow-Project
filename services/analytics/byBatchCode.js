const warrantyRecordRepository = require('../../repositories/warrantyRecordRepository');

async function byBatchCode(filters) {
  return warrantyRecordRepository.getBreakdown('batchCode', filters);
}

module.exports = byBatchCode;