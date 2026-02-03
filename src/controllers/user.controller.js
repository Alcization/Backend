const asyncHandler = require('../utils/asyncHandler');
const userService = require('../services/user.service');

// GET /users/me - Get current user profile
exports.getMe = asyncHandler(async (req, res) => {
    const userId = req.user.id; // From auth middleware
    const profile = await userService.getProfile(userId);
    res.json(profile);
});

// PUT /users/me - Update current user profile
exports.updateMe = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const profile = await userService.updateProfile(userId, req.body);
    res.json(profile);
});

// GET /users/me/preferences - Get notification preferences
exports.getPreferences = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const preferences = await userService.getPreferences(userId);
    res.json(preferences);
});

// PUT /users/me/preferences - Update notification preference
exports.updatePreferences = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const preference = await userService.updatePreferences(userId, req.body);
    res.json(preference);
});

// GET /users/notifications - Get user notifications
exports.getNotifications = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const notifications = await userService.getNotifications(userId, limit);
    res.json(notifications);
});

// PUT /users/notifications/:id/read - Mark notification as read
exports.markNotificationRead = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const notiEventId = parseInt(req.params.id);
    const notification = await userService.markNotificationRead(userId, notiEventId);
    res.json(notification);
});
