const analysisService = require('../services/analysisService');
const { asyncHandler } = require('../utils/errorHandler');
const { sendSuccess } = require('../utils/apiResponse');

const updateAnalysis = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const record = await analysisService.updateAnalysis(id, req.body);
  sendSuccess(res, 200, 'Analysis updated successfully', record);
});

module.exports = { updateAnalysis };