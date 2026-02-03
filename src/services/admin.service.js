const { AdministrativeOfficer, AdminArea, ResponseScenario, ChecklistItem } = require('../models/admin.model');
const { UserAccount } = require('../models/user.model');
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');

class AdminService {
    /**
     * Get all admin areas
     */
    async getAreas(userId) {
        // Get officer_id if user is an admin
        const officer = await AdministrativeOfficer.findOne({ where: { user_id: userId } });
        
        if (officer) {
            // Return only areas managed by this officer
            return await AdminArea.findAll({
                where: { officer_id: officer.officer_id },
                include: [{ model: AdministrativeOfficer }],
                order: [['area_id', 'DESC']]
            });
        } else {
            // Super admin - return all areas
            return await AdminArea.findAll({
                include: [{ model: AdministrativeOfficer }],
                order: [['area_id', 'DESC']]
            });
        }
    }

    /**
     * Create a new admin area
     */
    async createArea(userId, data) {
        const officer = await AdministrativeOfficer.findOne({ where: { user_id: userId } });
        
        const area = await AdminArea.create({
            officer_id: officer ? officer.officer_id : data.officer_id,
            name: data.name,
            area_type: data.area_type,
            boundary_polygon: data.boundary_polygon
        });

        return area;
    }

    /**
     * Get all response scenarios
     */
    async getScenarios(areaId = null) {
        const where = areaId ? { area_id: areaId } : {};
        
        const scenarios = await ResponseScenario.findAll({
            where,
            include: [
                { model: AdminArea },
                { model: ChecklistItem, order: [['item_order', 'ASC']] }
            ],
            order: [['scenario_id', 'DESC']]
        });

        return scenarios;
    }

    /**
     * Get a single scenario with checklist items
     */
    async getScenario(scenarioId) {
        const scenario = await ResponseScenario.findByPk(scenarioId, {
            include: [
                { model: AdminArea },
                { 
                    model: ChecklistItem, 
                    order: [['item_order', 'ASC']] 
                }
            ]
        });

        if (!scenario) throw new Error('Scenario not found');
        return scenario;
    }

    /**
     * Create a new response scenario
     */
    async createScenario(data) {
        const scenario = await ResponseScenario.create({
            area_id: data.area_id,
            name: data.name,
            applicable_event_type: data.applicable_event_type
        });

        return scenario;
    }

    /**
     * Add checklist item to a scenario
     */
    async addChecklistItem(scenarioId, data) {
        // Verify scenario exists
        const scenario = await ResponseScenario.findByPk(scenarioId);
        if (!scenario) throw new Error('Scenario not found');

        // Get the next order number if not provided
        let itemOrder = data.item_order;
        if (!itemOrder) {
            const maxOrder = await ChecklistItem.max('item_order', { 
                where: { scenario_id: scenarioId } 
            });
            itemOrder = (maxOrder || 0) + 1;
        }

        const item = await ChecklistItem.create({
            scenario_id: scenarioId,
            name: data.name,
            description: data.description,
            item_order: itemOrder
        });

        return item;
    }

    /**
     * Get admin dashboard statistics
     */
    async getDashboard() {
        // Total users by role
        const usersByRoleQuery = `
            SELECT role, COUNT(*) as count
            FROM user_account
            GROUP BY role
        `;
        const usersByRole = await sequelize.query(usersByRoleQuery, { type: QueryTypes.SELECT });

        // Active users (logged in last 7 days)
        const activeUsersQuery = `
            SELECT COUNT(DISTINCT user_id) as count
            FROM user_account
            WHERE created_at >= NOW() - INTERVAL '7 days'
        `;
        const activeUsers = await sequelize.query(activeUsersQuery, { type: QueryTypes.SELECT });

        // Total admin areas
        const totalAreas = await AdminArea.count();

        // Total response scenarios
        const totalScenarios = await ResponseScenario.count();

        // Recent alert events (system-wide)
        const recentAlertsQuery = `
            SELECT COUNT(*) as count
            FROM alert_event
            WHERE issue_at >= NOW() - INTERVAL '24 hours'
        `;
        const recentAlerts = await sequelize.query(recentAlertsQuery, { type: QueryTypes.SELECT });

        // Scenarios by event type
        const scenariosByTypeQuery = `
            SELECT applicable_event_type, COUNT(*) as count
            FROM response_scenario
            GROUP BY applicable_event_type
            ORDER BY count DESC
        `;
        const scenariosByType = await sequelize.query(scenariosByTypeQuery, { type: QueryTypes.SELECT });

        // System health indicators
        const systemHealth = {
            database: 'healthy',
            total_users: usersByRole.reduce((sum, role) => sum + parseInt(role.count), 0),
            active_users_7d: parseInt(activeUsers[0]?.count || 0),
            alerts_24h: parseInt(recentAlerts[0]?.count || 0)
        };

        return {
            system_health: systemHealth,
            users_by_role: usersByRole,
            admin_areas: totalAreas,
            response_scenarios: totalScenarios,
            scenarios_by_type: scenariosByType,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Update an admin area
     */
    async updateArea(areaId, data) {
        const area = await AdminArea.findByPk(areaId);
        if (!area) throw new Error('Area not found');

        if (data.name !== undefined) area.name = data.name;
        if (data.area_type !== undefined) area.area_type = data.area_type;
        if (data.boundary_polygon !== undefined) area.boundary_polygon = data.boundary_polygon;
        if (data.officer_id !== undefined) area.officer_id = data.officer_id;

        await area.save();
        return area;
    }

    /**
     * Delete an admin area
     */
    async deleteArea(areaId) {
        const area = await AdminArea.findByPk(areaId);
        if (!area) throw new Error('Area not found');
        
        await area.destroy();
        return { message: 'Area deleted successfully' };
    }
}

module.exports = new AdminService();
