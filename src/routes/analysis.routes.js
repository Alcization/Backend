const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysis.controller');
const authJwt = require('../middleware/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

// All routes require authentication
router.use(authJwt.verifyToken);

// Weather forecast
router.get('/forecast', asyncHandler(analysisController.getForecast));

// Trip risk assessment
router.post('/assess-risk', asyncHandler(analysisController.assessRisk));

module.exports = router;
