const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const predictionRoutes = require('./prediction.routes');
const mapRoutes = require('./map.routes');
const businessRoutes = require('./business.routes');
const adminRoutes = require('./admin.routes');
const routeRoutes = require('./route.routes');
const analysisRoutes = require('./analysis.routes');
const scenarioRoutes = require('./scenario.routes');
const openWeatherRoutes = require('./openweather.routes');
const alertRoutes = require('./alert.routes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/predictions', predictionRoutes); 
router.use('/map', mapRoutes);
router.use('/business', businessRoutes);
router.use('/admin', adminRoutes);
router.use('/routes', routeRoutes);
router.use('/analysis', analysisRoutes);
router.use('/response-scenarios', scenarioRoutes);
router.use('/weather', openWeatherRoutes);
router.use('/alerts', alertRoutes);

module.exports = router;