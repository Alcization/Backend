const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/user.controller');
const authJwt = require('../middleware/auth.middleware');

/**
 * User Routes - với Role-Based Access Control
 * Theo: https://www.corbado.com/blog/nodejs-express-postgresql-jwt-authentication-roles
 */

// Public route - không cần authentication
router.get('/test/all', userCtrl.allAccess);

// User routes - yêu cầu authentication
router.get('/test/user', authJwt.verifyToken, userCtrl.userBoard);

// Moderator routes - yêu cầu moderator role
router.get('/test/mod', [authJwt.verifyToken, authJwt.isModerator], userCtrl.moderatorBoard);

// Admin routes - yêu cầu admin role
router.get('/test/admin', [authJwt.verifyToken, authJwt.isAdmin], userCtrl.adminBoard);

// Profile routes - yêu cầu authentication
router.get('/me', authJwt.verifyToken, userCtrl.getMe);
router.put('/me', authJwt.verifyToken, userCtrl.updateMe);

// Preferences routes - yêu cầu authentication
router.get('/me/preferences', authJwt.verifyToken, userCtrl.getPreferences);
router.put('/me/preferences', authJwt.verifyToken, userCtrl.updatePreferences);

// Notifications routes - yêu cầu authentication
router.get('/notifications', authJwt.verifyToken, userCtrl.getNotifications);
router.get('/notification', authJwt.verifyToken, userCtrl.getNotifications); // Alias for singular form
router.put('/notifications/:id/read', authJwt.verifyToken, userCtrl.markNotificationRead);

// Report schedule routes - yêu cầu authentication
router.get('/me/report-schedules', authJwt.verifyToken, userCtrl.getReportSchedules);
router.post('/me/report-schedules', authJwt.verifyToken, userCtrl.saveReportSchedule);

// Report history routes - yêu cầu authentication
router.get('/me/report-history', authJwt.verifyToken, userCtrl.getReportHistory);
router.post('/me/report-history', authJwt.verifyToken, userCtrl.createReportHistory);

module.exports = router;
