const app = require('./app');
const sequelize = require('./config/database');
const initializeRoles = require('./config/initial-roles');

const PORT = process.env.PORT || 3000;

/**
 * Khởi động server với JWT Authentication & Role-Based Access Control
 * Theo: https://www.corbado.com/blog/nodejs-express-postgresql-jwt-authentication-roles
 */

// Kiểm tra kết nối DB và khởi tạo roles trước khi start server
sequelize.authenticate()
    .then(async () => {
        console.log('✓ Database connected successfully.');
        
        // Sync database models
        // await sequelize.sync({ alter: true }); // Chỉ bật khi dev để auto tạo/cập nhật bảng
        
        // Khởi tạo roles trong database
        try {
            await initializeRoles();
        } catch (error) {
            console.warn('Warning: Could not initialize roles. They may already exist.', error.message);
        }
        
        // Start server
        app.listen(PORT, () => {
            console.log(`✓ Server running on port ${PORT}`);
            console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    })
    .catch(err => {
        console.error('✗ Unable to connect to the database:', err);
        process.exit(1);
    });