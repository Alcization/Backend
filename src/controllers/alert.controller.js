const alertRuleService = require('../services/alertRule.service');
const pushSubscriptionService = require('../services/pushSubscription.service');
const alertEventService = require('../services/alertEvent.service');

class AlertController {
    async listRules(req, res) {
        const locationId = req.query.location_id ? Number(req.query.location_id) : undefined;
        const rules = await alertRuleService.listRules(req.user.id, { locationId });
        res.json({ success: true, data: rules });
    }

    async getRule(req, res) {
        const rule = await alertRuleService.getRule(req.params.id, req.user.id);
        res.json({ success: true, data: rule });
    }

    async createRule(req, res) {
        const rule = await alertRuleService.createRule(req.user.id, req.body);
        res.status(201).json({ success: true, data: rule });
    }

    async updateRule(req, res) {
        const rule = await alertRuleService.updateRule(req.params.id, req.user.id, req.body);
        res.json({ success: true, data: rule });
    }

    async deleteRule(req, res) {
        await alertRuleService.deleteRule(req.params.id, req.user.id);
        res.json({ success: true, message: 'Rule deleted' });
    }

    async listSubscriptions(req, res) {
        const subs = await pushSubscriptionService.list(req.user.id);
        res.json({ success: true, data: subs });
    }

    async createSubscription(req, res) {
        const ua = req.headers['user-agent'];
        const sub = await pushSubscriptionService.upsert(req.user.id, req.body, ua);
        res.status(201).json({ success: true, data: sub });
    }

    async deleteSubscription(req, res) {
        await pushSubscriptionService.removeById(req.params.id, req.user.id);
        res.json({ success: true, message: 'Subscription removed' });
    }

    async getVapidPublicKey(req, res) {
        const publicKey = process.env.VAPID_PUBLIC_KEY;
        if (!publicKey) {
            return res.status(503).json({
                success: false,
                message: 'Web Push is not configured on the server (VAPID_PUBLIC_KEY missing).'
            });
        }
        res.json({ success: true, data: { publicKey } });
    }

    async listEvents(req, res) {
        const limit = Math.min(Number(req.query.limit) || 50, 200);
        const offset = Number(req.query.offset) || 0;
        const result = await alertEventService.list(req.user.id, { limit, offset });
        res.json({ success: true, ...result });
    }

    async markEventRead(req, res) {
        await alertEventService.markRead(req.params.id, req.user.id);
        res.json({ success: true });
    }

    async markAllEventsRead(req, res) {
        const count = await alertEventService.markAllRead(req.user.id);
        res.json({ success: true, data: { updated: count } });
    }
}

module.exports = new AlertController();
