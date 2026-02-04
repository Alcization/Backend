const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/auth.controller');
const verifySignUp = require('../middleware/verifySignUp');
const authJwt = require('../middleware/auth.middleware');

/**
 * Authentication Routes - JWT với Role-Based Access Control
 * Theo: https://www.corbado.com/blog/nodejs-express-postgresql-jwt-authentication-roles
 */

// Đăng ký - với validation
router.post('/signup', [
    verifySignUp.checkDuplicateUsernameOrEmail,
    verifySignUp.checkRolesExisted
], authCtrl.signup);

// Đăng nhập
router.post('/signin', authCtrl.signin);

// Đăng nhập qua Google OAuth
router.post('/google', authCtrl.loginGoogle);

// Đăng xuất - yêu cầu authentication
router.post('/logout', authJwt.verifyToken, authCtrl.logout);

// Làm mới access token
router.post('/refresh-token', authCtrl.refreshToken);

// Verify OTP (giữ lại nếu cần)
router.post('/verify-otp', authCtrl.verifyOtp);

module.exports = router;