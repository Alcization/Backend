const { UserAccount, IndividualUser, BusinessUser } = require('../models/user.model');
const { NotificationPreference, NotificationEvent } = require('../models/notification.model');
const { ReportSchedule } = require('../models/reportSchedule.model');

const REPORT_SCHEDULE_TYPE = {
    weekly: 'weekly',
    monthly: 'monthly'
};

const REPORT_NAME_STORAGE_ORDER = ['weather', 'alerts', 'incidents'];
const REPORT_NAME_INPUT_MAP = {
    weather: 'weather',
    'thời tiết': 'weather',
    'thoi tiet': 'weather',
    alerts: 'alerts',
    alert: 'alerts',
    'cảnh báo': 'alerts',
    'canh bao': 'alerts',
    incidents: 'incidents',
    incident: 'incidents',
    'sự cố': 'incidents',
    'su co': 'incidents'
};

const REPORT_NAME_OUTPUT_MAP = {
    weather: 'Thời tiết',
    alerts: 'Cảnh báo',
    incidents: 'Sự cố'
};

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

    async getReportSchedules(userId, query = {}) {
        const where = { user_id: userId };

        if (query.type !== undefined) {
            const normalizedType = this._normalizeScheduleType(query.type);
            if (!normalizedType) {
                const error = new Error('type must be weekly or monthly');
                error.status = 400;
                throw error;
            }
            where.type = normalizedType;
        }

        const schedules = await ReportSchedule.findAll({
            where,
            order: [['id', 'DESC']]
        });

        return schedules.map(schedule => this._formatScheduleForResponse(schedule));
    }

    async saveReportSchedule(userId, data) {
        if (!data || typeof data !== 'object') {
            const error = new Error('Request body is required');
            error.status = 400;
            throw error;
        }

        const scheduleType = this._normalizeScheduleType(data.type);
        if (!scheduleType) {
            const error = new Error('type is required and must be weekly or monthly');
            error.status = 400;
            throw error;
        }

        const scheduleDay = this._validateScheduleDay(data.day, scheduleType);
        const reportEmail = this._normalizeEmail(data.email);
        if (!reportEmail) {
            const error = new Error('email is required and must be a valid email');
            error.status = 400;
            throw error;
        }

        const reportName = this._normalizeReportNameForStorage(data.name);

        const existingSchedule = await ReportSchedule.findOne({
            where: { user_id: userId },
            order: [['id', 'DESC']]
        });

        if (!existingSchedule) {
            const createdSchedule = await ReportSchedule.create({
                user_id: userId,
                type: scheduleType,
                day: scheduleDay,
                name: reportName,
                email: reportEmail
            });

            return { schedule: this._formatScheduleForResponse(createdSchedule), created: true };
        }

        existingSchedule.type = scheduleType;
        existingSchedule.day = scheduleDay;
        existingSchedule.name = reportName;
        existingSchedule.email = reportEmail;
        await existingSchedule.save();

        return { schedule: this._formatScheduleForResponse(existingSchedule), created: false };
    }

    _normalizeScheduleType(value) {
        if (typeof value !== 'string') return null;

        const normalized = value.trim().toLowerCase();
        if (normalized === REPORT_SCHEDULE_TYPE.weekly || normalized === 'week' || normalized === 'tuan') {
            return REPORT_SCHEDULE_TYPE.weekly;
        }
        if (normalized === REPORT_SCHEDULE_TYPE.monthly || normalized === 'month' || normalized === 'thang') {
            return REPORT_SCHEDULE_TYPE.monthly;
        }

        return null;
    }

    _validateScheduleDay(value, scheduleType) {
        const day = Number(value);
        if (!Number.isInteger(day)) {
            const error = new Error('day must be an integer');
            error.status = 400;
            throw error;
        }

        if (scheduleType === REPORT_SCHEDULE_TYPE.monthly && (day < 1 || day > 31)) {
            const error = new Error('day must be from 1 to 31 for monthly schedule');
            error.status = 400;
            throw error;
        }

        if (scheduleType === REPORT_SCHEDULE_TYPE.weekly && (day < 2 || day > 8)) {
            const error = new Error('day must be from 2 to 8 for weekly schedule (2=Monday, 8=Sunday)');
            error.status = 400;
            throw error;
        }

        return day;
    }

    _normalizeOptionalText(value) {
        if (value === null || value === undefined) return null;
        if (typeof value !== 'string') {
            const error = new Error('name must be a string or null');
            error.status = 400;
            throw error;
        }

        const trimmed = value.trim();
        return trimmed.length ? trimmed : null;
    }

    _normalizeReportNameForStorage(value) {
        const normalized = this._normalizeOptionalText(value);
        if (normalized === null) return null;

        const tokens = normalized
            .split(',')
            .map(item => item.trim().toLowerCase())
            .filter(Boolean)
            .map(item => REPORT_NAME_INPUT_MAP[item]);

        if (!tokens.length || tokens.some(item => !item)) {
            const error = new Error('name must contain only: Thời tiết, Cảnh báo, Sự cố');
            error.status = 400;
            throw error;
        }

        const uniqueTokens = Array.from(new Set(tokens));
        const orderedTokens = REPORT_NAME_STORAGE_ORDER.filter(item => uniqueTokens.includes(item));

        return orderedTokens.join(', ');
    }

    _formatScheduleForResponse(schedule) {
        const raw = typeof schedule.get === 'function' ? schedule.get({ plain: true }) : schedule;
        const formattedName = this._formatReportNameForResponse(raw.name);
        return {
            ...raw,
            name: formattedName
        };
    }

    _formatReportNameForResponse(value) {
        const normalized = this._normalizeOptionalText(value);
        if (normalized === null) return null;

        const tokens = normalized
            .split(',')
            .map(item => item.trim().toLowerCase())
            .filter(Boolean);

        const translated = REPORT_NAME_STORAGE_ORDER
            .filter(item => tokens.includes(item))
            .map(item => REPORT_NAME_OUTPUT_MAP[item]);

        if (!translated.length) {
            return normalized;
        }

        return translated.join(', ');
    }

    _normalizeEmail(value) {
        if (typeof value !== 'string') return null;

        const trimmed = value.trim().toLowerCase();
        if (!trimmed.length) return null;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(trimmed) ? trimmed : null;
    }
}

module.exports = new UserService();
