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
        `;

        const segments = await sequelize.query(query, { type: QueryTypes.SELECT });

        // Transform to GeoJSON FeatureCollection
        const features = segments.map(segment => {
            // Determine color based on traffic state or velocity
            const color = this._getTrafficColor(segment.traffic_state, segment.velocity);
            
            // Build LineString geometry from start and end points
            const geometry = segment.start_lng && segment.start_lat && segment.end_lng && segment.end_lat ? {
                type: 'LineString',
                coordinates: [
                    [segment.start_lng, segment.start_lat],
                    [segment.end_lng, segment.end_lat]
                ]
            } : null;
            
            return {
                type: 'Feature',
                geometry: geometry,
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
                wa.center_point[0] as center_lng,
                wa.center_point[1] as center_lat,
                ts.timeslot_id,
                ts.time_value,
                wr.temp,
                wr.feelslike,
                wr.humidity,
                wr.precip,
                wr.windspeed,
                wr.visibility,
                wr.uvindex,
                wr.conditions
            FROM weather_area wa
            LEFT JOIN LATERAL (
                SELECT timeslot_id, time_value
                FROM time_slot
                WHERE area_id = wa.area_id
                ORDER BY time_value DESC
                LIMIT 1
            ) ts ON true
            LEFT JOIN weather_reading wr ON wr.timeslot_id = ts.timeslot_id
            WHERE SUBSTRING(wa.name FROM '\\d+')::INT % 5 = 0
        `;

        const areas = await sequelize.query(query, { type: QueryTypes.SELECT });

        return areas.map(area => ({
            area_id: area.area_id,
            name: area.name,
            center_point: area.center_lng && area.center_lat ? {
                type: 'Point',
                coordinates: [area.center_lng, area.center_lat]
            } : null,
            weather: area.timeslot_id ? {
                time: area.time_value,
                temp: area.temp,
                feelslike: area.feelslike,
                humidity: area.humidity,
                precip: area.precip,
                windspeed: area.windspeed,
                visibility: area.visibility,
                uvindex: area.uvindex,
                conditions: area.conditions,
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
                issue_at
            FROM alert_event
            ORDER BY issue_at DESC
            LIMIT 100
        `;

        const incidents = await sequelize.query(query, { type: QueryTypes.SELECT });

        // Transform to GeoJSON FeatureCollection
        const features = incidents.map(incident => ({
            type: 'Feature',
            geometry: null, // Location not available without PostGIS
            properties: {
                incident_id: incident.alert_event_id,
                name: incident.name,
                type: incident.type,
                description: incident.description,
                issue_at: incident.issue_at,
                icon: this._getIncidentIcon(incident.type),
                color: this._getIncidentColor(incident.type)
            }
        }));

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

    /**
     * Helper: Get color based on incident type
     */
    _getIncidentColor(type) {
        const colorMap = {
            'Flood': '#0066cc',       // Blue
            'Accident': '#ff0000',    // Red
            'Traffic Jam': '#ffa500', // Orange
            'Road Closure': '#808080' // Gray
        };
        return colorMap[type] || '#ffff00'; // Default yellow
    }
}

module.exports = new MapService();
