const { LocationAlertRule } = require('../models/locationAlert.model');
const { SavedLocation } = require('../models/route.model');

const ALLOWED_METRICS = ['temp', 'feelslike', 'precip', 'precipprob'];
const ALLOWED_OPERATORS = ['>', '>=', '<', '<='];
const ALLOWED_SCOPES = ['current', 'forecast_24h'];
const ALLOWED_SEVERITIES = ['info', 'warning', 'critical'];

const DEFAULT_UNIT_BY_METRIC = {
    temp: 'C',
    feelslike: 'C',
    precip: 'mm',
    precipprob: '%'
};

const badRequest = (message) => {
    const err = new Error(message);
    err.status = 400;
    return err;
};

const notFound = (message) => {
    const err = new Error(message);
    err.status = 404;
    return err;
};

const validateRulePayload = (data, { partial = false } = {}) => {
    if (!data || typeof data !== 'object') {
        throw badRequest('Request body is required');
    }

    const out = {};

    if (data.metric !== undefined) {
        if (!ALLOWED_METRICS.includes(data.metric)) {
            throw badRequest(`metric must be one of: ${ALLOWED_METRICS.join(', ')}`);
        }
        out.metric = data.metric;
    } else if (!partial) {
        throw badRequest('metric is required');
    }

    if (data.operator !== undefined) {
        if (!ALLOWED_OPERATORS.includes(data.operator)) {
            throw badRequest(`operator must be one of: ${ALLOWED_OPERATORS.join(', ')}`);
        }
        out.operator = data.operator;
    } else if (!partial) {
        throw badRequest('operator is required');
    }

    if (data.threshold !== undefined) {
        const n = Number(data.threshold);
        if (!Number.isFinite(n)) {
            throw badRequest('threshold must be a finite number');
        }
        out.threshold = n;
    } else if (!partial) {
        throw badRequest('threshold is required');
    }

    if (data.scope !== undefined) {
        if (!ALLOWED_SCOPES.includes(data.scope)) {
            throw badRequest(`scope must be one of: ${ALLOWED_SCOPES.join(', ')}`);
        }
        out.scope = data.scope;
    }

    if (data.severity !== undefined) {
        if (!ALLOWED_SEVERITIES.includes(data.severity)) {
            throw badRequest(`severity must be one of: ${ALLOWED_SEVERITIES.join(', ')}`);
        }
        out.severity = data.severity;
    }

    if (data.cooldown_minutes !== undefined) {
        const n = Number(data.cooldown_minutes);
        if (!Number.isInteger(n) || n < 0) {
            throw badRequest('cooldown_minutes must be a non-negative integer');
        }
        out.cooldown_minutes = n;
    }

    if (data.is_enabled !== undefined) {
        out.is_enabled = Boolean(data.is_enabled);
    }

    if (data.unit !== undefined) {
        out.unit = data.unit;
    } else if (!partial && out.metric) {
        out.unit = DEFAULT_UNIT_BY_METRIC[out.metric];
    }

    return out;
};

const assertLocationOwnership = async (locationId, userId) => {
    const location = await SavedLocation.findOne({
        where: { location_id: locationId, user_id: userId }
    });
    if (!location) {
        throw notFound('Saved location not found');
    }
    return location;
};

class AlertRuleService {
    async listRules(userId, { locationId } = {}) {
        const where = { user_id: userId };
        if (locationId) where.location_id = locationId;
        return LocationAlertRule.findAll({
            where,
            order: [['rule_id', 'DESC']]
        });
    }

    async getRule(ruleId, userId) {
        const rule = await LocationAlertRule.findOne({
            where: { rule_id: ruleId, user_id: userId }
        });
        if (!rule) throw notFound('Rule not found');
        return rule;
    }

    async createRule(userId, data) {
        if (!data || data.location_id === undefined) {
            throw badRequest('location_id is required');
        }
        const locationId = Number(data.location_id);
        if (!Number.isInteger(locationId)) {
            throw badRequest('location_id must be an integer');
        }
        await assertLocationOwnership(locationId, userId);

        const payload = validateRulePayload(data);
        return LocationAlertRule.create({
            user_id: userId,
            location_id: locationId,
            ...payload
        });
    }

    async updateRule(ruleId, userId, data) {
        const rule = await this.getRule(ruleId, userId);
        const payload = validateRulePayload(data, { partial: true });
        if (Object.keys(payload).length === 0) {
            throw badRequest('No fields provided for update');
        }
        await rule.update(payload);
        return rule;
    }

    async deleteRule(ruleId, userId) {
        const deleted = await LocationAlertRule.destroy({
            where: { rule_id: ruleId, user_id: userId }
        });
        if (!deleted) throw notFound('Rule not found');
        return true;
    }
}

module.exports = new AlertRuleService();
module.exports.DEFAULT_UNIT_BY_METRIC = DEFAULT_UNIT_BY_METRIC;
