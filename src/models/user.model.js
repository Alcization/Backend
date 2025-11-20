const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// 1. Bảng cha: UserAccount
const UserAccount = sequelize.define('UserAccount', {
    user_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('individual', 'business', 'admin'), allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'active' }
}, { tableName: 'user_account', timestamps: true, createdAt: 'created_at', updatedAt: false });

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

module.exports = { UserAccount, IndividualUser, BusinessUser };