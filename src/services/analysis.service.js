const { WeatherForecast, WeatherArea, TimeSlot, RouteSegment, TrafficReading } = require('../models/map.model');
const { RiskAssessment, Trip } = require('../models/route.model');
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');

class AnalysisService {
    /**
     * Get weather forecast for a location
     */
    async getForecast(lat, lng) {
        // Find nearest weather area
        const areaQuery = `
            SELECT area_id, name, ST_Distance(
                center_point::geography,
                ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
            ) as distance
            FROM weather_area
            ORDER BY distance
            LIMIT 1
        `;

        const [area] = await sequelize.query(areaQuery, {
            bind: [lng, lat],
            type: QueryTypes.SELECT
        });

        if (!area) {
            throw new Error('No weather area found near this location');
        }

        // Get forecasts for this area (next 7 days)
        const forecasts = await WeatherForecast.findAll({
            where: { area_id: area.area_id },
            order: [['forecast_datetime', 'ASC']],
            limit: 168 // 7 days * 24 hours
        });

        return {
            location: { lat, lng },
            area: {
                area_id: area.area_id,
                name: area.name,
                distance: area.distance
            },
            forecasts: forecasts.map(f => ({
                datetime: f.forecast_datetime,
                temp: f.temp,
                tempmax: f.tempmax,
                tempmin: f.tempmin,
                humidity: f.humidity,
                precip: f.precip,
                precipprob: f.precipprob,
                windspeed: f.windspeed,
                winddir: f.winddir,
                conditions: f.conditions,
                icon: f.icon
            }))
        };
    }

    /**
     * Assess trip risk based on route, departure time, and conditions
     */
    async assessTripRisk(userId, params) {
        const { route_id, origin, destination, start_time } = params;

        let routeData;
        
        // Get route information
        if (route_id) {
            routeData = await this._getRouteDataById(route_id);
        } else if (origin && destination) {
            routeData = await this._getRouteDataByPoints(origin, destination);
        } else {
            throw new Error('Either route_id or origin/destination must be provided');
        }

        // Get weather forecast for start time
        const departureTime = start_time ? new Date(start_time) : new Date();
        const weatherRisk = await this._assessWeatherRisk(routeData.segments, departureTime);
        
        // Get current/expected traffic conditions
        const trafficRisk = await this._assessTrafficRisk(routeData.segments, departureTime);

        // Calculate overall risk
        const overallRisk = this._calculateOverallRisk(weatherRisk, trafficRisk);

        // Generate suggestions
        const suggestions = this._generateSuggestions(weatherRisk, trafficRisk, overallRisk);

        // Save risk assessment
        const assessment = await RiskAssessment.create({
            trip_id: params.trip_id || null,
            user_id: userId,
            route_id: route_id || null,
            assessment_time: new Date(),
            risk_level: overallRisk.level,
            weather_risk: weatherRisk.level,
            traffic_risk: trafficRisk.level,
            risk_factors: JSON.stringify(overallRisk.factors),
            suggestions: JSON.stringify(suggestions)
        });

        return {
            assessment_id: assessment.assessment_id,
            route: routeData.name || `${routeData.origin} → ${routeData.destination}`,
            departure_time: departureTime,
            risk_level: overallRisk.level,
            score: overallRisk.score,
            weather_risk: {
                level: weatherRisk.level,
                score: weatherRisk.score,
                factors: weatherRisk.factors
            },
            traffic_risk: {
                level: trafficRisk.level,
                score: trafficRisk.score,
                factors: trafficRisk.factors
            },
            risk_factors: overallRisk.factors,
            suggestions: suggestions
        };
    }

    /**
     * Get route data by route ID
     */
    async _getRouteDataById(routeId) {
        const query = `
            SELECT 
                sr.route_id,
                sr.name,
                rs.segment_id,
                ST_AsGeoJSON(rs.start_point) as start_point,
                ST_AsGeoJSON(rs.end_point) as end_point,
                ST_AsGeoJSON(rs.coordinate) as coordinate
            FROM saved_route sr
            JOIN route_segment rs ON rs.saved_route_id = sr.route_id
            WHERE sr.route_id = :routeId
            ORDER BY rs.order_in_route
        `;

        const segments = await sequelize.query(query, {
            replacements: { routeId },
            type: QueryTypes.SELECT
        });

        return {
            route_id: routeId,
            name: segments[0]?.name,
            segments: segments
        };
    }

    /**
     * Get route data by origin/destination points
     */
    async _getRouteDataByPoints(origin, destination) {
        return {
            origin: `${origin.lat}, ${origin.lng}`,
            destination: `${destination.lat}, ${destination.lng}`,
            segments: [
                {
                    start_point: JSON.stringify({ type: 'Point', coordinates: [origin.lng, origin.lat] }),
                    end_point: JSON.stringify({ type: 'Point', coordinates: [destination.lng, destination.lat] })
                }
            ]
        };
    }

    /**
     * Assess weather risk along the route
     */
    async _assessWeatherRisk(segments, departureTime) {
        let totalScore = 0;
        const factors = [];

        for (const segment of segments) {
            const startPoint = JSON.parse(segment.start_point);
            const [lng, lat] = startPoint.coordinates;

            // Find forecast near this segment
            const forecastQuery = `
                SELECT wf.*
                FROM weather_forecast wf
                JOIN weather_area wa ON wa.area_id = wf.area_id
                WHERE ST_DWithin(
                    wa.center_point::geography,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                    10000
                )
                AND wf.forecast_datetime >= $3
                AND wf.forecast_datetime < $3 + INTERVAL '2 hours'
                ORDER BY ST_Distance(
                    wa.center_point::geography,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
                )
                LIMIT 1
            `;

            const [forecast] = await sequelize.query(forecastQuery, {
                bind: [lng, lat, departureTime],
                type: QueryTypes.SELECT
            });

            if (forecast) {
                let segmentScore = 0;

                // Precipitation risk
                if (forecast.precipprob > 70) {
                    segmentScore += 30;
                    factors.push(`Heavy rain expected (${forecast.precipprob}% probability)`);
                } else if (forecast.precipprob > 40) {
                    segmentScore += 15;
                    factors.push(`Moderate rain expected (${forecast.precipprob}% probability)`);
                }

                // Wind risk
                if (forecast.windspeed > 50) {
                    segmentScore += 20;
                    factors.push(`Strong winds (${forecast.windspeed} km/h)`);
                } else if (forecast.windspeed > 30) {
                    segmentScore += 10;
                }

                // Temperature extreme
                if (forecast.temp > 35 || forecast.temp < 5) {
                    segmentScore += 10;
                    factors.push(`Extreme temperature (${forecast.temp}°C)`);
                }

                totalScore += segmentScore;
            }
        }

        const avgScore = segments.length > 0 ? totalScore / segments.length : 0;
        const level = this._scoreToLevel(avgScore);

        return {
            score: avgScore,
            level,
            factors: [...new Set(factors)] // Remove duplicates
        };
    }

    /**
     * Assess traffic risk along the route
     */
    async _assessTrafficRisk(segments, departureTime) {
        let totalScore = 0;
        const factors = [];

        for (const segment of segments) {
            if (!segment.segment_id) continue;

            // Get latest traffic reading
            const traffic = await TrafficReading.findOne({
                where: { segment_id: segment.segment_id },
                order: [['time_reading', 'DESC']]
            });

            if (traffic) {
                let segmentScore = 0;

                // Velocity-based risk
                if (traffic.velocity < 15) {
                    segmentScore += 30;
                    factors.push('Heavy congestion detected');
                } else if (traffic.velocity < 30) {
                    segmentScore += 20;
                    factors.push('Moderate congestion');
                } else if (traffic.velocity < 50) {
                    segmentScore += 10;
                    factors.push('Slow traffic');
                }

                // Traffic state
                if (traffic.traffic_state === 'F') {
                    segmentScore += 30;
                } else if (traffic.traffic_state === 'E') {
                    segmentScore += 20;
                } else if (traffic.traffic_state === 'D') {
                    segmentScore += 10;
                }

                totalScore += segmentScore;
            }
        }

        const avgScore = segments.length > 0 ? totalScore / segments.length : 0;
        const level = this._scoreToLevel(avgScore);

        return {
            score: avgScore,
            level,
            factors: [...new Set(factors)]
        };
    }

    /**
     * Calculate overall risk from weather and traffic
     */
    _calculateOverallRisk(weatherRisk, trafficRisk) {
        const score = (weatherRisk.score * 0.6) + (trafficRisk.score * 0.4);
        const level = this._scoreToLevel(score);
        const factors = [...weatherRisk.factors, ...trafficRisk.factors];

        return { score, level, factors };
    }

    /**
     * Convert numeric score to risk level
     */
    _scoreToLevel(score) {
        if (score >= 25) return 'Critical';
        if (score >= 15) return 'High';
        if (score >= 8) return 'Medium';
        return 'Low';
    }

    /**
     * Generate suggestions based on risk assessment
     */
    _generateSuggestions(weatherRisk, trafficRisk, overallRisk) {
        const suggestions = [];

        if (overallRisk.level === 'Critical') {
            suggestions.push('Consider postponing your trip if possible');
        }

        if (weatherRisk.score > 20) {
            suggestions.push('Check weather updates before departure');
            suggestions.push('Drive with extra caution due to weather conditions');
            suggestions.push('Allow extra time for your journey');
        }

        if (trafficRisk.score > 20) {
            suggestions.push('Consider alternative routes to avoid congestion');
            suggestions.push('Depart earlier or later to avoid peak traffic');
        }

        if (weatherRisk.factors.some(f => f.includes('rain'))) {
            suggestions.push('Ensure your vehicle has good tire tread');
            suggestions.push('Use headlights and reduce speed in rain');
        }

        if (trafficRisk.factors.some(f => f.includes('congestion'))) {
            suggestions.push('Use real-time navigation for traffic updates');
        }

        if (suggestions.length === 0) {
            suggestions.push('Conditions are favorable for your trip');
            suggestions.push('Drive safely and enjoy your journey');
        }

        return suggestions;
    }
}

module.exports = new AnalysisService();
