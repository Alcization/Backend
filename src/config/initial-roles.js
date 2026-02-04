const Role = require('../models/role.model');
const sequelize = require('../config/database');

/**
 * Script khởi tạo roles trong database
 * Theo: https://www.corbado.com/blog/nodejs-express-postgresql-jwt-authentication-roles
 */

const ROLES = ['user', 'admin', 'moderator'];

async function initializeRoles() {
    try {
        // Sync Role model (tạo bảng nếu chưa có)
        await Role.sync();
        console.log('Role table synced.');

        // Tạo hoặc tìm các roles
        for (const roleName of ROLES) {
            const [role, created] = await Role.findOrCreate({
                where: { name: roleName },
                defaults: { name: roleName }
            });

            if (created) {
                console.log(`✓ Role '${roleName}' created.`);
            } else {
                console.log(`✓ Role '${roleName}' already exists.`);
            }
        }

        console.log('\n✓ All roles initialized successfully!');
    } catch (error) {
        console.error('Error initializing roles:', error);
        throw error;
    }
}

// Chỉ chạy nếu file được gọi trực tiếp (không phải import)
if (require.main === module) {
    sequelize.authenticate()
        .then(async () => {
            console.log('Database connected successfully.');
            await initializeRoles();
            process.exit(0);
        })
        .catch(err => {
            console.error('Database connection error:', err);
            process.exit(1);
        });
}

module.exports = initializeRoles;
