const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');
const errorHandler = require('./middleware/error.handler');
require('./models/index'); // Init models & associations

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Deployment health checks (không phụ thuộc DB để test tình trạng deploy)
app.get('/healthz', (req, res) => {
	res.status(200).json({
		status: 'ok',
		uptime: process.uptime(),
		timestamp: new Date().toISOString()
	});
});

app.get('/readyz', (req, res) => {
	const isDbReady = Boolean(req.app.locals.dbReady);
	res.status(isDbReady ? 200 : 503).json({
		status: isDbReady ? 'ready' : 'degraded',
		database: isDbReady ? 'connected' : 'disconnected',
		timestamp: new Date().toISOString()
	});
});

// Routes chính
app.use('/api', routes);

// Xử lý lỗi tập trung
app.use(errorHandler);

module.exports = app;