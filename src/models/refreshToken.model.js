const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { UserAccount } = require('./user.model');

const RefreshToken = sequelize.define('RefreshToken', {
    token_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'user_account', key: 'user_id' } },
    token: { type: DataTypes.TEXT, allowNull: false, unique: true },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'refresh_token', timestamps: false });

// Association
UserAccount.hasMany(RefreshToken, { foreignKey: 'user_id', onDelete: 'CASCADE' });
RefreshToken.belongsTo(UserAccount, { foreignKey: 'user_id' });

module.exports = RefreshToken;
