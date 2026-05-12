const express = require('express');
const router = express.Router();
const openWeatherCtrl = require('../controllers/openweather.controller');

// Public proxy endpoints for OpenWeather APIs
router.post('/geo', openWeatherCtrl.getDirectGeocoding);
router.post('/data/forecast', openWeatherCtrl.getHourlyForecast);
router.post('/data/forecast/hourly', openWeatherCtrl.getHourlyForecast);
router.post('/data/forecast/daily', openWeatherCtrl.getDailyForecast);
router.post('/data/weather', openWeatherCtrl.getCurrentWeather);
router.post('/data/history/city', openWeatherCtrl.getCityHistory);

module.exports = router;
