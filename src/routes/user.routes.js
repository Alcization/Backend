const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');

// All user routes require authentication
router.use(authMiddleware);

// Profile routes
router.get('/me', userCtrl.getMe);
router.put('/me', userCtrl.updateMe);

// Preferences routes
router.get('/me/preferences', userCtrl.getPreferences);
router.put('/me/preferences', userCtrl.updatePreferences);

// Notifications routes
router.get('/notifications', userCtrl.getNotifications);
router.put('/notifications/:id/read', userCtrl.markNotificationRead);

module.exports = router;
