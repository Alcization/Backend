const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Role = require('./role.model');

/**
 * User Models - Kiến trúc JWT Authentication với Role-Based Access Control
 * Theo: https://www.corbado.com/blog/nodejs-express-postgresql-jwt-authentication-roles
 */

// 1. Bảng cha: UserAccount
const UserAccount = sequelize.define('UserAccount', {
    user_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { 
        type: DataTypes.STRING, 
        allowNull: false, 
        unique: true,
        validate: {
            isEmail: true
        }
    },
    username: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    password_hash: { type: DataTypes.STRING, allowNull: false },
    account_type: { 
        type: DataTypes.ENUM('individual', 'business'), 
        allowNull: false,
        defaultValue: 'individual'
    },
    status: { type: DataTypes.STRING, defaultValue: 'active' }
}, { 
    tableName: 'user_account', 
    timestamps: true, 
    createdAt: 'created_at', 
    updatedAt: 'updated_at'
});

// 2. Bảng con: IndividualUser
const IndividualUser = sequelize.define('IndividualUser', {
    individual_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    full_name: { type: DataTypes.STRING }
}, { tableName: 'individual_user', timestamps: false });

// 3. Bảng con: BusinessUser
const BusinessUser = sequelize.define('BusinessUser', {
    business_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    company_name: { type: DataTypes.STRING },
    tax_code: { type: DataTypes.STRING }
}, { tableName: 'business_user', timestamps: false });

// Thiết lập quan hệ 1-1
UserAccount.hasOne(IndividualUser, { foreignKey: 'user_id' });
IndividualUser.belongsTo(UserAccount, { foreignKey: 'user_id' });

UserAccount.hasOne(BusinessUser, { foreignKey: 'user_id' });
BusinessUser.belongsTo(UserAccount, { foreignKey: 'user_id' });

// Quan hệ Many-to-Many: User <-> Role (qua bảng user_roles)
UserAccount.belongsToMany(Role, { 
    through: 'user_roles',
    foreignKey: 'user_id',
    otherKey: 'role_id',
    as: 'roles'
});
Role.belongsToMany(UserAccount, { 
    through: 'user_roles',
    foreignKey: 'role_id',
    otherKey: 'user_id',
    as: 'users'
});

module.exports = { UserAccount, IndividualUser, BusinessUser };