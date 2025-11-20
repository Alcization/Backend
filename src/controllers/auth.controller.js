const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/auth.service');


exports.register = asyncHandler(async (req, res) => {
const user = await authService.register(req.body);
res.status(201).json(user);
});


exports.login = asyncHandler(async (req, res) => {
const token = await authService.login(req.body);
res.json({ token });
});


exports.loginGoogle = asyncHandler(async (req, res) => {
const token = await authService.loginGoogle(req.body);
res.json({ token });
});


exports.verifyOtp = asyncHandler(async (req, res) => {
const ok = await authService.verifyOtp(req.body);
res.json({ ok });
});