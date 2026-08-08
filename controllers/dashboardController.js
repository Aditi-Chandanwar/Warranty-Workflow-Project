const dashboardService = require('../services/dashboardService');
const { asyncHandler } = require('../utils/errorHandler');
const { sendSuccess } = require('../utils/apiResponse');

const getSummary = asyncHandler(async (req, res) => {
  const summary = await dashboardService.getSummary(req.query);
  sendSuccess(res, 200, 'Dashboard summary retrieved', summary);
});

const getCharts = asyncHandler(async (req, res) => {
  const chartData = await dashboardService.getCharts(req.query);
  sendSuccess(res, 200, 'Chart data retrieved', chartData);
});

module.exports = { getSummary, getCharts };