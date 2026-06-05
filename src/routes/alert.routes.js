const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alert.controller');
const authJwt = require('../middleware/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');

router.use(authJwt.verifyToken);

// Threshold rules attached to favorite locations
router.get('/rules', asyncHandler(alertController.listRules));
router.post('/rules', asyncHandler(alertController.createRule));
router.get('/rules/:id', asyncHandler(alertController.getRule));
router.patch('/rules/:id', asyncHandler(alertController.updateRule));
router.put('/rules/:id', asyncHandler(alertController.updateRule));
router.delete('/rules/:id', asyncHandler(alertController.deleteRule));

// Web Push subscriptions (per device)
router.get('/push-subscriptions/public-key', asyncHandler(alertController.getVapidPublicKey));
router.get('/push-subscriptions', asyncHandler(alertController.listSubscriptions));
router.post('/push-subscriptions', asyncHandler(alertController.createSubscription));
router.delete('/push-subscriptions/:id', asyncHandler(alertController.deleteSubscription));

// Triggered notification events feed
router.get('/events', asyncHandler(alertController.listEvents));
router.patch('/events/read-all', asyncHandler(alertController.markAllEventsRead));
router.patch('/events/:id/read', asyncHandler(alertController.markEventRead));

module.exports = router;
