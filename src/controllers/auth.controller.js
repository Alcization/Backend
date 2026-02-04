const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/auth.service');

/**
 * Authentication Controller - Xử lý các request liên quan đến authentication
 * Theo: https://www.corbado.com/blog/nodejs-express-postgresql-jwt-authentication-roles
 */

/**
 * Đăng ký người dùng mới
 * POST /api/auth/signup
 */
exports.signup = asyncHandler(async (req, res) => {
    const user = await authService.register(req.body);
    
    res.status(201).json({
        message: 'User registered successfully!',
        user: {
            id: user.user_id,
            email: user.email,
            username: user.username
        }
    });
});

/**
 * Đăng nhập (với email hoặc username)
 * POST /api/auth/signin
 */
exports.signin = asyncHandler(async (req, res) => {
    const { emailOrUsername, password } = req.body;
    const result = await authService.login(emailOrUsername, password);
    
    res.status(200).json(result);
});

/**
 * Đăng nhập qua Google OAuth
 * POST /api/auth/google
 */
exports.loginGoogle = asyncHandler(async (req, res) => {
    const { idToken } = req.body;
    const result = await authService.loginGoogle(idToken);
    
    res.status(200).json(result);
});

/**
 * Đăng xuất
 * POST /api/auth/logout
 */
exports.logout = asyncHandler(async (req, res) => {
    // userId từ verifyToken middleware
    const result = await authService.logout(req.userId);
    
    res.status(200).json(result);
});

/**
 * Làm mới access token
 * POST /api/auth/refresh-token
 */
exports.refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    
    res.status(200).json(result);
});

// Giữ lại verifyOtp nếu cần
exports.verifyOtp = asyncHandler(async (req, res) => {
    const ok = await authService.verifyOtp(req.body);
    res.json({ ok });
});