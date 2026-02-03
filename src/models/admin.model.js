const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { UserAccount } = require('./user.model');

// Administrative Officer
const AdministrativeOfficer = sequelize.define('AdministrativeOfficer', {
    officer_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, unique: true, allowNull: false, references: { model: 'user_account', key: 'user_id' } },
    department: { type: DataTypes.STRING(255) }
}, { tableName: 'administrative_officer', timestamps: false });

// Admin Area - geographical areas managed by officers
const AdminArea = sequelize.define('AdminArea', {
    area_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    officer_id: { type: DataTypes.INTEGER, references: { model: 'administrative_officer', key: 'officer_id' } },
    name: { type: DataTypes.STRING(255) },
    area_type: { type: DataTypes.STRING(50) },
    boundary_polygon: { type: DataTypes.TEXT } // GeoJSON or Polygon data
}, { tableName: 'admin_area', timestamps: false });

// Response Scenario - emergency response plans
const ResponseScenario = sequelize.define('ResponseScenario', {
    scenario_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    area_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'admin_area', key: 'area_id' } },
    name: { type: DataTypes.STRING(255) },
    applicable_event_type: { type: DataTypes.STRING(100) } // Flood, Traffic Jam, Accident
}, { tableName: 'response_scenario', timestamps: false });

// Checklist Item - action items in scenarios
const ChecklistItem = sequelize.define('ChecklistItem', {
    item_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    scenario_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'response_scenario', key: 'scenario_id' } },
    name: { type: DataTypes.STRING(255) },
    description: { type: DataTypes.TEXT },
    item_order: { type: DataTypes.INTEGER }
}, { tableName: 'checklist_item', timestamps: false });

// Associations
UserAccount.hasOne(AdministrativeOfficer, { foreignKey: 'user_id', onDelete: 'CASCADE' });
AdministrativeOfficer.belongsTo(UserAccount, { foreignKey: 'user_id' });

AdministrativeOfficer.hasMany(AdminArea, { foreignKey: 'officer_id', onDelete: 'SET NULL' });
AdminArea.belongsTo(AdministrativeOfficer, { foreignKey: 'officer_id' });

AdminArea.hasMany(ResponseScenario, { foreignKey: 'area_id', onDelete: 'CASCADE' });
ResponseScenario.belongsTo(AdminArea, { foreignKey: 'area_id' });

ResponseScenario.hasMany(ChecklistItem, { foreignKey: 'scenario_id', onDelete: 'CASCADE' });
ChecklistItem.belongsTo(ResponseScenario, { foreignKey: 'scenario_id' });

module.exports = {
    AdministrativeOfficer,
    AdminArea,
    ResponseScenario,
    ChecklistItem
};
