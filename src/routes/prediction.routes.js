const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/prediction.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Bảo vệ endpoint bằng middleware xác thực
router.post('/risk-evaluate', authMiddleware.verifyToken, predictionController.evaluateRouteRisk);

// API dự báo thời tiết nhanh
// router.post('/forecast', predictionController.getForecast);

module.exports = router;