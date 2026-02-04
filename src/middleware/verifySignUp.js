const { UserAccount } = require('../models/user.model');
const Role = require('../models/role.model');

/**
 * Middleware xác thực đăng ký người dùng
 * Kiểm tra username, email trùng lặp và roles hợp lệ
 * Theo: https://www.corbado.com/blog/nodejs-express-postgresql-jwt-authentication-roles
 */

const ROLES = ['user', 'admin', 'moderator'];

/**
 * Kiểm tra username hoặc email đã tồn tại
 */
const checkDuplicateUsernameOrEmail = async (req, res, next) => {
    try {
        // Kiểm tra username (nếu có)
        if (req.body.username) {
            const userByUsername = await UserAccount.findOne({
                where: { username: req.body.username }
            });
            if (userByUsername) {
                return res.status(400).json({
                    message: 'Failed! Username is already in use!'
                });
            }
        }

        // Kiểm tra email
        const userByEmail = await UserAccount.findOne({
            where: { email: req.body.email }
        });
        if (userByEmail) {
            return res.status(400).json({
                message: 'Failed! Email is already in use!'
            });
        }

        next();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Kiểm tra roles có tồn tại trong hệ thống
 */
const checkRolesExisted = (req, res, next) => {
    if (req.body.roles) {
        for (const role of req.body.roles) {
            if (!ROLES.includes(role)) {
                return res.status(400).json({
                    message: `Failed! Role does not exist: ${role}`
                });
            }
        }
    }
    next();
};

const verifySignUp = {
    checkDuplicateUsernameOrEmail,
    checkRolesExisted
};

module.exports = verifySignUp;
