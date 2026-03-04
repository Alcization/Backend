const { AlertPolicy, AlertEvent } = require('../models/business.model');
const { BusinessUser, UserAccount } = require('../models/user.model');
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');

class BusinessService {
    /**
     * Get all policies for a business user
     */
    async getPolicies(userId) {
        // First get business_id from user_id
        const businessUser = await BusinessUser.findOne({ where: { user_id: userId } });
        if (!businessUser) throw new Error('Business user not found');

        const policies = await AlertPolicy.findAll({
            where: { business_id: businessUser.business_id },
            order: [['policy_id', 'DESC']]
        });

        return policies;
    }

    /**
     * Create a new alert policy
     */
    async createPolicy(userId, data) {
        // Validate input data
        if (!data) {
            throw new Error('Policy data is required');
        }

        const businessUser = await BusinessUser.findOne({ where: { user_id: userId } });
        if (!businessUser) throw new Error('Business user not found');

        // Only save fields that exist in database schema
        const policy = await AlertPolicy.create({
            business_id: businessUser.business_id,
            name: data.name || 'Untitled Policy',
            description: data.description,
            start_hour: data.start_hour,
            end_hour: data.end_hour,
            week_day: data.week_day,
            status: data.status !== undefined ? data.status : true
        });

        return policy;
    }

    /**
     * Get dashboard statistics for business user
     */
    async getDashboard(userId) {
        const businessUser = await BusinessUser.findOne({ where: { user_id: userId } });
        if (!businessUser) throw new Error('Business user not found');

        // Get active policies count
        const activePoliciesCount = await AlertPolicy.count({
            where: { business_id: businessUser.business_id, status: true }
        });

        // Get total alert events triggered in last 24 hours
        const recentAlertsQuery = `
            SELECT COUNT(*) as count
            FROM alert_event ae
            JOIN alert_policy ap ON ae.policy_id = ap.policy_id
            WHERE ap.business_id = :businessId
            AND ae.issue_at >= NOW() - INTERVAL '24 hours'
        `;

        const recentAlerts = await sequelize.query(recentAlertsQuery, {
            replacements: { businessId: businessUser.business_id },
            type: QueryTypes.SELECT
        });

        // Get alert events by type in last 7 days
        const alertsByTypeQuery = `
            SELECT ae.type, COUNT(*) as count
            FROM alert_event ae
            JOIN alert_policy ap ON ae.policy_id = ap.policy_id
            WHERE ap.business_id = :businessId
            AND ae.issue_at >= NOW() - INTERVAL '7 days'
            GROUP BY ae.type
            ORDER BY count DESC
        `;

        const alertsByType = await sequelize.query(alertsByTypeQuery, {
            replacements: { businessId: businessUser.business_id },
            type: QueryTypes.SELECT
        });

        // Get recent alert events (last 10)
        const recentEvents = await sequelize.query(`
            SELECT ae.alert_event_id, ae.name, ae.type, ae.description, ae.issue_at
            FROM alert_event ae
            JOIN alert_policy ap ON ae.policy_id = ap.policy_id
            WHERE ap.business_id = :businessId
            ORDER BY ae.issue_at DESC
            LIMIT 10
        `, {
            replacements: { businessId: businessUser.business_id },
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
            WHERE ap.business_id = :businessId
            AND ae.issue_at >= NOW() - INTERVAL '7 days'
            GROUP BY DATE(ae.issue_at), ae.type
            ORDER BY date DESC
        `;

        const weeklyStats = await sequelize.query(weeklyStatsQuery, {
            replacements: { businessId: businessUser.business_id },
            type: QueryTypes.SELECT
        });

        // Get policy performance (which policies triggered most alerts)
        const policyPerformanceQuery = `
            SELECT 
                ap.policy_id,
                ap.name,
                COUNT(ae.alert_event_id) as alerts_triggered
            FROM alert_policy ap
            LEFT JOIN alert_event ae ON ap.policy_id = ae.policy_id 
                AND ae.issue_at >= NOW() - INTERVAL '7 days'
            WHERE ap.business_id = :businessId
            GROUP BY ap.policy_id, ap.name
            ORDER BY alerts_triggered DESC
        `;

        const policyPerformance = await sequelize.query(policyPerformanceQuery, {
            replacements: { businessId: businessUser.business_id },
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
                active_policies: policyPerformance.length
            }
        };
    }
}

module.exports = new BusinessService();
