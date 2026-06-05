const { NotificationEvent } = require('../models/notification.model');

class AlertEventService {
    async list(userId, { limit = 50, offset = 0 } = {}) {
        const { rows, count } = await NotificationEvent.findAndCountAll({
            where: { user_id: userId },
            order: [['issue_at', 'DESC'], ['noti_event_id', 'DESC']],
            limit,
            offset
        });
        return { data: rows, total: count, limit, offset };
    }

    async create(userId, { name, description, type }) {
        return NotificationEvent.create({
            user_id: userId,
            name,
            description,
            type: type || 'LocationAlert'
        });
    }

    async markRead(eventId, userId) {
        const [updated] = await NotificationEvent.update(
            { is_read: true },
            { where: { noti_event_id: eventId, user_id: userId } }
        );
        if (!updated) {
            const err = new Error('Event not found');
            err.status = 404;
            throw err;
        }
        return true;
    }

    async markAllRead(userId) {
        const [updated] = await NotificationEvent.update(
            { is_read: true },
            { where: { user_id: userId, is_read: false } }
        );
        return updated;
    }
}

module.exports = new AlertEventService();
