const express = require('express');
const router = express.Router();
const adminCtrl = require('../controllers/admin.controller');
const authJwt = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');

// All admin routes require authentication and admin role
router.use(authJwt.verifyToken);
router.use(requireRole('admin', 'admin_officer'));

// Admin Areas (CRUD)
router.get('/areas', adminCtrl.getAreas);
router.post('/areas', adminCtrl.createArea);
router.put('/areas/:id', adminCtrl.updateArea);
router.delete('/areas/:id', adminCtrl.deleteArea);

// Response Scenarios
router.get('/scenarios', adminCtrl.getScenarios);
router.get('/scenarios/:id', adminCtrl.getScenario);
router.post('/scenarios', adminCtrl.createScenario);

// Checklist Items
router.post('/scenarios/:id/items', adminCtrl.addChecklistItem);

// Admin Dashboard
router.get('/dashboard', adminCtrl.getDashboard);

module.exports = router;
