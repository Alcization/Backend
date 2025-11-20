const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const predictionRoutes = require('./prediction.routes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/predictions', predictionRoutes); 
// Ví dụ: POST /api/predictions/risk-evaluate

module.exports = router;