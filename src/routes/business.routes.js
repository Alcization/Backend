const express = require('express');
const router = express.Router();
const businessCtrl = require('../controllers/business.controller');
const authMiddleware = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');

// All business routes require authentication and business role
router.use(authMiddleware);
router.use(requireRole('business'));

// Alert Policies
router.get('/policies', businessCtrl.getPolicies);
router.post('/policies', businessCtrl.createPolicy);

// Dashboard
router.get('/dashboard', businessCtrl.getDashboard);

// Reports
router.get('/reports/weekly', businessCtrl.getWeeklyReport);

module.exports = router;
