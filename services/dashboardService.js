const warrantyRecordRepository = require('../repositories/warrantyRecordRepository');
const { validateDashboardBreakdown } = require('../utils/validators/queryValidator');
const byCustomer = require('./analytics/byCustomer');
const byRootCause = require('./analytics/byRootCause');
const byMonth = require('./analytics/byMonth');
const byBatchCode = require('./analytics/byBatchCode');
const byVehicleModel = require('./analytics/byVehicleModel');
const byStatus = require('./analytics/byStatus');

const BREAKDOWN_HANDLERS = {
  customer: byCustomer,
  rootCause: byRootCause,
  month: byMonth,
  batchCode: byBatchCode,
  vehicleModel: byVehicleModel,
  status: byStatus,
};

const ALLOWED_FILTER_KEYS = [
  'customer', 'vehicleModel', 'batchCode', 'rootCause', 'status', 'reportingMonth',
];

function pickFilters(query) {
  const filters = {};
  for (const key of ALLOWED_FILTER_KEYS) {
    if (query[key]) {
      filters[key] = query[key];
    }
  }
  return filters;
}

async function getSummary(query) {
  const filters = pickFilters(query);
  return warrantyRecordRepository.getSummary(filters);
}

async function getCharts(query) {
  const by = validateDashboardBreakdown(query.by);
  const filters = pickFilters(query);
  const handler = BREAKDOWN_HANDLERS[by];
  return handler(filters);
}

module.exports = { getSummary, getCharts };