const asyncHandler = require('../utils/asyncHandler');
const openWeatherService = require('../services/openweather.service');

const resolveParams = (req) => {
    if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
        return req.body;
    }

    return req.query;
};

exports.getDirectGeocoding = asyncHandler(async (req, res) => {
    const data = await openWeatherService.getDirectGeocoding(resolveParams(req));
    res.json(data);
});

exports.getForecast = asyncHandler(async (req, res) => {
    const data = await openWeatherService.getHourlyForecast(resolveParams(req));
    res.json(data);
});

exports.getHourlyForecast = asyncHandler(async (req, res) => {
    const data = await openWeatherService.getHourlyForecast(resolveParams(req));
    res.json(data);
});

exports.getDailyForecast = asyncHandler(async (req, res) => {
    const data = await openWeatherService.getDailyForecast(resolveParams(req));
    res.json(data);
});

exports.getCurrentWeather = asyncHandler(async (req, res) => {
    const data = await openWeatherService.getCurrentWeather(resolveParams(req));
    res.json(data);
});

exports.getCityHistory = asyncHandler(async (req, res) => {
    const data = await openWeatherService.getCityHistory(resolveParams(req));
    res.json(data);
});
