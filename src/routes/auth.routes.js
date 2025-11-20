const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/auth.controller');


router.post('/register', authCtrl.register);
router.post('/login', authCtrl.login);
router.post('/login/google', authCtrl.loginGoogle);
router.post('/verify-otp', authCtrl.verifyOtp);


module.exports = router;