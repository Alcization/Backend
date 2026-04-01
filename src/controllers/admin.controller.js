const asyncHandler = require('../utils/asyncHandler');
const adminService = require('../services/admin.service');

// GET /admin/areas - Get all admin areas
exports.getAreas = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const areas = await adminService.getAreas(userId);
    res.json(areas);
});

// GET /admin/areas/:id - Get single admin area
exports.getArea = asyncHandler(async (req, res) => {
    const areaId = parseInt(req.params.id);
    const area = await adminService.getAreaById(areaId);
    res.json(area);
});

// POST /admin/areas - Create new admin area
exports.createArea = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const area = await adminService.createArea(userId, req.body);
    res.status(201).json(area);
});

// PUT /admin/areas/:id - Update admin area
exports.updateArea = asyncHandler(async (req, res) => {
    const areaId = parseInt(req.params.id);
    const area = await adminService.updateArea(areaId, req.body);
    res.json(area);
});

// DELETE /admin/areas/:id - Delete admin area
exports.deleteArea = asyncHandler(async (req, res) => {
    const areaId = parseInt(req.params.id);
    const result = await adminService.deleteArea(areaId);
    res.json(result);
});

// GET /admin/scenarios - Get all scenarios
exports.getScenarios = asyncHandler(async (req, res) => {
    const areaId = req.query.area_id ? parseInt(req.query.area_id) : null;
    const scenarios = await adminService.getScenarios(areaId);
    res.json(scenarios);
});

// GET /admin/scenarios/:id - Get single scenario
exports.getScenario = asyncHandler(async (req, res) => {
    const scenarioId = parseInt(req.params.id);
    const scenario = await adminService.getScenario(scenarioId);
    res.json(scenario);
});

// POST /admin/scenarios - Create new scenario
exports.createScenario = asyncHandler(async (req, res) => {
    const scenario = await adminService.createScenario(req.body);
    res.status(201).json(scenario);
});

// POST /admin/scenarios/:id/items - Add checklist item
exports.addChecklistItem = asyncHandler(async (req, res) => {
    const scenarioId = parseInt(req.params.id);
    const item = await adminService.addChecklistItem(scenarioId, req.body);
    res.status(201).json(item);
});

// GET /admin/dashboard - Get admin dashboard
exports.getDashboard = asyncHandler(async (req, res) => {
    const dashboard = await adminService.getDashboard();
    res.json(dashboard);
});

// GET /admin/alerts - Get all alert events
exports.getAlertEvents = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const filters = {
        type: req.query.type,
        level: req.query.level,
        area_id: req.query.area_id ? parseInt(req.query.area_id) : null,
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        limit: req.query.limit,
        offset: req.query.offset
    };
    
    const events = await adminService.getAlertEvents(userId, filters);
    res.json(events);
});

// GET /admin/alerts/:id - Get single alert event
exports.getAlertEvent = asyncHandler(async (req, res) => {
    const alertId = parseInt(req.params.id);
    const event = await adminService.getAlertEventById(alertId);
    res.json(event);
});

// POST /admin/alerts - Create new alert event
exports.createAlertEvent = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const event = await adminService.createAlertEvent(userId, req.body);
    res.status(201).json(event);
});

// PUT /admin/alerts/:id - Update alert event
exports.updateAlertEvent = asyncHandler(async (req, res) => {
    const alertId = parseInt(req.params.id);
    const userId = req.user.id;
    const event = await adminService.updateAlertEvent(alertId, userId, req.body);
    res.json(event);
});

// DELETE /admin/alerts/:id - Delete alert event
exports.deleteAlertEvent = asyncHandler(async (req, res) => {
    const alertId = parseInt(req.params.id);
    const userId = req.user.id;
    const result = await adminService.deleteAlertEvent(alertId, userId);
    res.json(result);
});
