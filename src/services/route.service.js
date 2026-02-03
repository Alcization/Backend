const { SavedLocation, SavedRoute } = require('../models/route.model');
const { RouteSegment, TrafficReading, WeatherArea, TimeSlot, WeatherReading } = require('../models/map.model');
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');

class RouteService {
    /**
     * Get all saved locations for a user
     */
    async getLocations(userId) {
        const locations = await SavedLocation.findAll({
            where: { user_id: userId },
            order: [['location_id', 'DESC']]
        });
        return locations;
    }

    /**
     * Save a new location
     */
    async createLocation(userId, data) {
        const location = await SavedLocation.create({
            user_id: userId,
            custom_name: data.custom_name,
            address: data.address,
            latitude: data.latitude,
            longitude: data.longitude,
            coordinate: data.latitude && data.longitude ? 
                sequelize.fn('ST_SetSRID', sequelize.fn('ST_MakePoint', data.longitude, data.latitude), 4326) : null
        });
        return location;
    }

    /**
     * Get all saved routes for a user
     */
    async getRoutes(userId) {
        const routes = await SavedRoute.findAll({
            where: { user_id: userId },
            order: [['route_id', 'DESC']]
        });

        // Parse waypoints JSON
        return routes.map(route => ({
            ...route.toJSON(),
            waypoints: route.waypoints ? JSON.parse(route.waypoints) : []
        }));
    }

    /**
     * Create a new route
     * Calculate route segments based on start, end, and waypoints
     */
    async createRoute(userId, data) {
        const t = await sequelize.transaction();
        
        try {
            // Create saved route
            const route = await SavedRoute.create({
                user_id: userId,
                name: data.name,
                start_point: sequelize.fn('ST_SetSRID', sequelize.fn('ST_MakePoint', data.start.lng, data.start.lat), 4326),
                end_point: sequelize.fn('ST_SetSRID', sequelize.fn('ST_MakePoint', data.end.lng, data.end.lat), 4326),
                waypoints: data.waypoints ? JSON.stringify(data.waypoints) : null,
                distance: data.distance || this._calculateDistance(data.start, data.end)
            }, { transaction: t });

            // Create route segments
            // Simple implementation: create segments between consecutive points
            const points = [data.start, ...(data.waypoints || []), data.end];
            
            for (let i = 0; i < points.length - 1; i++) {
                const start = points[i];
                const end = points[i + 1];
                
                await RouteSegment.create({
                    saved_route_id: route.route_id,
                    start_point: sequelize.fn('ST_SetSRID', sequelize.fn('ST_MakePoint', start.lng, start.lat), 4326),
                    end_point: sequelize.fn('ST_SetSRID', sequelize.fn('ST_MakePoint', end.lng, end.lat), 4326),
                    coordinate: sequelize.fn('ST_SetSRID', 
                        sequelize.fn('ST_MakeLine',
                            sequelize.fn('ST_MakePoint', start.lng, start.lat),
                            sequelize.fn('ST_MakePoint', end.lng, end.lat)
                        ), 4326),
                    order_in_route: i + 1
                }, { transaction: t });
            }

            await t.commit();
            return route;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    /**
     * Get route details
     */
    async getRoute(routeId, userId) {
        const route = await SavedRoute.findOne({
            where: { route_id: routeId, user_id: userId }
        });

        if (!route) throw new Error('Route not found');

        // Get route segments
        const segments = await RouteSegment.findAll({
            where: { saved_route_id: routeId },
            order: [['order_in_route', 'ASC']]
        });

        return {
            ...route.toJSON(),
            waypoints: route.waypoints ? JSON.parse(route.waypoints) : [],
            segments: segments
        };
    }

    /**
     * Get route analysis - weather and traffic along the route
     */
    async getRouteAnalysis(routeId, userId) {
        const route = await SavedRoute.findOne({
            where: { route_id: routeId, user_id: userId }
        });

        if (!route) throw new Error('Route not found');

        // Get segments with latest traffic data
        const trafficQuery = `
            SELECT 
                rs.segment_id,
                rs.order_in_route,
                ST_AsGeoJSON(rs.start_point) as start_point,
                ST_AsGeoJSON(rs.end_point) as end_point,
                tr.velocity,
                tr.traffic_state,
                tr.time_reading
            FROM route_segment rs
            LEFT JOIN LATERAL (
                SELECT velocity, traffic_state, time_reading
                FROM traffic_reading
                WHERE segment_id = rs.segment_id
                ORDER BY time_reading DESC
                LIMIT 1
            ) tr ON true
            WHERE rs.saved_route_id = :routeId
            ORDER BY rs.order_in_route
        `;

        const trafficData = await sequelize.query(trafficQuery, {
            replacements: { routeId },
            type: QueryTypes.SELECT
        });

        // Get weather areas along the route
        const weatherQuery = `
            SELECT DISTINCT
                wa.area_id,
                wa.name,
                ST_AsGeoJSON(wa.center_point) as center_point,
                wr.temp,
                wr.feelslike,
                wr.humidity,
                wr.precip,
                wr.precipprob,
                wr.windspeed,
                wr.conditions,
                wr.icon
            FROM weather_area wa
            JOIN time_slot ts ON ts.area_id = wa.area_id
            JOIN weather_reading wr ON wr.timeslot_id = ts.timeslot_id
            WHERE ST_DWithin(
                wa.center_point::geography,
                (SELECT ST_MakeLine(start_point, end_point) FROM route_segment WHERE saved_route_id = :routeId LIMIT 1)::geography,
                5000
            )
            AND ts.time_value = (
                SELECT MAX(time_value)
                FROM time_slot
                WHERE area_id = wa.area_id
            )
        `;

        const weatherData = await sequelize.query(weatherQuery, {
            replacements: { routeId },
            type: QueryTypes.SELECT
        });

        // Calculate overall analysis
        const avgVelocity = trafficData.reduce((sum, seg) => sum + (seg.velocity || 0), 0) / trafficData.length;
        const avgPrecip = weatherData.reduce((sum, w) => sum + (w.precip || 0), 0) / (weatherData.length || 1);
        
        return {
            route_id: routeId,
            route_name: route.name,
            segments: trafficData.map(seg => ({
                segment_id: seg.segment_id,
                order: seg.order_in_route,
                start_point: seg.start_point ? JSON.parse(seg.start_point) : null,
                end_point: seg.end_point ? JSON.parse(seg.end_point) : null,
                traffic: {
                    velocity: seg.velocity,
                    state: seg.traffic_state,
                    time: seg.time_reading
                }
            })),
            weather_areas: weatherData.map(w => ({
                area_id: w.area_id,
                name: w.name,
                center_point: w.center_point ? JSON.parse(w.center_point) : null,
                current_weather: {
                    temp: w.temp,
                    feelslike: w.feelslike,
                    humidity: w.humidity,
                    precip: w.precip,
                    precipprob: w.precipprob,
                    windspeed: w.windspeed,
                    conditions: w.conditions,
                    icon: w.icon
                }
            })),
            summary: {
                average_velocity: avgVelocity,
                average_precipitation: avgPrecip,
                traffic_status: this._getTrafficStatus(avgVelocity),
                weather_status: this._getWeatherStatus(avgPrecip)
            }
        };
    }

    /**
     * Calculate distance between two points (Haversine formula)
     */
    _calculateDistance(point1, point2) {
        const R = 6371; // Earth radius in km
        const dLat = (point2.lat - point1.lat) * Math.PI / 180;
        const dLon = (point2.lng - point1.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    _getTrafficStatus(avgVelocity) {
        if (avgVelocity > 50) return 'Good';
        if (avgVelocity > 30) return 'Moderate';
        if (avgVelocity > 15) return 'Slow';
        return 'Congested';
    }

    _getWeatherStatus(avgPrecip) {
        if (avgPrecip === 0) return 'Clear';
        if (avgPrecip < 2.5) return 'Light Rain';
        if (avgPrecip < 10) return 'Moderate Rain';
        return 'Heavy Rain';
    }
}

module.exports = new RouteService();
