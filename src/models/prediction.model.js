const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { UserAccount } = require('./user.model'); // Link tới user

// Saved Route
const SavedRoute = sequelize.define('SavedRoute', {
    route_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING },
    start_point: { type: DataTypes.GEOMETRY('POINT') }, // Yêu cầu PostGIS hoặc xử lý dạng String
    end_point: { type: DataTypes.GEOMETRY('POINT') },
    waypoints: { type: DataTypes.TEXT } // Lưu JSON string tọa độ
}, { tableName: 'saved_route', timestamps: false });

// Risk Assessment
const RiskAssessment = sequelize.define('RiskAssessment', {
    assessment_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    risk_level: { type: DataTypes.STRING }, // Low, High...
    suggest_action: { type: DataTypes.TEXT },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'risk_assessment', timestamps: false });

// Quan hệ
UserAccount.hasMany(SavedRoute, { foreignKey: 'user_id' });
SavedRoute.belongsTo(UserAccount, { foreignKey: 'user_id' });

module.exports = { SavedRoute, RiskAssessment };