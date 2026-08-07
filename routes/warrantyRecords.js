const express = require('express');
const router = express.Router();
const claimRegistrationController = require('../controllers/claimRegistrationController');
const analysisController = require('../controllers/analysisController');
const recordsController = require('../controllers/recordsController');

// ----- Claim Registration (Module 6) -----
router.post('/', claimRegistrationController.createClaim);
router.patch('/:id/claim-info', claimRegistrationController.updateClaimInfo);

// ----- Analysis (Module 7) -----
router.patch('/:id/analysis', analysisController.updateAnalysis);

// ----- Records / retrieval (Module 8) -----
router.get('/', recordsController.listRecords);
router.get('/:id', recordsController.getRecord);
router.delete('/:id', recordsController.deleteRecord);

module.exports = router;