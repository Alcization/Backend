const { Op } = require('sequelize');
const { AdminArea, AdministrativeOfficer, AlertEvent } = require('../models/admin.model');
const { NotificationEvent } = require('../models/notification.model');
const openWeatherService = require('./openweather.service');
const pushDelivery = require('./pushDelivery.service');

// Cooldown between repeat notifications for the same (area, metric).
const COOLDOWN_MINUTES = Number(process.env.AREA_NOTIFY_COOLDOWN_MINUTES || 60);

// Internal type code stored on alert_event.type — kept in English so existing
// admin filters / queries (?type=Temperature) still work.
const TYPE_BY_METRIC = {
	temp: 'Temperature',
	rain: 'Rain'
};

// User-facing Vietnamese label shown in title/body of the push.
const LABEL_BY_METRIC = {
	temp: 'nhiệt độ',
	rain: 'lượng mưa'
};

const UNIT_BY_METRIC = {
	temp: '°C',
	rain: 'mm'
};

const extractCenter = (area) => {
	const mgmt = area?.management_area;
	if (!mgmt || typeof mgmt !== 'object') return null;
	const c = mgmt.center;
	if (!c) return null;
	const lat = Number(c.lat);
	const lng = Number(c.lng);
	if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
	return { lat, lng };
};

const extractCurrentMetric = (metric, current) => {
	if (!current) return null;
	if (metric === 'temp') {
		const t = current.main?.temp;
		return typeof t === 'number' ? t : null;
	}
	if (metric === 'rain') {
		const rain = current.rain || {};
		return Number(rain['1h'] ?? rain['3h'] ?? 0);
	}
	return null;
};

const recentlyNotified = async (areaId, type, sinceMs) => {
	const event = await AlertEvent.findOne({
		where: {
			area_id: areaId,
			type,
			issue_at: { [Op.gte]: new Date(sinceMs) }
		},
		order: [['issue_at', 'DESC']]
	});
	return !!event;
};

const resolveOfficerUserId = async (area) => {
	if (!area.officer_id) return null;
	const officer = await AdministrativeOfficer.findByPk(area.officer_id);
	return officer?.user_id || null;
};

const buildPayload = ({ area, metric, value, threshold }) => {
	const label = LABEL_BY_METRIC[metric] || metric;
	const unit = UNIT_BY_METRIC[metric];
	const formattedValue = value?.toFixed?.(1) ?? value;
	return {
		// `kind` lets the frontend tell area alerts apart from per-user location alerts
		// without having to inspect which id keys are present.
		kind: 'area_alert',
		title: `Cảnh báo ${label} — ${area.name}`,
		body: `${label.charAt(0).toUpperCase()}${label.slice(1)} hiện ${formattedValue}${unit} đã vượt ngưỡng ${threshold}${unit} tại "${area.name}".`,
		severity: 'warning',
		area_id: area.area_id,
		area_name: area.name,
		metric,
		value,
		unit,
		threshold,
		issued_at: new Date().toISOString()
	};
};

class AreaNotificationEvaluator {
	/**
	 * Evaluate a single area against its temp_threshold / rain_threshold.
	 * @returns one of:
	 *   { area_id, fired: [{metric, value, threshold}], skipped: [{metric, reason, value?}] }
	 */
	async evaluateArea(areaId, userId, { logger = console, force = false } = {}) {
		const area = await AdminArea.findByPk(areaId);
		if (!area) {
			const err = new Error('Area not found');
			err.status = 404;
			throw err;
		}

		// Ownership: officers may only evaluate their own areas.
		// If the area is orphaned (officer_id NULL), claim it for the caller — auto-creating
		// their officer row if needed — so legacy areas created before auto-provisioning
		// can still send notifications.
		let officer = await AdministrativeOfficer.findOne({ where: { user_id: userId } });
		if (officer && area.officer_id && area.officer_id !== officer.officer_id) {
			const err = new Error('You do not manage this area');
			err.status = 403;
			throw err;
		}
		if (!area.officer_id) {
			if (!officer) {
				officer = await AdministrativeOfficer.create({ user_id: userId });
			}
			area.officer_id = officer.officer_id;
			await area.save();
		}

		const result = { area_id: area.area_id, name: area.name, fired: [], skipped: [] };

		const center = extractCenter(area);
		if (!center) {
			result.skipped.push({ reason: 'no-center' });
			return result;
		}

		const tempThr = area.temp_threshold;
		const rainThr = area.rain_threshold;
		if ((tempThr === null || tempThr === undefined) && (rainThr === null || rainThr === undefined)) {
			result.skipped.push({ reason: 'no-thresholds' });
			return result;
		}

		const recipientUserId = await resolveOfficerUserId(area);
		if (!recipientUserId) {
			result.skipped.push({ reason: 'no-officer' });
			return result;
		}

		let current = null;
		try {
			current = await openWeatherService.getCurrentWeather({
				lat: center.lat, lon: center.lng, units: 'metric'
			});
		} catch (err) {
			logger.error?.('[area-notify] weather fetch failed', area.area_id, err?.message || err);
			result.skipped.push({ reason: 'weather-fetch-failed' });
			return result;
		}

		const cooldownSince = Date.now() - COOLDOWN_MINUTES * 60_000;

		for (const metric of ['temp', 'rain']) {
			const threshold = metric === 'temp' ? tempThr : rainThr;
			if (threshold === null || threshold === undefined) continue;

			const value = extractCurrentMetric(metric, current);
			if (value === null || !Number.isFinite(value)) {
				result.skipped.push({ metric, reason: 'no-value' });
				continue;
			}

			if (!(value >= Number(threshold))) {
				result.skipped.push({ metric, reason: 'below-threshold', value });
				continue;
			}

			const type = TYPE_BY_METRIC[metric];
			if (!force && await recentlyNotified(area.area_id, type, cooldownSince)) {
				result.skipped.push({ metric, reason: 'cooldown', value });
				continue;
			}

			const payload = buildPayload({ area, metric, value, threshold: Number(threshold) });

			// (1) admin-facing alert ledger — drives /admin/alerts and audit history
			await AlertEvent.create({
				name: payload.title,
				type,
				description: payload.body,
				issue_at: new Date(),
				area_id: area.area_id,
				level: 'Medium',
				user_id: recipientUserId
			});

			// (2) per-user notification — drives the bell (NotificationBell → /alerts/events)
			await NotificationEvent.create({
				user_id: recipientUserId,
				name: payload.title,
				description: payload.body,
				type: 'AreaAlert'
			});

			// (3) live WebSocket frame + Web Push (OS popup)
			await pushDelivery.deliver(recipientUserId, payload);

			result.fired.push({ metric, value, threshold: Number(threshold) });
		}

		return result;
	}

	/**
	 * Evaluate every area the user owns (or every area for a super admin).
	 */
	async evaluateAllForUser(userId, { logger = console, force = false } = {}) {
		const officer = await AdministrativeOfficer.findOne({ where: { user_id: userId } });
		const where = officer ? { officer_id: officer.officer_id } : {};
		const areas = await AdminArea.findAll({ where, attributes: ['area_id'] });

		const summary = { evaluated: areas.length, fired: 0, results: [] };
		for (const area of areas) {
			try {
				const r = await this.evaluateArea(area.area_id, userId, { logger, force });
				summary.fired += r.fired.length;
				summary.results.push(r);
			} catch (err) {
				logger.error?.('[area-notify] area failed', area.area_id, err?.message || err);
				summary.results.push({ area_id: area.area_id, error: err?.message || String(err) });
			}
		}
		return summary;
	}
}

module.exports = new AreaNotificationEvaluator();
