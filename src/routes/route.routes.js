const express = require('express');
const router = express.Router();
const routeController = require('../controllers/route.controller');
const authJwt = require('../middleware/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

// All routes require authentication
router.use(authJwt.verifyToken);

// Location management
router.get('/locations', asyncHandler(routeController.getLocations));
router.post('/locations', asyncHandler(routeController.createLocation));
router.put('/locations/:id', asyncHandler(routeController.updateLocation));
router.delete('/locations/:id', asyncHandler(routeController.deleteLocation));

// Route management
router.get('/', asyncHandler(routeController.getRoutes));
router.post('/', asyncHandler(routeController.createRoute));
router.get('/history', asyncHandler(routeController.getSearchHistory));
router.post('/history', asyncHandler(routeController.createSearchHistory));
router.get('/weather-history', asyncHandler(routeController.getWeatherHistory));
router.post('/weather-history', asyncHandler(routeController.createWeatherHistory));
router.get('/:id', asyncHandler(routeController.getRoute));

// Route analysis
router.get('/:id/analysis', asyncHandler(routeController.getRouteAnalysis));

module.exports = router;
