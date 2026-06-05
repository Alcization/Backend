const { Op } = require('sequelize');
const { LocationAlertRule } = require('../models/locationAlert.model');
const { SavedLocation } = require('../models/route.model');
const openWeatherService = require('./openweather.service');
const alertEventService = require('./alertEvent.service');
const pushDelivery = require('./pushDelivery.service');

const compare = (value, operator, threshold) => {
    switch (operator) {
        case '>': return value > threshold;
        case '>=': return value >= threshold;
        case '<': return value < threshold;
        case '<=': return value <= threshold;
        default: return false;
    }
};

const extractCurrentMetric = (metric, current) => {
    if (!current) return null;
    const main = current.main || {};
    const rain = current.rain || {};
    switch (metric) {
        case 'temp': return typeof main.temp === 'number' ? main.temp : null;
        case 'feelslike': return typeof main.feels_like === 'number' ? main.feels_like : null;
        case 'precip': return Number(rain['1h'] ?? rain['3h'] ?? 0);
        case 'precipprob':
            // current weather endpoint doesn't expose pop; fall back to 0
            return null;
        default: return null;
    }
};

const aggregateForecastMetric = (metric, hourly, operator) => {
    if (!Array.isArray(hourly) || hourly.length === 0) return null;
    const isUpper = operator === '>' || operator === '>=';
    const reducer = isUpper ? Math.max : Math.min;
    const values = hourly.map((item) => {
        switch (metric) {
            case 'temp': return typeof item.temp === 'number' ? item.temp : null;
            case 'feelslike': return typeof item.feels_like === 'number' ? item.feels_like : null;
            case 'precip': {
                const rain = item.rain || {};
                return Number(rain['1h'] ?? rain['3h'] ?? 0);
            }
            case 'precipprob':
                return typeof item.pop === 'number' ? item.pop * 100 : null;
            default: return null;
        }
    }).filter((v) => v !== null && Number.isFinite(v));
    if (values.length === 0) return null;
    return reducer(...values);
};

const buildAlertPayload = (rule, location, value) => {
    const placeName = location.custom_name || location.address || `Location #${location.location_id}`;
    const metricLabel = {
        temp: 'Temperature',
        feelslike: 'Feels like',
        precip: 'Rainfall',
        precipprob: 'Rain probability'
    }[rule.metric] || rule.metric;
    const unit = rule.unit || '';
    const title = `${metricLabel} alert: ${placeName}`;
    const body = `${metricLabel} is ${value?.toFixed?.(1) ?? value}${unit} (${rule.operator} ${rule.threshold}${unit}).`;
    return {
        title,
        body,
        severity: rule.severity,
        rule_id: rule.rule_id,
        location_id: rule.location_id,
        location_name: placeName,
        metric: rule.metric,
        operator: rule.operator,
        threshold: rule.threshold,
        value,
        unit,
        scope: rule.scope,
        issued_at: new Date().toISOString()
    };
};

class AlertEvaluatorService {
    async evaluateAll({ logger = console } = {}) {
        const rules = await LocationAlertRule.findAll({
            where: { is_enabled: true },
            include: [{ model: SavedLocation, required: true }]
        });

        if (rules.length === 0) return { evaluated: 0, fired: 0 };

        // Cache weather lookups per (lat,lon,scope) to spare the OpenWeather quota.
        const cache = new Map();
        const fetchWeather = async (lat, lon, scope) => {
            const key = `${scope}:${lat.toFixed(3)},${lon.toFixed(3)}`;
            if (cache.has(key)) return cache.get(key);
            const promise = (async () => {
                if (scope === 'current') {
                    return openWeatherService.getCurrentWeather({ lat, lon, units: 'metric' });
                }
                const { data } = await openWeatherService._getHourlyForecast({ lat, lon, units: 'metric' });
                return data;
            })();
            cache.set(key, promise);
            return promise;
        };

        let fired = 0;
        for (const rule of rules) {
            try {
                const location = rule.SavedLocation;
                const lat = Number(location?.latitude);
                const lon = Number(location?.longitude);
                if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

                const weather = await fetchWeather(lat, lon, rule.scope);
                let value = null;
                if (rule.scope === 'current') {
                    value = extractCurrentMetric(rule.metric, weather);
                } else {
                    const list = Array.isArray(weather.list) ? weather.list.slice(0, 24) : [];
                    const normalized = list.map((item) => ({
                        temp: item.main?.temp,
                        feels_like: item.main?.feels_like,
                        rain: item.rain,
                        pop: item.pop
                    }));
                    value = aggregateForecastMetric(rule.metric, normalized, rule.operator);
                }

                if (value === null || !Number.isFinite(value)) continue;
                if (!compare(value, rule.operator, Number(rule.threshold))) continue;

                // Cooldown gate
                if (rule.last_triggered_at) {
                    const ageMs = Date.now() - new Date(rule.last_triggered_at).getTime();
                    if (ageMs < rule.cooldown_minutes * 60_000) {
                        continue;
                    }
                }

                const payload = buildAlertPayload(rule, location, value);

                await alertEventService.create(rule.user_id, {
                    name: payload.title,
                    description: payload.body,
                    type: 'LocationAlert'
                });
                await pushDelivery.deliver(rule.user_id, payload);
                await rule.update({ last_triggered_at: new Date(), last_value: value });
                fired += 1;
            } catch (err) {
                logger.error?.('[alert-evaluator] rule failed', rule.rule_id, err?.message || err);
            }
        }

        return { evaluated: rules.length, fired };
    }

    async evaluateRuleById(ruleId) {
        const rule = await LocationAlertRule.findByPk(ruleId, {
            include: [{ model: SavedLocation, required: true }]
        });
        if (!rule) return null;
        // Reuse evaluateAll path by temporarily filtering — simpler to call directly:
        const saved = await LocationAlertRule.findAll({
            where: { rule_id: ruleId, is_enabled: true },
            include: [{ model: SavedLocation, required: true }]
        });
        if (saved.length === 0) return { evaluated: 0, fired: 0 };
        return this.evaluateAll();
    }
}

module.exports = new AlertEvaluatorService();
