const routeService = require('../services/route.service');

class RouteController {
    /**
     * GET /routes/locations - Get all saved locations
     */
    async getLocations(req, res) {
        const locations = await routeService.getLocations(req.user.id);
        res.json({
            success: true,
            data: locations
        });
    }

    /**
     * POST /routes/locations - Save a new location
     */
    async createLocation(req, res) {
        const location = await routeService.createLocation(req.user.id, req.body);
        res.status(201).json({
            success: true,
            data: location
        });
    }

    /**
     * GET /routes - Get all saved routes
     */
    async getRoutes(req, res) {
        const routes = await routeService.getRoutes(req.user.id);
        res.json({
            success: true,
            data: routes
        });
    }

    /**
     * POST /routes - Create a new route
     */
    async createRoute(req, res) {
        const route = await routeService.createRoute(req.user.id, req.body);
        res.status(201).json({
            success: true,
            data: route
        });
    }

    /**
     * GET /routes/:id - Get route details
     */
    async getRoute(req, res) {
        const route = await routeService.getRoute(req.params.id, req.user.id);
        res.json({
            success: true,
            data: route
        });
    }

    /**
     * GET /routes/:id/analysis - Get route analysis (weather + traffic)
     */
    async getRouteAnalysis(req, res) {
        const analysis = await routeService.getRouteAnalysis(req.params.id, req.user.id);
        res.json({
            success: true,
            data: analysis
        });
    }
}

module.exports = new RouteController();
