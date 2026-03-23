const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { UserAccount } = require('./user.model');

// Saved Location - user's favorite locations
const SavedLocation = sequelize.define('SavedLocation', {
    location_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'user_account', key: 'user_id' } },
    custom_name: { type: DataTypes.STRING(255) },
    address: { type: DataTypes.TEXT },
    coordinate: { type: DataTypes.GEOMETRY('POINT') },
    latitude: { type: DataTypes.DECIMAL(10, 6) },
    longitude: { type: DataTypes.DECIMAL(10, 6) }
}, { tableName: 'saved_location', timestamps: false });

// Saved Route - user's saved routes
const SavedRoute = sequelize.define('SavedRoute', {
    route_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'user_account', key: 'user_id' } },
    name: { type: DataTypes.STRING(255) },
    start_point: { type: DataTypes.GEOMETRY('POINT') },
    end_point: { type: DataTypes.GEOMETRY('POINT') },
    waypoints: { type: DataTypes.TEXT }, // JSON string of waypoints
    distance: { type: DataTypes.FLOAT }
}, { tableName: 'saved_route', timestamps: false });

// History Trip - user's route search history
const HistoryTrip = sequelize.define('HistoryTrip', {
    trip_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'user_account', key: 'user_id' } },
    origin: { type: DataTypes.STRING(255), allowNull: false },
    destination: { type: DataTypes.STRING(255), allowNull: false },
    time: { type: DataTypes.DATE, allowNull: false },
    weather_status: { type: DataTypes.STRING(255), allowNull: true }
}, { tableName: 'history_trip', timestamps: false });

// History Weather - user's weather search history
const HistoryWeather = sequelize.define('HistoryWeather', {
    location_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'user_account', key: 'user_id' } },
    location: { type: DataTypes.STRING(255), allowNull: false },
    time: { type: DataTypes.DATE, allowNull: false },
    weather_status: { type: DataTypes.STRING(255), allowNull: true },
    temp: { type: DataTypes.INTEGER, allowNull: true }
}, { tableName: 'history_weather', timestamps: false });

// Trip - planned trips
const Trip = sequelize.define('Trip', {
    trip_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'user_account', key: 'user_id' } },
    origin: { type: DataTypes.GEOMETRY('POINT') },
    destination: { type: DataTypes.GEOMETRY('POINT') },
    time_departure: { type: DataTypes.DATE },
    status: { type: DataTypes.STRING(50) } // 'Scheduled', 'Ongoing', 'Completed'
}, { tableName: 'trip', timestamps: false });

// Risk Assessment - trip risk analysis
const RiskAssessment = sequelize.define('RiskAssessment', {
    assessment_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    trip_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'trip', key: 'trip_id' } },
    risk_level: { type: DataTypes.STRING(50) }, // 'Low', 'Medium', 'High', 'Critical'
    suggest_action: { type: DataTypes.TEXT },
    advisor_note: { type: DataTypes.TEXT }
}, { tableName: 'risk_assessment', timestamps: false });

// Associations
UserAccount.hasMany(SavedLocation, { foreignKey: 'user_id', onDelete: 'CASCADE' });
SavedLocation.belongsTo(UserAccount, { foreignKey: 'user_id' });

UserAccount.hasMany(SavedRoute, { foreignKey: 'user_id', onDelete: 'CASCADE' });
SavedRoute.belongsTo(UserAccount, { foreignKey: 'user_id' });

UserAccount.hasMany(HistoryTrip, { foreignKey: 'user_id', onDelete: 'CASCADE' });
HistoryTrip.belongsTo(UserAccount, { foreignKey: 'user_id' });

UserAccount.hasMany(HistoryWeather, { foreignKey: 'user_id', onDelete: 'CASCADE' });
HistoryWeather.belongsTo(UserAccount, { foreignKey: 'user_id' });

UserAccount.hasMany(Trip, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Trip.belongsTo(UserAccount, { foreignKey: 'user_id' });

Trip.hasOne(RiskAssessment, { foreignKey: 'trip_id', onDelete: 'CASCADE' });
RiskAssessment.belongsTo(Trip, { foreignKey: 'trip_id' });

module.exports = {
    SavedLocation,
    SavedRoute,
    HistoryTrip,
    HistoryWeather,
    Trip,
    RiskAssessment
};
