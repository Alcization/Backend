const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { UserAccount } = require('./user.model');

const ReportSchedule = sequelize.define('ReportSchedule', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'user_account', key: 'user_id' }
    },
    type: { type: DataTypes.STRING(20), allowNull: false },
    day: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.TEXT, allowNull: true },
    email: { type: DataTypes.STRING(255), allowNull: false }
}, { tableName: 'report_schedule', timestamps: false });

UserAccount.hasMany(ReportSchedule, { foreignKey: 'user_id', onDelete: 'CASCADE' });
ReportSchedule.belongsTo(UserAccount, { foreignKey: 'user_id' });

module.exports = { ReportSchedule };