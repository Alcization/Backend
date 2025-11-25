const sequelize = require('../config/database');

// Import models so they are registered with sequelize
const userModels = require('./user.model');
const predictionModels = require('./prediction.model');

// Optionally expose models and sequelize instance
module.exports = {
  sequelize,
  ...userModels,
  ...predictionModels
};
