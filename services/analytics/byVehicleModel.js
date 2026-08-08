const warrantyRecordRepository = require('../../repositories/warrantyRecordRepository');

async function byVehicleModel(filters) {
  return warrantyRecordRepository.getBreakdown('vehicleModel', filters);
}

module.exports = byVehicleModel;