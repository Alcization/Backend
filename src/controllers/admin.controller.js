const asyncHandler = require('../utils/asyncHandler');
const adminService = require('../services/admin.service');

// GET /admin/areas - Get all admin areas
exports.getAreas = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const areas = await adminService.getAreas(userId);
    res.json(areas);
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
