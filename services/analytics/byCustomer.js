const warrantyRecordRepository = require('../../repositories/warrantyRecordRepository');

async function byCustomer(filters) {
  return warrantyRecordRepository.getBreakdown('customer', filters);
}

module.exports = byCustomer;