const app = require('./app');
const sequelize = require('./config/database');

const PORT = process.env.PORT || 3000;

// Kiểm tra kết nối DB trước khi start server
sequelize.authenticate()
    .then(() => {
        console.log('Database connected...');
        // sequelize.sync({ alter: true }); // Chỉ bật khi dev để auto tạo bảng
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });