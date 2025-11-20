require('dotenv').config();


module.exports = {
port: process.env.PORT || 3000,
mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/weatherapp',
jwtSecret: process.env.JWT_SECRET || 'change_me',
redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
};