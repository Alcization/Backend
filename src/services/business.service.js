const { AlertPolicy, AlertEvent } = require('../models/business.model');
const { BusinessUser, UserAccount } = require('../models/user.model');
const { SavedLocation, SavedRoute } = require('../models/route.model');
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');

class BusinessService {
    _getPolicyTarget(accountType) {
        if (accountType === 'business') {
            return {
                model: SavedRoute,
                key: 'route_id',
                label: 'saved_route'
            };
        }

        if (accountType === 'individual') {
            return {
                model: SavedLocation,
                key: 'location_id',
                label: 'saved_location'
            };
        }

        throw new Error('Unsupported account type');
    }

    _normalizePolicyValue(value) {
        if (value === undefined || value === '') {
            return null;
        }

        return value;
    }

    /**
     * Get all policies for the authenticated user
     */
    async getPolicies(userId) {
        const policies = await AlertPolicy.findAll({
            where: { user_id: userId },
            order: [['policy_id', 'DESC']]
        });

        return policies;
    }

    /**
     * Create or update an alert policy
     */
    async createPolicy(userId, accountType, data) {
        // Validate input data
        if (!data) {
            throw new Error('Policy data is required');
        }

        const targetId = Number.parseInt(data.id, 10);
        if (Number.isNaN(targetId)) {
            throw new Error('id is required and must be a valid integer');
        }

        if (data.start_hour === undefined || data.start_hour === null || data.start_hour === '') {
            throw new Error('start_hour is required');
        }

        if (data.end_hour === undefined || data.end_hour === null || data.end_hour === '') {
            throw new Error('end_hour is required');
        }

        const { model: targetModel, key: targetKey, label } = this._getPolicyTarget(accountType);
        const target = await targetModel.findOne({
            where: {
                [targetKey]: targetId,
                user_id: userId
            }
        });

        if (!target) {
            throw new Error(`${label} not found for current user`);
        }

        const existingPolicy = await AlertPolicy.findOne({
            where: { user_id: userId, id: targetId }
        });

        const hasOwn = (key) => Object.prototype.hasOwnProperty.call(data, key);
        const nextValues = {
            user_id: userId,
            id: targetId,
            start_hour: hasOwn('start_hour') ? data.start_hour : existingPolicy?.start_hour,
            end_hour: hasOwn('end_hour') ? data.end_hour : existingPolicy?.end_hour,
            effect_time: hasOwn('effect_time') ? this._normalizePolicyValue(data.effect_time) : existingPolicy?.effect_time,
            temp_threshold: hasOwn('temp_threshold')
                ? this._normalizePolicyValue(data.temp_threshold)
                : existingPolicy?.temp_threshold ?? null,
            traffic_threshold: hasOwn('traffic_threshold')
                ? this._normalizePolicyValue(data.traffic_threshold)
                : existingPolicy?.traffic_threshold ?? null
        };

        if (existingPolicy) {
            await existingPolicy.update(nextValues);
            return {
                policy: existingPolicy,
                created: false
            };
        }

        const policy = await AlertPolicy.create(nextValues);

        return {
            policy,
            created: true
        };
    }

    /**
     * Get dashboard statistics for business user
     */
    async getDashboard(userId) {
        const businessUser = await BusinessUser.findOne({ where: { user_id: userId } });
        if (!businessUser) throw new Error('Business user not found');

        // Get active policies count
        const activePoliciesCount = await AlertPolicy.count({
            where: { user_id: userId }
        });

        // Get total alert events triggered in last 24 hours
        const recentAlertsQuery = `
            SELECT COUNT(*) as count
            FROM alert_event ae
            JOIN alert_policy ap ON ae.policy_id = ap.policy_id
            WHERE ap.user_id = :userId
            AND ae.issue_at >= NOW() - INTERVAL '24 hours'
        `;

        const recentAlerts = await sequelize.query(recentAlertsQuery, {
            replacements: { userId },
            type: QueryTypes.SELECT
        });

        // Get alert events by type in last 7 days
        const alertsByTypeQuery = `
            SELECT ae.type, COUNT(*) as count
            FROM alert_event ae
            JOIN alert_policy ap ON ae.policy_id = ap.policy_id
            WHERE ap.user_id = :userId
            AND ae.issue_at >= NOW() - INTERVAL '7 days'
            GROUP BY ae.type
            ORDER BY count DESC
        `;

        const alertsByType = await sequelize.query(alertsByTypeQuery, {
            replacements: { userId },
            type: QueryTypes.SELECT
        });

        // Get recent alert events (last 10)
        const recentEvents = await sequelize.query(`
            SELECT ae.alert_event_id, ae.policy_id, ae.name, ae.type, ae.description, ae.issue_at
            FROM alert_event ae
            JOIN alert_policy ap ON ae.policy_id = ap.policy_id
            WHERE ap.user_id = :userId
            ORDER BY ae.issue_at DESC
            LIMIT 10
        `, {
            replacements: { userId },
            type: QueryTypes.SELECT
        });

        return {
            active_policies: activePoliciesCount,
            alerts_last_24h: parseInt(recentAlerts[0]?.count || 0),
            alerts_by_type: alertsByType,
            recent_events: recentEvents,
            business_info: {
                company_name: businessUser.company_name,
                business_id: businessUser.business_id
            }
        };
    }

    /**
     * Generate weekly report data
     */
    async getWeeklyReport(userId) {
        const businessUser = await BusinessUser.findOne({ where: { user_id: userId } });
        if (!businessUser) throw new Error('Business user not found');

        // Get statistics for the past 7 days
        const weeklyStatsQuery = `
            SELECT 
                DATE(ae.issue_at) as date,
                COUNT(*) as alert_count,
                ae.type,
                COUNT(DISTINCT ap.policy_id) as policies_triggered
            FROM alert_event ae
            JOIN alert_policy ap ON ae.policy_id = ap.policy_id
            WHERE ap.user_id = :userId
            AND ae.issue_at >= NOW() - INTERVAL '7 days'
            GROUP BY DATE(ae.issue_at), ae.type
            ORDER BY date DESC
        `;

        const weeklyStats = await sequelize.query(weeklyStatsQuery, {
            replacements: { userId },
            type: QueryTypes.SELECT
        });

        // Get policy performance (which policies triggered most alerts)
        const policyPerformanceQuery = `
            SELECT 
                ap.policy_id,
                ap.id,
                ap.start_hour,
                ap.end_hour,
                ap.effect_time,
                ap.temp_threshold,
                ap.traffic_threshold,
                COUNT(ae.alert_event_id) as alerts_triggered
            FROM alert_policy ap
            LEFT JOIN alert_event ae ON ap.policy_id = ae.policy_id 
                AND ae.issue_at >= NOW() - INTERVAL '7 days'
            WHERE ap.user_id = :userId
            GROUP BY ap.policy_id, ap.id, ap.start_hour, ap.end_hour, ap.effect_time, ap.temp_threshold, ap.traffic_threshold
            ORDER BY alerts_triggered DESC
        `;

        const policyPerformance = await sequelize.query(policyPerformanceQuery, {
            replacements: { userId },
            type: QueryTypes.SELECT
        });

        return {
            report_period: {
                start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                end: new Date().toISOString()
            },
            company_name: businessUser.company_name,
            weekly_stats: weeklyStats,
            policy_performance: policyPerformance,
            summary: {
                total_alerts: weeklyStats.reduce((sum, stat) => sum + parseInt(stat.alert_count), 0),
                active_policies: activePoliciesCount
            }
        };
    }
}

module.exports = new BusinessService();
