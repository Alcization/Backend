const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { UserAccount } = require('./user.model');

const ResponseScenario = sequelize.define('ResponseScenario', {
    scenario_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'user_account', key: 'user_id' } },
    name: { type: DataTypes.STRING(255), allowNull: false },
    applicable_event_type: { type: DataTypes.TEXT, allowNull: false }
}, { tableName: 'response_scenario', timestamps: false });

const ScenarioStep = sequelize.define('ScenarioStep', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    scenario_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'response_scenario', key: 'scenario_id' } },
    step: { type: DataTypes.INTEGER, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    priority: { type: DataTypes.STRING(20), allowNull: false }
}, { tableName: 'scenario_steps', timestamps: false });

UserAccount.hasMany(ResponseScenario, { foreignKey: 'user_id', onDelete: 'CASCADE' });
ResponseScenario.belongsTo(UserAccount, { foreignKey: 'user_id' });

ResponseScenario.hasMany(ScenarioStep, {
    foreignKey: 'scenario_id',
    as: 'steps',
    onDelete: 'CASCADE'
});
ScenarioStep.belongsTo(ResponseScenario, {
    foreignKey: 'scenario_id',
    as: 'scenario'
});

module.exports = {
    ResponseScenario,
    ScenarioStep
};