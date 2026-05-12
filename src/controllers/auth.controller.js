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
    const { idToken, code, credential, accessToken } = req.body;

    // Chuẩn hoá payload để service có thể xử lý nhiều luồng (id_token, code, access_token)
    const payload = {
        idToken: idToken || credential || null,
        code: code || null,
        accessToken: accessToken || null
    };

    const result = await authService.loginGoogle(payload);

    res.status(200).json(result);
});

/**
 * Đăng xuất
 * POST /api/auth/logout
 */
exports.logout = asyncHandler(async (req, res) => {
    // userId từ verifyToken middleware
    const result = await authService.logout(req.user.id);
    
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

/**
 * Gửi OTP tới email
 * POST /api/auth/send-otp
 */
exports.sendOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await authService.sendOtp(email);

    res.status(200).json(result);
});

/**
 * Xác nhận OTP
 * POST /api/auth/verify-otp
 */
exports.verifyOtp = asyncHandler(async (req, res) => {
    const { email, code } = req.body;
    const ok = await authService.verifyOtp({ email, code });

    res.status(200).json({
        message: 'OTP verified successfully',
        ok
    });
});

/**
 * Cập nhật mật khẩu mới theo email
 * POST /api/auth/reset-password
 */
exports.resetPassword = asyncHandler(async (req, res) => {
    const { email, newPassword } = req.body;
    const result = await authService.resetPassword({ email, newPassword });

    res.status(200).json(result);
});