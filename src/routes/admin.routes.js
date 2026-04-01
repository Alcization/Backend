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
router.get('/areas/:id', adminCtrl.getArea);
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

// Alert Events (CRUD)
router.get('/alerts', adminCtrl.getAlertEvents);
router.get('/alerts/:id', adminCtrl.getAlertEvent);
router.post('/alerts', adminCtrl.createAlertEvent);
router.put('/alerts/:id', adminCtrl.updateAlertEvent);
router.delete('/alerts/:id', adminCtrl.deleteAlertEvent);

module.exports = router;
