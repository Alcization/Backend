const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { ResponseScenario, ScenarioStep } = require('../models/scenario.model');

const PRIORITY_MAP = {
    high: 'high',
    medium: 'medium',
    low: 'low',
    cao: 'high',
    thap: 'low',
    trungbinh: 'medium',
    trung_binh: 'medium',
    'trung bình': 'medium'
};

class ScenarioService {
    async createScenario(userId, data) {
        if (!data || typeof data !== 'object') {
            const error = new Error('Request body is required');
            error.status = 400;
            throw error;
        }

        const name = this._normalizeText(data.name);
        const applicableEventType = this._normalizeText(data.applicable_event_type);
        const steps = this._validateSteps(data.steps, true);

        if (!name) {
            const error = new Error('name is required');
            error.status = 400;
            throw error;
        }

        if (!applicableEventType) {
            const error = new Error('applicable_event_type is required');
            error.status = 400;
            throw error;
        }

        const t = await sequelize.transaction();

        try {
            const scenario = await ResponseScenario.create({
                user_id: userId,
                name,
                applicable_event_type: applicableEventType
            }, { transaction: t });

            await ScenarioStep.bulkCreate(
                steps.map(step => ({
                    scenario_id: scenario.scenario_id,
                    step: step.step,
                    content: step.content,
                    priority: step.priority
                })),
                { transaction: t }
            );

            const createdScenario = await this._getScenarioById(scenario.scenario_id, userId, t);
            await t.commit();
            return createdScenario;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    async getScenarios(userId, filters = {}) {
        const where = { user_id: userId };

        const eventType = this._normalizeText(filters.applicable_event_type);
        if (eventType) {
            where.applicable_event_type = { [Op.iLike]: `%${eventType}%` };
        }

        const name = this._normalizeText(filters.name);
        if (name) {
            where.name = { [Op.iLike]: `%${name}%` };
        }

        return ResponseScenario.findAll({
            where,
            include: [{
                model: ScenarioStep,
                as: 'steps',
                required: false
            }],
            order: [
                ['scenario_id', 'DESC'],
                [{ model: ScenarioStep, as: 'steps' }, 'step', 'ASC']
            ]
        });
    }

    async getScenario(scenarioId, userId) {
        const scenario = await this._getScenarioById(scenarioId, userId);
        if (!scenario) {
            const error = new Error('Scenario not found');
            error.status = 404;
            throw error;
        }
        return scenario;
    }

    async updateScenario(scenarioId, userId, data) {
        if (!data || typeof data !== 'object') {
            const error = new Error('Request body is required');
            error.status = 400;
            throw error;
        }

        const existingScenario = await this._getScenarioById(scenarioId, userId);
        if (!existingScenario) {
            const error = new Error('Scenario not found');
            error.status = 404;
            throw error;
        }

        const updateData = {};

        if (data.name !== undefined) {
            const name = this._normalizeText(data.name);
            if (!name) {
                const error = new Error('name must be a non-empty string');
                error.status = 400;
                throw error;
            }
            updateData.name = name;
        }

        if (data.applicable_event_type !== undefined) {
            const applicableEventType = this._normalizeText(data.applicable_event_type);
            if (!applicableEventType) {
                const error = new Error('applicable_event_type must be a non-empty string');
                error.status = 400;
                throw error;
            }
            updateData.applicable_event_type = applicableEventType;
        }

        let steps = null;
        if (data.steps !== undefined) {
            steps = this._validateSteps(data.steps, false);
        }

        if (!Object.keys(updateData).length && steps === null) {
            const error = new Error('No fields provided for update');
            error.status = 400;
            throw error;
        }

        const t = await sequelize.transaction();

        try {
            if (Object.keys(updateData).length) {
                await ResponseScenario.update(updateData, {
                    where: { scenario_id: scenarioId, user_id: userId },
                    transaction: t
                });
            }

            if (steps !== null) {
                await ScenarioStep.destroy({
                    where: { scenario_id: scenarioId },
                    transaction: t
                });

                if (steps.length) {
                    await ScenarioStep.bulkCreate(
                        steps.map(step => ({
                            scenario_id: Number(scenarioId),
                            step: step.step,
                            content: step.content,
                            priority: step.priority
                        })),
                        { transaction: t }
                    );
                }
            }

            const updatedScenario = await this._getScenarioById(scenarioId, userId, t);
            await t.commit();
            return updatedScenario;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    async deleteScenario(scenarioId, userId) {
        const t = await sequelize.transaction();

        try {
            const scenario = await ResponseScenario.findOne({
                where: { scenario_id: scenarioId, user_id: userId },
                transaction: t
            });

            if (!scenario) {
                const error = new Error('Scenario not found');
                error.status = 404;
                throw error;
            }

            await ScenarioStep.destroy({
                where: { scenario_id: scenarioId },
                transaction: t
            });

            await ResponseScenario.destroy({
                where: { scenario_id: scenarioId, user_id: userId },
                transaction: t
            });

            await t.commit();
            return true;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    async _getScenarioById(scenarioId, userId, transaction = undefined) {
        return ResponseScenario.findOne({
            where: {
                scenario_id: scenarioId,
                user_id: userId
            },
            include: [{
                model: ScenarioStep,
                as: 'steps',
                required: false
            }],
            order: [[{ model: ScenarioStep, as: 'steps' }, 'step', 'ASC']],
            transaction
        });
    }

    _validateSteps(steps, isRequired) {
        if (steps === undefined || steps === null) {
            if (isRequired) {
                const error = new Error('steps is required');
                error.status = 400;
                throw error;
            }
            return [];
        }

        if (!Array.isArray(steps)) {
            const error = new Error('steps must be an array');
            error.status = 400;
            throw error;
        }

        if (isRequired && !steps.length) {
            const error = new Error('steps must contain at least one item');
            error.status = 400;
            throw error;
        }

        const validated = steps.map((stepItem, index) => {
            if (!stepItem || typeof stepItem !== 'object') {
                const error = new Error(`steps[${index}] must be an object`);
                error.status = 400;
                throw error;
            }

            const stepNumber = Number(stepItem.step);
            if (!Number.isInteger(stepNumber) || stepNumber <= 0) {
                const error = new Error(`steps[${index}].step must be a positive integer`);
                error.status = 400;
                throw error;
            }

            const content = this._normalizeText(stepItem.content);
            if (!content) {
                const error = new Error(`steps[${index}].content is required`);
                error.status = 400;
                throw error;
            }

            const rawPriority = this._normalizeText(stepItem.priority)?.toLowerCase();
            const priority = rawPriority ? PRIORITY_MAP[rawPriority] : undefined;
            if (!priority) {
                const error = new Error(`steps[${index}].priority must be high, medium or low`);
                error.status = 400;
                throw error;
            }

            return {
                step: stepNumber,
                content,
                priority
            };
        });

        const stepSet = new Set();
        for (const item of validated) {
            if (stepSet.has(item.step)) {
                const error = new Error('steps.step values must be unique in a scenario');
                error.status = 400;
                throw error;
            }
            stepSet.add(item.step);
        }

        return validated.sort((a, b) => a.step - b.step);
    }

    _normalizeText(value) {
        if (typeof value !== 'string') {
            return null;
        }

        const trimmed = value.trim();
        return trimmed.length ? trimmed : null;
    }
}

module.exports = new ScenarioService();