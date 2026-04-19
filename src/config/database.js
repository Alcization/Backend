const { Sequelize } = require('sequelize');
require('dotenv').config();

const useSSL = process.env.DB_SSL === 'true';
const remoteDatabaseUrl = process.env.EXTERNAL_DATABASE_URL || process.env.DATABASE_URL;

const baseOptions = {
  dialect: process.env.DB_DIALECT || 'postgres',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  ...(useSSL
    ? {
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        }
      }
    : {})
};

const sequelize = remoteDatabaseUrl
  ? new Sequelize(remoteDatabaseUrl, baseOptions)
  : new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
      ...baseOptions,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 4567
    });

module.exports = sequelize;