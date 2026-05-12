const express = require('express');
const router = express.Router();
const businessCtrl = require('../controllers/business.controller');
const authJwt = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');

// All business routes require authentication
router.use(authJwt.verifyToken);

// Alert Policies are available to both individual and business accounts
router.get('/policies', businessCtrl.getPolicies);
router.post('/policies', businessCtrl.createPolicy);

// Business-only routes
router.use(requireRole('business'));

// Dashboard
router.get('/dashboard', businessCtrl.getDashboard);

// Reports
router.get('/reports/weekly', businessCtrl.getWeeklyReport);

module.exports = router;
