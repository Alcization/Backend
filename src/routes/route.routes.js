const express = require('express');
const router = express.Router();
const routeController = require('../controllers/route.controller');
const authMiddleware = require('../middleware/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

// All routes require authentication
router.use(authMiddleware);

// Location management
router.get('/locations', asyncHandler(routeController.getLocations));
router.post('/locations', asyncHandler(routeController.createLocation));

// Route management
router.get('/', asyncHandler(routeController.getRoutes));
router.post('/', asyncHandler(routeController.createRoute));
router.get('/:id', asyncHandler(routeController.getRoute));

// Route analysis
router.get('/:id/analysis', asyncHandler(routeController.getRouteAnalysis));

module.exports = router;
