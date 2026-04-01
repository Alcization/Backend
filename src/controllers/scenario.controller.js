const scenarioService = require('../services/scenario.service');

class ScenarioController {
    async createScenario(req, res) {
        const scenario = await scenarioService.createScenario(req.user.id, req.body);
        res.status(201).json({
            success: true,
            data: scenario
        });
    }

    async getScenarios(req, res) {
        const scenarios = await scenarioService.getScenarios(req.user.id, req.query);
        res.json({
            success: true,
            data: scenarios
        });
    }

    async getScenario(req, res) {
        const scenario = await scenarioService.getScenario(req.params.id, req.user.id);
        res.json({
            success: true,
            data: scenario
        });
    }

    async updateScenario(req, res) {
        const scenario = await scenarioService.updateScenario(req.params.id, req.user.id, req.body);
        res.json({
            success: true,
            data: scenario
        });
    }

    async deleteScenario(req, res) {
        await scenarioService.deleteScenario(req.params.id, req.user.id);
        res.json({
            success: true,
            message: 'Scenario deleted successfully'
        });
    }
}

module.exports = new ScenarioController();