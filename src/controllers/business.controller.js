const asyncHandler = require('../utils/asyncHandler');
const businessService = require('../services/business.service');

// GET /business/policies - Get all policies
exports.getPolicies = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const policies = await businessService.getPolicies(userId);
    res.json(policies);
});

// POST /business/policies - Create new policy
exports.createPolicy = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const accountType = req.user.account_type;
    
    // Validate request body
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ 
            message: 'Request body is required',
            received: req.body 
        });
    }
    
    const result = await businessService.createPolicy(userId, accountType, req.body);
    res.status(result.created ? 201 : 200).json(result.policy);
});

// GET /business/dashboard - Get dashboard statistics
exports.getDashboard = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const dashboard = await businessService.getDashboard(userId);
    res.json(dashboard);
});

// GET /business/reports/weekly - Get weekly report
exports.getWeeklyReport = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const report = await businessService.getWeeklyReport(userId);
    res.json(report);
});
