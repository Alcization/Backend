const { AdministrativeOfficer, AdminArea, ResponseScenario, ChecklistItem, AlertEvent } = require('../models/admin.model');
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
     * Get a single admin area by ID
     */
    async getAreaById(areaId) {
        const area = await AdminArea.findByPk(areaId, {
            include: [{ model: AdministrativeOfficer }]
        });

        if (!area) throw new Error('Area not found');
        return area;
    }

    /**
     * Create a new admin area
     */
    async createArea(userId, data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid request: area data is required');
        }

        if (!data.name) {
            throw new Error('Invalid request: name is required');
        }

        if (!data.area_type) {
            throw new Error('Invalid request: area_type is required');
        }

        if (!data.address) {
            throw new Error('Invalid request: address is required');
        }

        if (!data.management_area) {
            throw new Error('Invalid request: management_area (circle with center and radius_km) is required');
        }

        // Validate management_area format
        if (!data.management_area.center || typeof data.management_area.center !== 'object' || 
            data.management_area.center.lat === undefined || data.management_area.center.lng === undefined) {
            throw new Error('Invalid management_area: center must have lat and lng coordinates');
        }

        if (data.management_area.radius_km === undefined || typeof data.management_area.radius_km !== 'number' || data.management_area.radius_km <= 0) {
            throw new Error('Invalid management_area: radius_km must be a positive number');
        }

        const officer = await AdministrativeOfficer.findOne({ where: { user_id: userId } });
        
        const area = await AdminArea.create({
            officer_id: officer ? officer.officer_id : data.officer_id,
            name: data.name,
            area_type: data.area_type,
            address: data.address,
            management_area: data.management_area,
            boundary_polygon: data.boundary_polygon || null
        });

        return area;
    }

    /**
     * Get all response scenarios
     */
    async getScenarios(areaId = null) {
        const scenarios = await ResponseScenario.findAll({
            include: [
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
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid request: scenario data is required');
        }

        if (!data.name) {
            throw new Error('Invalid request: name is required');
        }

        if (!data.applicable_event_type) {
            throw new Error('Invalid request: applicable_event_type is required');
        }

        const scenario = await ResponseScenario.create({
            name: data.name,
            applicable_event_type: data.applicable_event_type,
            user_id: data.user_id || null
        });

        return scenario;
    }

    /**
     * Add checklist item to a scenario
     */
    async addChecklistItem(scenarioId, data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid request: checklist item data is required');
        }

        if (!data.name) {
            throw new Error('Invalid request: name is required');
        }

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
            SELECT r.name as role, COUNT(DISTINCT ur.user_id) as count
            FROM roles r
            LEFT JOIN user_roles ur ON r.id = ur.role_id
            GROUP BY r.name
            ORDER BY r.name
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

        // Total unique users count
        const totalUsersQuery = `
            SELECT COUNT(*) as count
            FROM user_account
        `;
        const totalUsersResult = await sequelize.query(totalUsersQuery, { type: QueryTypes.SELECT });

        // System health indicators
        const systemHealth = {
            database: 'healthy',
            total_users: parseInt(totalUsersResult[0]?.count || 0),
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
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid request: area data is required');
        }

        const area = await AdminArea.findByPk(areaId);
        if (!area) throw new Error('Area not found');

        if (data.name !== undefined) area.name = data.name;
        if (data.area_type !== undefined) area.area_type = data.area_type;
        if (data.address !== undefined) area.address = data.address;
        if (data.boundary_polygon !== undefined) area.boundary_polygon = data.boundary_polygon;
        if (data.officer_id !== undefined) area.officer_id = data.officer_id;
        
        // Validate management_area if provided
        if (data.management_area !== undefined) {
            if (data.management_area === null) {
                area.management_area = null;
            } else {
                if (!data.management_area.center || typeof data.management_area.center !== 'object' || 
                    data.management_area.center.lat === undefined || data.management_area.center.lng === undefined) {
                    throw new Error('Invalid management_area: center must have lat and lng coordinates');
                }

                if (data.management_area.radius_km === undefined || typeof data.management_area.radius_km !== 'number' || data.management_area.radius_km <= 0) {
                    throw new Error('Invalid management_area: radius_km must be a positive number');
                }
                
                area.management_area = data.management_area;
            }
        }

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

    /**
     * Helper function to format alert event response
     */
    formatAlertEvent(event) {
        const formatted = event.toJSON();
        if (formatted.AdminArea) {
            formatted.area_name = formatted.AdminArea.name;
            delete formatted.AdminArea;
        }
        return formatted;
    }

    /**
     * Get all alert events - filtered by user if they are an officer
     */
    async getAlertEvents(userId, filters = {}) {
        // Get officer_id if user is an admin
        const officer = await AdministrativeOfficer.findOne({ where: { user_id: userId } });
        
        const where = {};
        
        // If user is an officer, only show events from their areas
        if (officer) {
            const userAreas = await AdminArea.findAll({
                where: { officer_id: officer.officer_id },
                attributes: ['area_id']
            });
            where.area_id = { [sequelize.Sequelize.Op.in]: userAreas.map(a => a.area_id) };
        }

        // Apply filters if provided
        if (filters.type) where.type = filters.type;
        if (filters.level) where.level = filters.level;
        if (filters.area_id) where.area_id = filters.area_id;
        
        // Date range filter
        if (filters.start_date || filters.end_date) {
            where.issue_at = {};
            if (filters.start_date) where.issue_at[sequelize.Sequelize.Op.gte] = new Date(filters.start_date);
            if (filters.end_date) where.issue_at[sequelize.Sequelize.Op.lte] = new Date(filters.end_date);
        }

        const events = await AlertEvent.findAll({
            where,
            include: [
                { model: UserAccount, attributes: ['user_id', 'username', 'email'] },
                { model: AdminArea, attributes: ['name'] },
                { 
                    model: ResponseScenario, 
                    attributes: ['scenario_id', 'name', 'applicable_event_type'],
                    required: false 
                }
            ],
            order: [['issue_at', 'DESC']],
            limit: filters.limit ? parseInt(filters.limit) : 100,
            offset: filters.offset ? parseInt(filters.offset) : 0
        });

        return events.map(event => this.formatAlertEvent(event));
    }

    /**
     * Get a single alert event by ID
     */
    async getAlertEventById(alertId) {
        const event = await AlertEvent.findByPk(alertId, {
            include: [
                { model: UserAccount, attributes: ['user_id', 'username', 'email'] },
                { model: AdminArea, attributes: ['name'] },
                { 
                    model: ResponseScenario, 
                    attributes: ['scenario_id', 'name', 'applicable_event_type']
                }
            ]
        });

        if (!event) throw new Error('Alert event not found');
        return this.formatAlertEvent(event);
    }

    /**
     * Create a new alert event
     */
    async createAlertEvent(userId, data) {
        // Validate input
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid request: alert event data is required');
        }

        if (!data.name) {
            throw new Error('Invalid request: name is required');
        }

        if (!data.type) {
            throw new Error('Invalid request: type is required');
        }

        // Validate type
        const validTypes = ['Flood', 'Rain', 'Storm', 'Traffic', 'Ngập', 'Mưa', 'Bão', 'Giao thông'];
        if (!validTypes.includes(data.type)) {
            throw new Error(`Invalid type: type must be one of ${validTypes.join(', ')}`);
        }

        if (!data.level) {
            throw new Error('Invalid request: level is required');
        }

        // Validate level
        const validLevels = ['High', 'Medium', 'Low', 'Cao', 'Trung bình', 'Thấp'];
        if (!validLevels.includes(data.level)) {
            throw new Error(`Invalid level: level must be one of ${validLevels.join(', ')}`);
        }

        if (!data.area_id) {
            throw new Error('Invalid request: area_id is required');
        }

        // Verify that the area exists
        const area = await AdminArea.findByPk(data.area_id);
        if (!area) {
            throw new Error(`Area with id ${data.area_id} not found`);
        }

        // Verify scenario exists if provided
        if (data.scenario_id) {
            const scenario = await ResponseScenario.findByPk(data.scenario_id);
            if (!scenario) {
                throw new Error(`Scenario with id ${data.scenario_id} not found`);
            }
        }

        // Create the alert event
        const event = await AlertEvent.create({
            name: data.name,
            type: data.type,
            description: data.description || null,
            issue_at: data.issue_at || new Date(),
            area_id: data.area_id,
            scenario_id: data.scenario_id || null,
            level: data.level,
            user_id: userId
        });

        // Return with associations
        const createdEvent = await AlertEvent.findByPk(event.alert_event_id, {
            include: [
                { model: UserAccount, attributes: ['user_id', 'username', 'email'] },
                { model: AdminArea, attributes: ['name'] },
                { 
                    model: ResponseScenario, 
                    attributes: ['scenario_id', 'name', 'applicable_event_type'],
                    required: false 
                }
            ]
        });
        return this.formatAlertEvent(createdEvent);
    }

    /**
     * Update an alert event
     */
    async updateAlertEvent(alertId, userId, data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid request: alert event data is required');
        }

        const event = await AlertEvent.findByPk(alertId);
        if (!event) throw new Error('Alert event not found');

        // Verify ownership - only admin or creator can update
        if (event.user_id !== userId) {
            const officer = await AdministrativeOfficer.findOne({ where: { user_id: userId } });
            if (!officer) {
                throw new Error('Unauthorized: you can only update your own alerts');
            }
        }

        // Update allowed fields
        if (data.name !== undefined) event.name = data.name;
        if (data.type !== undefined) {
            const validTypes = ['Flood', 'Rain', 'Storm', 'Traffic', 'Ngập', 'Mưa', 'Bão', 'Giao thông'];
            if (!validTypes.includes(data.type)) {
                throw new Error(`Invalid type: type must be one of ${validTypes.join(', ')}`);
            }
            event.type = data.type;
        }
        if (data.description !== undefined) event.description = data.description;
        if (data.level !== undefined) {
            const validLevels = ['High', 'Medium', 'Low', 'Cao', 'Trung bình', 'Thấp'];
            if (!validLevels.includes(data.level)) {
                throw new Error(`Invalid level: level must be one of ${validLevels.join(', ')}`);
            }
            event.level = data.level;
        }

        // Handle scenario assignment (for marking as processed)
        if (data.scenario_id !== undefined) {
            if (data.scenario_id === null) {
                event.scenario_id = null; // Unmark as processed
            } else {
                const scenario = await ResponseScenario.findByPk(data.scenario_id);
                if (!scenario) {
                    throw new Error(`Scenario with id ${data.scenario_id} not found`);
                }
                event.scenario_id = data.scenario_id;
            }
        }

        await event.save();

        // Return updated event with associations
        const updatedEvent = await AlertEvent.findByPk(event.alert_event_id, {
            include: [
                { model: UserAccount, attributes: ['user_id', 'username', 'email'] },
                { model: AdminArea, attributes: ['name'] },
                { 
                    model: ResponseScenario, 
                    attributes: ['scenario_id', 'name', 'applicable_event_type'],
                    required: false 
                }
            ]
        });
        return this.formatAlertEvent(updatedEvent);
    }

    /**
     * Delete an alert event
     */
    async deleteAlertEvent(alertId, userId) {
        const event = await AlertEvent.findByPk(alertId);
        if (!event) throw new Error('Alert event not found');

        // Verify ownership - only admin or creator can delete
        if (event.user_id !== userId) {
            const officer = await AdministrativeOfficer.findOne({ where: { user_id: userId } });
            if (!officer) {
                throw new Error('Unauthorized: you can only delete your own alerts');
            }
        }

        await event.destroy();
        return { message: 'Alert event deleted successfully' };
    }
}

module.exports = new AdminService();
