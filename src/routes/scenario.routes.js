const express = require('express');
const router = express.Router();
const scenarioController = require('../controllers/scenario.controller');
const authJwt = require('../middleware/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

router.use(authJwt.verifyToken);

router.get('/', asyncHandler(scenarioController.getScenarios));
router.post('/', asyncHandler(scenarioController.createScenario));
router.get('/:id', asyncHandler(scenarioController.getScenario));
router.put('/:id', asyncHandler(scenarioController.updateScenario));
router.delete('/:id', asyncHandler(scenarioController.deleteScenario));

module.exports = router;