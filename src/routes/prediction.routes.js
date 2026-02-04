const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/prediction.controller');
const authJwt = require('../middleware/auth.middleware');

// Bảo vệ endpoint bằng middleware xác thực JWT
router.post('/risk-evaluate', authJwt.verifyToken, predictionController.evaluateRouteRisk);

// API dự báo thời tiết nhanh
// router.post('/forecast', predictionController.getForecast);

module.exports = router;