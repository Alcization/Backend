const express = require('express');
const router = express.Router();
const openWeatherCtrl = require('../controllers/openweather.controller');

// Public proxy endpoints for OpenWeather APIs
router.post('/geo/1.0/direct', openWeatherCtrl.getDirectGeocoding);
router.post('/data/2.5/forecast', openWeatherCtrl.getForecast);
router.post('/data/2.5/weather', openWeatherCtrl.getCurrentWeather);
router.post('/data/2.5/history/city', openWeatherCtrl.getCityHistory);

module.exports = router;
