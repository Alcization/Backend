const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Role Model - Quản lý các vai trò trong hệ thống
 * Theo kiến trúc từ: https://www.corbado.com/blog/nodejs-express-postgresql-jwt-authentication-roles
 */
const Role = sequelize.define('Role', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
            isIn: [['user', 'admin', 'moderator']]
        }
    }
}, {
    tableName: 'roles',
    timestamps: false
});

module.exports = Role;
