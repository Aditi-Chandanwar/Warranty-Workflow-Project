const claimRegistrationService = require('../services/claimRegistrationService');
const { asyncHandler } = require('../utils/errorHandler');
const { sendSuccess } = require('../utils/apiResponse');

const createClaim = asyncHandler(async (req, res) => {
  const record = await claimRegistrationService.registerClaim(req.body);
  sendSuccess(res, 201, 'Claim registered successfully', record);
});

const updateClaimInfo = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const record = await claimRegistrationService.updateClaimInfo(id, req.body);
  sendSuccess(res, 200, 'Claim information updated successfully', record);
});

module.exports = { createClaim, updateClaimInfo };