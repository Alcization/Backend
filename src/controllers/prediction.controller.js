const aiService = require('../services/ai.service');
const { SavedRoute } = require('../models/prediction.model');

exports.evaluateRouteRisk = async (req, res, next) => {
    try {
        const { routeId, startTime } = req.body;
        
        // 1. Lấy thông tin tuyến đường từ DB
        const route = await SavedRoute.findByPk(routeId);
        if (!route) return res.status(404).json({ msg: 'Route not found' });

        // 2. Gọi Service tính toán
        const riskAnalysis = await aiService.calculateRisk(route.waypoints, startTime);

        res.json({
            success: true,
            data: riskAnalysis
        });
    } catch (error) {
        next(error); // Chuyển cho error handler middleware
    }
};