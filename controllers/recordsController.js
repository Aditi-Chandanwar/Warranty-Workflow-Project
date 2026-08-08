const recordsService = require('../services/recordsService');
const { asyncHandler } = require('../utils/errorHandler');
const { sendSuccess } = require('../utils/apiResponse');

const listRecords = asyncHandler(async (req, res) => {
  const result = await recordsService.listRecords(req.query);
  sendSuccess(res, 200, 'Records retrieved', result);
});

const getRecord = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const record = await recordsService.getRecord(id);
  sendSuccess(res, 200, 'Record retrieved', record);
});

const deleteRecord = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const result = await recordsService.deleteRecord(id);
  sendSuccess(res, 200, 'Record deleted successfully', result);
});

module.exports = { listRecords, getRecord, deleteRecord };