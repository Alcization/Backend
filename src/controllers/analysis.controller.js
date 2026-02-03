const analysisService = require('../services/analysis.service');

class AnalysisController {
    /**
     * GET /analysis/forecast?lat={lat}&lng={lng}
     * Get weather forecast for a location
     */
    async getForecast(req, res) {
        const { lat, lng } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required'
            });
        }

        const forecast = await analysisService.getForecast(
            parseFloat(lat),
            parseFloat(lng)
        );

        res.json({
            success: true,
            data: forecast
        });
    }

    /**
     * POST /analysis/assess-risk
     * Assess trip risk based on route and conditions
     * 
     * Body: {
     *   route_id?: number,
     *   origin?: {lat, lng},
     *   destination?: {lat, lng},
     *   start_time?: ISO datetime,
     *   trip_id?: number (optional)
     * }
     */
    async assessRisk(req, res) {
        const assessment = await analysisService.assessTripRisk(
            req.user.user_id,
            req.body
        );

        res.json({
            success: true,
            data: assessment
        });
    }
}

module.exports = new AnalysisController();
