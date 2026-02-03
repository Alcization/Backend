const express = require('express');
const router = express.Router();
const mapCtrl = require('../controllers/map.controller');

// All map routes are public (no authentication required for map data)

// Traffic data
router.get('/traffic', mapCtrl.getTraffic);

// Weather areas
router.get('/weather-areas', mapCtrl.getWeatherAreas);

// Incidents (floods, accidents)
router.get('/incidents', mapCtrl.getIncidents);

module.exports = router;
