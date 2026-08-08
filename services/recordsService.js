const warrantyRecordRepository = require('../repositories/warrantyRecordRepository');
const { validateListQuery } = require('../utils/validators/queryValidator');
const { ValidationError, NotFoundError } = require('../utils/errors');

const ALLOWED_FILTER_KEYS = [
  'customer',
  'vehicleModel',
  'batchCode',
  'rootCause',
  'status',
  'reportingMonth',
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

async function listRecords(query) {
  const { page, pageSize, sortBy, sortDir } = validateListQuery(query);
  const filters = pickFilters(query);
  const search = typeof query.search === 'string' ? query.search.trim() : '';

  const { records, totalRecords } = await warrantyRecordRepository.findAll({
    page,
    pageSize,
    sortBy,
    sortDir,
    search,
    filters,
  });

  return {
    records,
    pagination: {
      page,
      pageSize,
      totalRecords,
      totalPages: Math.ceil(totalRecords / pageSize) || 1,
    },
  };
}

async function getRecord(id) {
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('A valid record id is required.');
  }

  const record = await warrantyRecordRepository.findById(id);
  if (!record) {
    throw new NotFoundError(`Warranty record ${id} was not found.`);
  }

  return record;
}

async function deleteRecord(id) {
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('A valid record id is required.');
  }

  const result = await warrantyRecordRepository.softDelete(id);
  if (!result) {
    throw new NotFoundError(`Warranty record ${id} was not found.`);
  }

  return result;
}

module.exports = { listRecords, getRecord, deleteRecord };