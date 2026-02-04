const jwt = require('jsonwebtoken');
const { UserAccount } = require('../models/user.model');

/**
 * Middleware xác thực JWT và phân quyền theo role
 * Theo: https://www.corbado.com/blog/nodejs-express-postgresql-jwt-authentication-roles
 */

/**
 * Xác thực JWT token
 */
const verifyToken = (req, res, next) => {
    // Lấy token từ header x-access-token hoặc Authorization
    let token = req.headers['x-access-token'] || req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ message: 'No token provided!' });
    }

    // Xử lý Bearer token
    if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length);
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Unauthorized!' });
        }
        req.userId = decoded.id;
        next();
    });
};

/**
 * Kiểm tra user có role Admin
 */
const isAdmin = async (req, res, next) => {
    try {
        const user = await UserAccount.findByPk(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found!' });
        }

        const roles = await user.getRoles();
        
        for (const role of roles) {
            if (role.name === 'admin') {
                return next();
            }
        }

        return res.status(403).json({ message: 'Require Admin Role!' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Kiểm tra user có role Moderator
 */
const isModerator = async (req, res, next) => {
    try {
        const user = await UserAccount.findByPk(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found!' });
        }

        const roles = await user.getRoles();
        
        for (const role of roles) {
            if (role.name === 'moderator') {
                return next();
            }
        }

        return res.status(403).json({ message: 'Require Moderator Role!' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Kiểm tra user có role Moderator hoặc Admin
 */
const isModeratorOrAdmin = async (req, res, next) => {
    try {
        const user = await UserAccount.findByPk(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found!' });
        }

        const roles = await user.getRoles();
        
        for (const role of roles) {
            if (role.name === 'moderator' || role.name === 'admin') {
                return next();
            }
        }

        return res.status(403).json({ message: 'Require Moderator or Admin Role!' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const authJwt = {
    verifyToken,
    isAdmin,
    isModerator,
    isModeratorOrAdmin
};

module.exports = authJwt;