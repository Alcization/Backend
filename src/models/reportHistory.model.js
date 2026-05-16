const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { UserAccount } = require('./user.model');

const ReportHistory = sequelize.define('ReportHistory', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'user_account', key: 'user_id' }
    },
    name: { type: DataTypes.STRING, allowNull: true },
    time: { type: DataTypes.DATE, allowNull: false },
    link: { type: DataTypes.TEXT, allowNull: true }
}, { tableName: 'report_history', timestamps: false });

UserAccount.hasMany(ReportHistory, { foreignKey: 'user_id', onDelete: 'CASCADE' });
ReportHistory.belongsTo(UserAccount, { foreignKey: 'user_id' });

module.exports = { ReportHistory };