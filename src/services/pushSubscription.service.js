const { PushSubscription } = require('../models/locationAlert.model');

const badRequest = (message) => {
    const err = new Error(message);
    err.status = 400;
    return err;
};

class PushSubscriptionService {
    async list(userId) {
        return PushSubscription.findAll({
            where: { user_id: userId },
            order: [['sub_id', 'DESC']]
        });
    }

    async upsert(userId, data, userAgent) {
        if (!data || typeof data !== 'object') {
            throw badRequest('Request body is required');
        }
        const endpoint = data.endpoint;
        const keys = data.keys || {};
        const p256dh = keys.p256dh || data.p256dh;
        const auth = keys.auth || data.auth;

        if (!endpoint || !p256dh || !auth) {
            throw badRequest('endpoint, keys.p256dh and keys.auth are required');
        }

        const existing = await PushSubscription.findOne({ where: { endpoint } });
        if (existing) {
            await existing.update({
                user_id: userId,
                p256dh,
                auth,
                user_agent: userAgent || existing.user_agent
            });
            return existing;
        }
        return PushSubscription.create({
            user_id: userId,
            endpoint,
            p256dh,
            auth,
            user_agent: userAgent || null
        });
    }

    async removeById(subId, userId) {
        const deleted = await PushSubscription.destroy({
            where: { sub_id: subId, user_id: userId }
        });
        if (!deleted) {
            const err = new Error('Subscription not found');
            err.status = 404;
            throw err;
        }
        return true;
    }

    async removeByEndpoint(endpoint) {
        return PushSubscription.destroy({ where: { endpoint } });
    }
}

module.exports = new PushSubscriptionService();
