const asyncHandler = require('../utils/asyncHandler');
const userService = require('../services/user.service');

/**
 * User Controller - Demo Role-Based Access Control
 * Theo: https://www.corbado.com/blog/nodejs-express-postgresql-jwt-authentication-roles
 */

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

// GET /users/me/report-schedules - Get periodic report schedules of current user
exports.getReportSchedules = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const schedules = await userService.getReportSchedules(userId, req.query);
    res.json(schedules);
});

// GET /users/me/report-history - Get report history of current user
exports.getReportHistory = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const history = await userService.getReportHistory(userId, req.query);
    res.json(history);
});

// POST /users/me/report-history - Create a report history record for current user
exports.createReportHistory = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const created = await userService.createReportHistory(userId, req.body);
    res.status(201).json(created);
});

// POST /users/me/report-schedules - Save a periodic report schedule
exports.saveReportSchedule = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await userService.saveReportSchedule(userId, req.body);
    res.status(result.created ? 201 : 200).json(result.schedule);
});

/**
 * Demo endpoints cho role-based access control
 */

// Public content - Accessible by anyone
exports.allAccess = (req, res) => {
    res.status(200).send('Public Content.');
};

// User content - Requires authentication
exports.userBoard = (req, res) => {
    res.status(200).send('User Content.');
};

// Moderator content - Requires moderator role
exports.moderatorBoard = (req, res) => {
    res.status(200).send('Moderator Content.');
};

// Admin content - Requires admin role
exports.adminBoard = (req, res) => {
    res.status(200).send('Admin Content.');
};
