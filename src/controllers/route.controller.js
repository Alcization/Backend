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
     * PUT /routes/locations/:id - Update a saved location
     */
    async updateLocation(req, res) {
        const location = await routeService.updateLocation(req.params.id, req.user.id, req.body);
        res.json({
            success: true,
            data: location
        });
    }

    /**
     * DELETE /routes/locations/:id - Delete a saved location
     */
    async deleteLocation(req, res) {
        await routeService.deleteLocation(req.params.id, req.user.id);
        res.json({
            success: true,
            message: 'Location deleted successfully'
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
     * PUT /routes/favorites/:id - Update a saved favorite route
     */
    async updateRoute(req, res) {
        const route = await routeService.updateRoute(req.params.id, req.user.id, req.body);
        res.json({
            success: true,
            data: route
        });
    }

    /**
     * DELETE /routes/favorites/:id - Delete a saved favorite route
     */
    async deleteRoute(req, res) {
        await routeService.deleteRoute(req.params.id, req.user.id);
        res.json({
            success: true,
            message: 'Route deleted successfully'
        });
    }

    /**
     * POST /routes/history - Save route search history
     */
    async createSearchHistory(req, res) {
        const history = await routeService.createSearchHistory(req.user.id, req.body);
        res.status(201).json({
            success: true,
            data: history
        });
    }

    /**
     * GET /routes/history - Get route search history
     */
    async getSearchHistory(req, res) {
        const history = await routeService.getSearchHistory(req.user.id);
        res.json({
            success: true,
            data: history
        });
    }

    /**
     * POST /routes/weather-history - Save weather search history
     */
    async createWeatherHistory(req, res) {
        const history = await routeService.createWeatherHistory(req.user.id, req.body);
        res.status(201).json({
            success: true,
            data: history
        });
    }

    /**
     * GET /routes/weather-history - Get weather search history
     */
    async getWeatherHistory(req, res) {
        const history = await routeService.getWeatherHistory(req.user.id);
        res.json({
            success: true,
            data: history
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
