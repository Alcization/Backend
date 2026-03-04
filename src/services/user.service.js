const { UserAccount, IndividualUser, BusinessUser } = require('../models/user.model');
const { NotificationPreference, NotificationEvent } = require('../models/notification.model');

class UserService {
    async getProfile(userId) {
        const user = await UserAccount.findByPk(userId, {
            attributes: { exclude: ['password_hash'] },
            include: [
                { model: IndividualUser, required: false },
                { model: BusinessUser, required: false }
            ]
        });
        if (!user) throw new Error('User not found');
        return user;
    }

    async updateProfile(userId, data) {
        const user = await UserAccount.findByPk(userId);
        if (!user) throw new Error('User not found');

        // Update basic user fields
        if (data.phone_number !== undefined) user.phone_number = data.phone_number;
        if (data.language !== undefined) user.language = data.language;
        await user.save();

        // Update account-type specific profile
        if (user.account_type === 'individual') {
            const profile = await IndividualUser.findOne({ where: { user_id: userId } });
            if (profile && data.full_name !== undefined) {
                profile.full_name = data.full_name;
                await profile.save();
            }
        } else if (user.account_type === 'business') {
            const profile = await BusinessUser.findOne({ where: { user_id: userId } });
            if (profile) {
                if (data.company_name !== undefined) profile.company_name = data.company_name;
                if (data.tax_code !== undefined) profile.tax_code = data.tax_code;
                await profile.save();
            }
        }

        return this.getProfile(userId);
    }

    async getPreferences(userId) {
        const preferences = await NotificationPreference.findAll({ where: { user_id: userId } });
        return preferences;
    }

    async updatePreferences(userId, data) {
        // data: { noti_type: 'Traffic', threshold: 5 }
        // Upsert logic: find existing or create new
        const { noti_type, threshold } = data;
        if (!noti_type) throw new Error('noti_type is required');

        let pref = await NotificationPreference.findOne({ where: { user_id: userId, noti_type } });
        if (pref) {
            pref.threshold = threshold;
            await pref.save();
        } else {
            pref = await NotificationPreference.create({ user_id: userId, noti_type, threshold });
        }
        return pref;
    }

    async getNotifications(userId, limit = 50) {
        const notifications = await NotificationEvent.findAll({
            where: { user_id: userId },
            order: [['issue_at', 'DESC']],
            limit
        });
        return notifications;
    }

    async markNotificationRead(userId, notiEventId) {
        const notification = await NotificationEvent.findOne({ where: { noti_event_id: notiEventId, user_id: userId } });
        if (!notification) throw new Error('Notification not found');
        notification.is_read = true;
        await notification.save();
        return notification;
    }
}

module.exports = new UserService();
