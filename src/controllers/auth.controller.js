const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/auth.service');


exports.register = asyncHandler(async (req, res) => {
const user = await authService.register(req.body);
res.status(201).json(user);
});


exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, token, refreshToken } = await authService.login(email, password);
  res.json({ user, token, refreshToken });
});
exports.loginGoogle = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  const { user, token, refreshToken } = await authService.loginGoogle(idToken);
  res.json({ user, token, refreshToken });
});
exports.verifyOtp = asyncHandler(async (req, res) => {
const ok = await authService.verifyOtp(req.body);
res.json({ ok });
});

exports.refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const { token } = await authService.refreshToken(refreshToken);
  res.json({ token });
});