const { SavedLocation, SavedRoute, HistoryTrip, HistoryWeather } = require('../models/route.model');
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
        if (!data || typeof data !== 'object') {
            const error = new Error('Request body is required');
            error.status = 400;
            throw error;
        }

        const location = await SavedLocation.create({
            user_id: userId,
            custom_name: data.custom_name,
            address: data.address,
            latitude: data.latitude,
            longitude: data.longitude,
            coordinate: data.longitude && data.latitude ? 
                sequelize.literal(`point(${data.longitude}, ${data.latitude})`) : null
        });
        return location;
    }

    /**
     * Update a saved location for a user
     */
    async updateLocation(locationId, userId, data) {
        if (!data || typeof data !== 'object') {
            const error = new Error('Request body is required');
            error.status = 400;
            throw error;
        }

        const location = await SavedLocation.findOne({
            where: { location_id: locationId, user_id: userId }
        });

        if (!location) {
            const error = new Error('Location not found');
            error.status = 404;
            throw error;
        }

        const updateData = {};

        if (data.custom_name !== undefined) updateData.custom_name = data.custom_name;
        if (data.address !== undefined) updateData.address = data.address;
        if (data.latitude !== undefined) updateData.latitude = data.latitude;
        if (data.longitude !== undefined) updateData.longitude = data.longitude;

        if (Object.keys(updateData).length === 0) {
            const error = new Error('No fields provided for update');
            error.status = 400;
            throw error;
        }

        const nextLatitude = updateData.latitude !== undefined ? updateData.latitude : location.latitude;
        const nextLongitude = updateData.longitude !== undefined ? updateData.longitude : location.longitude;

        updateData.coordinate = (nextLatitude !== null && nextLongitude !== null && nextLatitude !== undefined && nextLongitude !== undefined)
            ? sequelize.literal(`point(${nextLongitude}, ${nextLatitude})`)
            : null;

        await SavedLocation.update(updateData, {
            where: { location_id: locationId, user_id: userId }
        });

        return SavedLocation.findOne({
            where: { location_id: locationId, user_id: userId }
        });
    }

    /**
     * Delete a saved location for a user
     */
    async deleteLocation(locationId, userId) {
        const deleted = await SavedLocation.destroy({
            where: { location_id: locationId, user_id: userId }
        });

        if (!deleted) {
            const error = new Error('Location not found');
            error.status = 404;
            throw error;
        }

        return true;
    }

    /**
     * Get all saved routes for a user
     */
    async getRoutes(userId) {
        const routes = await SavedRoute.findAll({
            where: { user_id: userId },
            order: [['route_id', 'DESC']]
        });

        return routes.map(route => this._formatSavedRoute(route));
    }

    /**
     * Create a new route
     * Calculate route segments based on start, end, and waypoints
     */
    async createRoute(userId, data) {
        if (!data || typeof data !== 'object') {
            const error = new Error('Request body is required');
            error.status = 400;
            throw error;
        }

        const name = data.name && typeof data.name === 'string' ? data.name.trim() : '';
        if (!name) {
            const error = new Error('name is required');
            error.status = 400;
            throw error;
        }

        const start = this._normalizeInputPoint(data.start || data.start_point);
        const end = this._normalizeInputPoint(data.end || data.end_point);

        if (!start || !end) {
            const error = new Error('start_point and end_point are required');
            error.status = 400;
            throw error;
        }

        const waypoints = this._normalizeInputWaypoints(data.waypoints);

        let distance = data.distance;
        if (distance !== undefined && distance !== null) {
            distance = Number(distance);
            if (!Number.isFinite(distance) || distance < 0) {
                const error = new Error('distance must be a non-negative number');
                error.status = 400;
                throw error;
            }
        }

        const t = await sequelize.transaction();
        
        try {
            // Calculate distance if start and end are provided
            if ((distance === undefined || distance === null) && start && end) {
                distance = this._calculateDistance(start, end);
            }
            
            // Create saved route
            const route = await SavedRoute.create({
                user_id: userId,
                name,
                start_point: sequelize.literal(`point(${start.lng}, ${start.lat})`),
                end_point: sequelize.literal(`point(${end.lng}, ${end.lat})`),
                waypoints: waypoints.length ? JSON.stringify(waypoints) : null,
                distance: distance,
                start_address: data.start_address || data.startAddress || null,
                end_address: data.end_address || data.endAddress || null
            }, { transaction: t });

            await this._replaceRouteSegments(route.route_id, start, end, waypoints, t);

            await t.commit();
            return this._formatSavedRoute(route);
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    /**
     * Update a saved route for a user
     */
    async updateRoute(routeId, userId, data) {
        if (!data || typeof data !== 'object') {
            const error = new Error('Request body is required');
            error.status = 400;
            throw error;
        }

        const route = await SavedRoute.findOne({
            where: { route_id: routeId, user_id: userId }
        });

        if (!route) {
            const error = new Error('Route not found');
            error.status = 404;
            throw error;
        }

        const hasStartInput = data.start !== undefined || data.start_point !== undefined;
        const hasEndInput = data.end !== undefined || data.end_point !== undefined;
        const hasWaypointsInput = data.waypoints !== undefined;

        const updateData = {};

        if (data.name !== undefined) {
            const name = typeof data.name === 'string' ? data.name.trim() : '';
            if (!name) {
                const error = new Error('name must be a non-empty string');
                error.status = 400;
                throw error;
            }
            updateData.name = name;
        }

        if (data.start_address !== undefined || data.startAddress !== undefined) {
            updateData.start_address = data.start_address !== undefined ? data.start_address : data.startAddress;
        }

        if (data.end_address !== undefined || data.endAddress !== undefined) {
            updateData.end_address = data.end_address !== undefined ? data.end_address : data.endAddress;
        }

        if (data.distance !== undefined) {
            const distance = Number(data.distance);
            if (!Number.isFinite(distance) || distance < 0) {
                const error = new Error('distance must be a non-negative number');
                error.status = 400;
                throw error;
            }
            updateData.distance = distance;
        }

        const currentStart = this._extractPoint(route.start_point);
        const currentEnd = this._extractPoint(route.end_point);
        const currentWaypoints = this._normalizeInputWaypoints(route.waypoints);

        let nextStart = currentStart;
        let nextEnd = currentEnd;
        let nextWaypoints = currentWaypoints;

        if (hasStartInput) {
            nextStart = this._normalizeInputPoint(data.start !== undefined ? data.start : data.start_point);
            if (!nextStart) {
                const error = new Error('start_point must be a valid point');
                error.status = 400;
                throw error;
            }
            updateData.start_point = sequelize.literal(`point(${nextStart.lng}, ${nextStart.lat})`);
        }

        if (hasEndInput) {
            nextEnd = this._normalizeInputPoint(data.end !== undefined ? data.end : data.end_point);
            if (!nextEnd) {
                const error = new Error('end_point must be a valid point');
                error.status = 400;
                throw error;
            }
            updateData.end_point = sequelize.literal(`point(${nextEnd.lng}, ${nextEnd.lat})`);
        }

        if (hasWaypointsInput) {
            nextWaypoints = this._normalizeInputWaypoints(data.waypoints);
            updateData.waypoints = nextWaypoints.length ? JSON.stringify(nextWaypoints) : null;
        }

        if (!nextStart || !nextEnd) {
            const error = new Error('Route must include both start_point and end_point');
            error.status = 400;
            throw error;
        }

        const pointsChanged = hasStartInput || hasEndInput || hasWaypointsInput;

        if (pointsChanged && data.distance === undefined) {
            updateData.distance = this._calculateDistance(nextStart, nextEnd);
        }

        if (Object.keys(updateData).length === 0) {
            const error = new Error('No fields provided for update');
            error.status = 400;
            throw error;
        }

        const t = await sequelize.transaction();

        try {
            await SavedRoute.update(updateData, {
                where: { route_id: routeId, user_id: userId },
                transaction: t
            });

            if (pointsChanged) {
                await this._replaceRouteSegments(routeId, nextStart, nextEnd, nextWaypoints, t);
            }

            const updatedRoute = await SavedRoute.findOne({
                where: { route_id: routeId, user_id: userId },
                transaction: t
            });

            await t.commit();
            return this._formatSavedRoute(updatedRoute);
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    /**
     * Delete a saved route for a user
     */
    async deleteRoute(routeId, userId) {
        const t = await sequelize.transaction();

        try {
            const route = await SavedRoute.findOne({
                where: { route_id: routeId, user_id: userId },
                transaction: t
            });

            if (!route) {
                const error = new Error('Route not found');
                error.status = 404;
                throw error;
            }

            await RouteSegment.destroy({
                where: { saved_route_id: routeId },
                transaction: t
            });

            await SavedRoute.destroy({
                where: { route_id: routeId, user_id: userId },
                transaction: t
            });

            await t.commit();
            return true;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    /**
     * Save route search history for a user
     */
    async createSearchHistory(userId, data) {
        if (!data || typeof data !== 'object') {
            const error = new Error('Request body is required');
            error.status = 400;
            throw error;
        }

        const { origin, destination, weather_status, time } = data;

        if (!origin || !destination) {
            const error = new Error('origin and destination are required');
            error.status = 400;
            throw error;
        }

        const searchTime = time ? new Date(time) : new Date();
        if (Number.isNaN(searchTime.getTime())) {
            const error = new Error('time must be a valid ISO datetime');
            error.status = 400;
            throw error;
        }

        const history = await HistoryTrip.create({
            user_id: userId,
            origin,
            destination,
            weather_status: weather_status || null,
            time: searchTime
        });

        return history;
    }

    /**
     * Get route search history for a user
     */
    async getSearchHistory(userId) {
        const histories = await HistoryTrip.findAll({
            where: { user_id: userId },
            order: [['time', 'DESC'], ['trip_id', 'DESC']]
        });

        return histories;
    }

    /**
     * Save weather search history for a user
     */
    async createWeatherHistory(userId, data) {
        if (!data || typeof data !== 'object') {
            const error = new Error('Request body is required');
            error.status = 400;
            throw error;
        }

        const { location, weather_status, temp, time } = data;

        if (!location) {
            const error = new Error('location is required');
            error.status = 400;
            throw error;
        }

        const searchTime = time ? new Date(time) : new Date();
        if (Number.isNaN(searchTime.getTime())) {
            const error = new Error('time must be a valid ISO datetime');
            error.status = 400;
            throw error;
        }

        if (temp !== undefined && (typeof temp !== 'number' || !Number.isInteger(temp))) {
            const error = new Error('temp must be an integer');
            error.status = 400;
            throw error;
        }

        const history = await HistoryWeather.create({
            user_id: userId,
            location,
            weather_status: weather_status || null,
            temp: temp !== undefined ? temp : null,
            time: searchTime
        });

        return history;
    }

    /**
     * Get weather search history for a user
     */
    async getWeatherHistory(userId) {
        const histories = await HistoryWeather.findAll({
            where: { user_id: userId },
            order: [['time', 'DESC'], ['location_id', 'DESC']]
        });

        return histories;
    }

    /**
     * Get route details
     */
    async getRoute(routeId, userId) {
        const route = await SavedRoute.findOne({
            where: { route_id: routeId, user_id: userId }
        });

        if (!route) {
            const error = new Error('Route not found');
            error.status = 404;
            throw error;
        }

        // Get route segments
        const segments = await RouteSegment.findAll({
            where: { saved_route_id: routeId },
            order: [['order_in_route', 'ASC']]
        });

        return {
            ...this._formatSavedRoute(route),
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
                rs.start_point[0] as start_lng,
                rs.start_point[1] as start_lat,
                rs.end_point[0] as end_lng,
                rs.end_point[1] as end_lat,
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

        // Get weather areas along the route - simplified query without spatial filters
        const weatherQuery = `
            SELECT DISTINCT
                wa.area_id,
                wa.name,
                wa.center_point[0] as center_lng,
                wa.center_point[1] as center_lat,
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
            WHERE ts.time_value = (
                SELECT MAX(time_value)
                FROM time_slot
                WHERE area_id = wa.area_id
            )
            LIMIT 10
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

    _formatSavedRoute(route) {
        const raw = route.toJSON ? route.toJSON() : route;
        const startPoint = this._extractPoint(raw.start_point);
        const endPoint = this._extractPoint(raw.end_point);

        return {
            ...raw,
            start_point: startPoint,
            end_point: endPoint,
            start: startPoint,
            end: endPoint,
            waypoints: this._parseWaypoints(raw.waypoints)
        };
    }

    _parseWaypoints(waypoints) {
        if (!waypoints) {
            return [];
        }

        if (Array.isArray(waypoints)) {
            return waypoints;
        }

        if (typeof waypoints === 'string') {
            try {
                const parsed = JSON.parse(waypoints);
                return Array.isArray(parsed) ? parsed : [];
            } catch (_error) {
                return [];
            }
        }

        return [];
    }

    _extractPoint(pointValue) {
        if (!pointValue) {
            return null;
        }

        if (pointValue.type === 'Point' && Array.isArray(pointValue.coordinates)) {
            return {
                lng: Number(pointValue.coordinates[0]),
                lat: Number(pointValue.coordinates[1])
            };
        }

        if (pointValue.x !== undefined && pointValue.y !== undefined) {
            return {
                lng: Number(pointValue.x),
                lat: Number(pointValue.y)
            };
        }

        if (Array.isArray(pointValue) && pointValue.length >= 2) {
            return {
                lng: Number(pointValue[0]),
                lat: Number(pointValue[1])
            };
        }

        if (typeof pointValue === 'string') {
            const normalized = pointValue.trim();
            const match = normalized.match(/^\(?\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)?$/);

            if (match) {
                return {
                    lng: Number(match[1]),
                    lat: Number(match[2])
                };
            }

            try {
                const parsed = JSON.parse(normalized);
                return this._extractPoint(parsed);
            } catch (_error) {
                return null;
            }
        }

        return null;
    }

    _normalizeInputPoint(point) {
        if (!point) {
            return null;
        }

        if (typeof point === 'object' && !Array.isArray(point)) {
            const lng = point.lng !== undefined ? point.lng : point.longitude;
            const lat = point.lat !== undefined ? point.lat : point.latitude;

            if (lng !== undefined && lat !== undefined) {
                const normalizedLng = Number(lng);
                const normalizedLat = Number(lat);

                if (Number.isFinite(normalizedLng) && Number.isFinite(normalizedLat)) {
                    return { lng: normalizedLng, lat: normalizedLat };
                }
            }
        }

        return this._extractPoint(point);
    }

    _normalizeInputWaypoints(waypoints) {
        if (waypoints === undefined || waypoints === null) {
            return [];
        }

        const parsedWaypoints = this._parseWaypoints(waypoints);

        return parsedWaypoints
            .map(point => this._normalizeInputPoint(point))
            .filter(Boolean);
    }

    async _replaceRouteSegments(routeId, start, end, waypoints, transaction) {
        await RouteSegment.destroy({
            where: { saved_route_id: routeId },
            transaction
        });

        const points = [start, ...waypoints, end];

        for (let i = 0; i < points.length - 1; i++) {
            const from = points[i];
            const to = points[i + 1];

            await RouteSegment.create({
                saved_route_id: routeId,
                start_point: sequelize.literal(`point(${from.lng}, ${from.lat})`),
                end_point: sequelize.literal(`point(${to.lng}, ${to.lat})`),
                coordinate: sequelize.literal(`path '[(${from.lng},${from.lat}),(${to.lng},${to.lat})]'`),
                order_in_route: i + 1
            }, { transaction });
        }
    }
}

module.exports = new RouteService();
