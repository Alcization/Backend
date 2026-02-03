const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { UserAccount } = require('./user.model');

// Notification Preference
const NotificationPreference = sequelize.define('NotificationPreference', {
    pref_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'user_account', key: 'user_id' } },
    noti_type: { type: DataTypes.STRING(50) }, // 'Traffic', 'Flood', 'System'
    threshold: { type: DataTypes.INTEGER }, // Mức độ kích hoạt
    issue_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'notification_preference', timestamps: false });

// Notification Event
const NotificationEvent = sequelize.define('NotificationEvent', {
    noti_event_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'user_account', key: 'user_id' } },
    name: { type: DataTypes.STRING(255) },
    description: { type: DataTypes.TEXT },
    type: { type: DataTypes.STRING(50) },
    issue_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    is_read: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { tableName: 'noti_event', timestamps: false });

// Associations
UserAccount.hasMany(NotificationPreference, { foreignKey: 'user_id', onDelete: 'CASCADE' });
NotificationPreference.belongsTo(UserAccount, { foreignKey: 'user_id' });

UserAccount.hasMany(NotificationEvent, { foreignKey: 'user_id', onDelete: 'CASCADE' });
NotificationEvent.belongsTo(UserAccount, { foreignKey: 'user_id' });

module.exports = { NotificationPreference, NotificationEvent };
