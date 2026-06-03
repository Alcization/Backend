const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { UserAccount } = require('./user.model');
const { SavedLocation } = require('./route.model');

// Threshold rule attach to a favorite location.
const LocationAlertRule = sequelize.define('LocationAlertRule', {
	rule_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
	user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'user_account', key: 'user_id' } },
	location_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'saved_location', key: 'location_id' } },
	metric: {
		type: DataTypes.ENUM('temp', 'feelslike', 'precip', 'precipprob'),
		allowNull: false
	},
	operator: {
		type: DataTypes.ENUM('>', '>=', '<', '<='),
		allowNull: false
	},
	threshold: { type: DataTypes.FLOAT, allowNull: false },
	unit: { type: DataTypes.STRING(10) },
	scope: {
		type: DataTypes.ENUM('current', 'forecast_24h'),
		allowNull: false,
		defaultValue: 'current'
	},
	severity: {
		type: DataTypes.ENUM('info', 'warning', 'critical'),
		allowNull: false,
		defaultValue: 'warning'
	},
	cooldown_minutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 60 },
	is_enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
	last_triggered_at: { type: DataTypes.DATE },
	last_value: { type: DataTypes.FLOAT },
	created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'location_alert_rule', timestamps: false });

const PushSubscription = sequelize.define('PushSubscription', {
	sub_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
	user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'user_account', key: 'user_id' } },
	endpoint: { type: DataTypes.TEXT, allowNull: false, unique: true },
	p256dh: { type: DataTypes.TEXT, allowNull: false },
	auth: { type: DataTypes.TEXT, allowNull: false },
	user_agent: { type: DataTypes.STRING(500) },
	created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'push_subscription', timestamps: false });

UserAccount.hasMany(LocationAlertRule, { foreignKey: 'user_id', onDelete: 'CASCADE' });
LocationAlertRule.belongsTo(UserAccount, { foreignKey: 'user_id' });

SavedLocation.hasMany(LocationAlertRule, { foreignKey: 'location_id', onDelete: 'CASCADE' });
LocationAlertRule.belongsTo(SavedLocation, { foreignKey: 'location_id' });

UserAccount.hasMany(PushSubscription, { foreignKey: 'user_id', onDelete: 'CASCADE' });
PushSubscription.belongsTo(UserAccount, { foreignKey: 'user_id' });

module.exports = { LocationAlertRule, PushSubscription };
