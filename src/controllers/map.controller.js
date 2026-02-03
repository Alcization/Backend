const asyncHandler = require('../utils/asyncHandler');
const mapService = require('../services/map.service');

// GET /map/traffic - Get traffic data in GeoJSON format
exports.getTraffic = asyncHandler(async (req, res) => {
    const trafficData = await mapService.getTrafficData();
    res.json(trafficData);
});

// GET /map/weather-areas - Get weather areas with current weather
exports.getWeatherAreas = asyncHandler(async (req, res) => {
    const weatherAreas = await mapService.getWeatherAreas();
    res.json(weatherAreas);
});

// GET /map/incidents - Get current incidents (floods, accidents)
exports.getIncidents = asyncHandler(async (req, res) => {
    const incidents = await mapService.getIncidents();
    res.json(incidents);
});
