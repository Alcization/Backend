const sequelize = require('../config/database');

// Import models so they are registered with sequelize
const userModels = require('./user.model');
const predictionModels = require('./prediction.model');
const RefreshToken = require('./refreshToken.model');
const notificationModels = require('./notification.model');
const mapModels = require('./map.model');
const businessModels = require('./business.model');
const adminModels = require('./admin.model');
const routeModels = require('./route.model');
const scenarioModels = require('./scenario.model');
const Otp = require('./otp.model');
const reportScheduleModels = require('./reportSchedule.model');

// Optionally expose models and sequelize instance
module.exports = {
  sequelize,
  ...userModels,
  ...predictionModels,
  RefreshToken,
  ...notificationModels,
  ...mapModels,
  ...businessModels,
  ...adminModels,
  ...routeModels,
  ...scenarioModels,
  Otp,
  ...reportScheduleModels
};
