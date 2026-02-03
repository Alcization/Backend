const { RouteSegment, TrafficReading, WeatherArea, TimeSlot, WeatherReading, AlertEvent } = require('../models/map.model');
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');

class MapService {
    /**
     * Get traffic data in GeoJSON format
     * Returns route segments with latest traffic readings
     */
    async getTrafficData() {
        // Get all segments with their latest traffic reading
        const query = `
            SELECT 
                rs.segment_id,
                ST_AsGeoJSON(rs.start_point) as start_point,
                ST_AsGeoJSON(rs.end_point) as end_point,
                ST_AsGeoJSON(rs.coordinate) as coordinate,
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
        `;

        const segments = await sequelize.query(query, { type: QueryTypes.SELECT });

        // Transform to GeoJSON FeatureCollection
        const features = segments.map(segment => {
            // Determine color based on traffic state or velocity
            const color = this._getTrafficColor(segment.traffic_state, segment.velocity);
            
            return {
                type: 'Feature',
                geometry: segment.coordinate ? JSON.parse(segment.coordinate) : null,
                properties: {
                    segment_id: segment.segment_id,
                    velocity: segment.velocity,
                    traffic_state: segment.traffic_state,
                    color: color,
                    time_reading: segment.time_reading,
                    description: this._getTrafficDescription(segment.traffic_state)
                }
            };
        }).filter(f => f.geometry !== null); // Only include segments with coordinates

        return {
            type: 'FeatureCollection',
            features: features
        };
    }

    /**
     * Get weather areas with current weather data
     */
    async getWeatherAreas() {
        const query = `
            SELECT 
                wa.area_id,
                wa.name,
                ST_AsGeoJSON(wa.center_point) as center_point,
                ts.timeslot_id,
                ts.time_value,
                wr.temp,
                wr.feelslike,
                wr.humidity,
                wr.precip,
                wr.precipprob,
                wr.preciptype,
                wr.windspeed,
                wr.windgust,
                wr.winddir,
                wr.cloudcover,
                wr.visibility,
                wr.uvindex,
                wr.conditions,
                wr.icon
            FROM weather_area wa
            LEFT JOIN LATERAL (
                SELECT timeslot_id, time_value
                FROM time_slot
                WHERE area_id = wa.area_id
                ORDER BY time_value DESC
                LIMIT 1
            ) ts ON true
            LEFT JOIN weather_reading wr ON wr.timeslot_id = ts.timeslot_id
        `;

        const areas = await sequelize.query(query, { type: QueryTypes.SELECT });

        return areas.map(area => ({
            area_id: area.area_id,
            name: area.name,
            center_point: area.center_point ? JSON.parse(area.center_point) : null,
            weather: area.timeslot_id ? {
                time: area.time_value,
                temp: area.temp,
                feelslike: area.feelslike,
                humidity: area.humidity,
                precip: area.precip,
                precipprob: area.precipprob,
                preciptype: area.preciptype,
                windspeed: area.windspeed,
                windgust: area.windgust,
                winddir: area.winddir,
                cloudcover: area.cloudcover,
                visibility: area.visibility,
                uvindex: area.uvindex,
                conditions: area.conditions,
                icon: area.icon
            } : null
        }));
    }

    /**
     * Get current incidents (floods, accidents, etc.)
     * Returns unresolved alert events with location data
     */
    async getIncidents() {
        const query = `
            SELECT 
                alert_event_id,
                name,
                type,
                description,
                ST_AsGeoJSON(location) as location,
                severity,
                issue_at,
                resolved_at
            FROM alert_event
            WHERE resolved_at IS NULL
            ORDER BY issue_at DESC
        `;

        const incidents = await sequelize.query(query, { type: QueryTypes.SELECT });

        // Transform to GeoJSON FeatureCollection
        const features = incidents.map(incident => ({
            type: 'Feature',
            geometry: incident.location ? JSON.parse(incident.location) : null,
            properties: {
                incident_id: incident.alert_event_id,
                name: incident.name,
                type: incident.type,
                description: incident.description,
                severity: incident.severity,
                issue_at: incident.issue_at,
                icon: this._getIncidentIcon(incident.type),
                color: this._getSeverityColor(incident.severity)
            }
        })).filter(f => f.geometry !== null);

        return {
            type: 'FeatureCollection',
            features: features
        };
    }

    /**
     * Helper: Determine traffic color based on state and velocity
     */
    _getTrafficColor(trafficState, velocity) {
        // LOS (Level of Service): A (best) to F (worst)
        const colorMap = {
            'A': '#00ff00', // Green - free flow
            'B': '#7fff00', // Light green
            'C': '#ffff00', // Yellow
            'D': '#ffa500', // Orange
            'E': '#ff4500', // Red-orange
            'F': '#ff0000'  // Red - congested
        };

        if (trafficState && colorMap[trafficState]) {
            return colorMap[trafficState];
        }

        // Fallback: use velocity if available
        if (velocity !== null && velocity !== undefined) {
            if (velocity > 50) return '#00ff00';
            if (velocity > 30) return '#ffff00';
            if (velocity > 15) return '#ffa500';
            return '#ff0000';
        }

        return '#808080'; // Gray - no data
    }

    /**
     * Helper: Get traffic state description
     */
    _getTrafficDescription(trafficState) {
        const descriptions = {
            'A': 'Free flow',
            'B': 'Reasonably free flow',
            'C': 'Stable flow',
            'D': 'Approaching unstable flow',
            'E': 'Unstable flow',
            'F': 'Forced or breakdown flow'
        };
        return descriptions[trafficState] || 'Unknown';
    }

    /**
     * Helper: Get incident icon based on type
     */
    _getIncidentIcon(type) {
        const iconMap = {
            'Flood': 'water',
            'Accident': 'warning',
            'Traffic Jam': 'traffic',
            'Road Closure': 'block'
        };
        return iconMap[type] || 'alert';
    }

    /**
     * Helper: Get color based on severity
     */
    _getSeverityColor(severity) {
        const colorMap = {
            'Low': '#ffff00',      // Yellow
            'Medium': '#ffa500',   // Orange
            'High': '#ff4500',     // Red-orange
            'Critical': '#ff0000'  // Red
        };
        return colorMap[severity] || '#808080';
    }
}

module.exports = new MapService();
