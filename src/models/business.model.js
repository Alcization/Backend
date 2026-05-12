const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Alert Policy - user alert rules
const AlertPolicy = sequelize.define('AlertPolicy', {
    policy_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'user_account', key: 'user_id' } },
    start_hour: { type: DataTypes.TIME, allowNull: false },
    end_hour: { type: DataTypes.TIME, allowNull: false },
    id: { type: DataTypes.INTEGER, allowNull: false },
    effect_time: { type: DataTypes.INTEGER, allowNull: true },
    temp_threshold: { type: DataTypes.INTEGER, allowNull: true },
    traffic_threshold: { type: DataTypes.TEXT, allowNull: true }
}, { tableName: 'alert_policy', timestamps: false });

// Alert Event - triggered alerts
const AlertEvent = sequelize.define('AlertEvent', {
    alert_event_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    policy_id: { type: DataTypes.INTEGER, references: { model: 'alert_policy', key: 'policy_id' } },
    name: { type: DataTypes.STRING(255) },
    type: { type: DataTypes.STRING(50) },
    description: { type: DataTypes.TEXT },
    issue_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'alert_event', timestamps: false });

// Associations
AlertPolicy.hasMany(AlertEvent, { foreignKey: 'policy_id', onDelete: 'CASCADE' });
AlertEvent.belongsTo(AlertPolicy, { foreignKey: 'policy_id' });

module.exports = {
    AlertPolicy,
    AlertEvent
};
