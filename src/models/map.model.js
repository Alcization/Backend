const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Route Segment - represents road segments
const RouteSegment = sequelize.define('RouteSegment', {
    segment_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    saved_route_id: { type: DataTypes.INTEGER, allowNull: true },
    start_point: { type: DataTypes.GEOMETRY('POINT') },
    end_point: { type: DataTypes.GEOMETRY('POINT') },
    coordinate: { type: DataTypes.GEOMETRY('LINESTRING') }, // Path of the segment
    order_in_route: { type: DataTypes.INTEGER }
}, { tableName: 'route_segment', timestamps: false });

// Traffic Reading - real-time traffic data for segments
const TrafficReading = sequelize.define('TrafficReading', {
    reading_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    segment_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'route_segment', key: 'segment_id' } },
    velocity: { type: DataTypes.FLOAT },
    traffic_state: { type: DataTypes.STRING(50) }, // LOS: A, B, C, D, E, F
    time_reading: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'traffic_reading', timestamps: false });

// Weather Area - geographical weather zones
const WeatherArea = sequelize.define('WeatherArea', {
    area_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    center_point: { type: DataTypes.GEOMETRY('POINT') },
    name: { type: DataTypes.STRING(255) }
}, { tableName: 'weather_area', timestamps: false });

// Time Slot - time-based weather data slots
const TimeSlot = sequelize.define('TimeSlot', {
    timeslot_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    area_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'weather_area', key: 'area_id' } },
    time_value: { type: DataTypes.DATE, allowNull: false }
}, { tableName: 'time_slot', timestamps: false });

// Weather Reading - actual weather measurements
const WeatherReading = sequelize.define('WeatherReading', {
    reading_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    timeslot_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'time_slot', key: 'timeslot_id' } },
    temp: { type: DataTypes.FLOAT },
    feelslike: { type: DataTypes.FLOAT },
    humidity: { type: DataTypes.FLOAT },
    precip: { type: DataTypes.FLOAT },
    precipprob: { type: DataTypes.FLOAT },
    preciptype: { type: DataTypes.STRING(100) },
    windgust: { type: DataTypes.FLOAT },
    windspeed: { type: DataTypes.FLOAT },
    winddir: { type: DataTypes.FLOAT },
    cloudcover: { type: DataTypes.FLOAT },
    visibility: { type: DataTypes.FLOAT },
    uvindex: { type: DataTypes.FLOAT },
    conditions: { type: DataTypes.STRING(255) },
    icon: { type: DataTypes.STRING(100) }
}, { tableName: 'weather_reading', timestamps: false });

// Alert Event - incidents like floods, accidents
const AlertEvent = sequelize.define('AlertEvent', {
    alert_event_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    policy_id: { type: DataTypes.INTEGER },
    name: { type: DataTypes.STRING(255) },
    type: { type: DataTypes.STRING(50) }, // 'Flood', 'Accident', 'Traffic Jam'
    description: { type: DataTypes.TEXT },
    location: { type: DataTypes.GEOMETRY('POINT') }, // Added for incident location
    severity: { type: DataTypes.STRING(50) }, // 'Low', 'Medium', 'High', 'Critical'
    issue_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    resolved_at: { type: DataTypes.DATE }
}, { tableName: 'alert_event', timestamps: false });

// Associations
RouteSegment.hasMany(TrafficReading, { foreignKey: 'segment_id', onDelete: 'CASCADE' });
TrafficReading.belongsTo(RouteSegment, { foreignKey: 'segment_id' });

WeatherArea.hasMany(TimeSlot, { foreignKey: 'area_id', onDelete: 'CASCADE' });
TimeSlot.belongsTo(WeatherArea, { foreignKey: 'area_id' });

TimeSlot.hasMany(WeatherReading, { foreignKey: 'timeslot_id', onDelete: 'CASCADE' });
WeatherReading.belongsTo(TimeSlot, { foreignKey: 'timeslot_id' });

module.exports = {
    RouteSegment,
    TrafficReading,
    WeatherArea,
    TimeSlot,
    WeatherReading,
    AlertEvent
};
