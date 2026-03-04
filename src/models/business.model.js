const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { BusinessUser } = require('./user.model');

// Alert Policy - business rules for alerts
const AlertPolicy = sequelize.define('AlertPolicy', {
    policy_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    business_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'business_user', key: 'business_id' } },
    name: { type: DataTypes.STRING(255) },
    description: { type: DataTypes.TEXT },
    start_hour: { type: DataTypes.TIME },
    end_hour: { type: DataTypes.TIME },
    week_day: { type: DataTypes.STRING(20) }, // 'Mon,Tue,Wed...'
    status: { type: DataTypes.BOOLEAN, defaultValue: true }
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
BusinessUser.hasMany(AlertPolicy, { foreignKey: 'business_id', onDelete: 'CASCADE' });
AlertPolicy.belongsTo(BusinessUser, { foreignKey: 'business_id' });

AlertPolicy.hasMany(AlertEvent, { foreignKey: 'policy_id', onDelete: 'CASCADE' });
AlertEvent.belongsTo(AlertPolicy, { foreignKey: 'policy_id' });

module.exports = {
    AlertPolicy,
    AlertEvent
};
