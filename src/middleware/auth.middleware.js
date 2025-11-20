const jwt = require('jsonwebtoken');
const config = require('../config/config');


module.exports = function (req, res, next) {
const auth = req.headers.authorization;
if (!auth) return res.status(401).json({ message: 'Unauthorized' });
const token = auth.split(' ')[1];
try {
req.user = jwt.verify(token, config.jwtSecret);
next();
} catch (e) { return res.status(401).json({ message: 'Invalid token' }); }
};