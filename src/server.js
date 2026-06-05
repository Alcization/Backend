const http = require('http');
const app = require('./app');
const sequelize = require('./config/database');
const initializeRoles = require('./config/initial-roles');
const notificationSocket = require('./sockets/notification.socket');
const alertWorker = require('./jobs/alert.worker');

const PORT = process.env.PORT || 3000;
const ALLOW_START_WITHOUT_DB = process.env.ALLOW_START_WITHOUT_DB === 'true';
const remoteDatabaseUrl = process.env.EXTERNAL_DATABASE_URL || process.env.DATABASE_URL;

app.locals.dbReady = false;

const getDatabaseTarget = () => {
	if (remoteDatabaseUrl) {
		try {
			const parsed = new URL(remoteDatabaseUrl);
			return `remote (${parsed.hostname}:${parsed.port || '5432'}${parsed.pathname})`;
		} catch (error) {
			return 'remote (from EXTERNAL_DATABASE_URL/DATABASE_URL)';
		}
	}

	const host = process.env.DB_HOST || 'localhost';
	const port = process.env.DB_PORT || '4567';
	const name = process.env.DB_NAME || 'unknown_db';

	return `local (${host}:${port}/${name})`;
};

const startHttpServer = () => {
	const httpServer = http.createServer(app);

	try {
		notificationSocket.attach(httpServer);
		console.log('✓ Notification WebSocket attached at /ws/notifications');
	} catch (err) {
		console.warn('⚠ Could not attach notification WebSocket:', err.message);
	}

	httpServer.listen(PORT, () => {
		console.log(`✓ Server running on port ${PORT}`);
		console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
		if (ALLOW_START_WITHOUT_DB) {
			console.log('✓ ALLOW_START_WITHOUT_DB is enabled. Service can run in degraded mode when DB is unavailable.');
		}
	});

	if (app.locals.dbReady && process.env.ALERT_WORKER_ENABLED !== 'false') {
		alertWorker.start();
	}
};

/**
 * Khởi động server với JWT Authentication & Role-Based Access Control
 * Theo: https://www.corbado.com/blog/nodejs-express-postgresql-jwt-authentication-roles
 */

// Kiểm tra kết nối DB và khởi tạo roles trước khi start server
console.log(`✓ Database target: ${getDatabaseTarget()}`);

sequelize.authenticate()
	.then(async () => {
		console.log(`✓ Database connected successfully (${getDatabaseTarget()}).`);
		app.locals.dbReady = true;

		// Sync database models
		if (process.env.NODE_ENV !== 'production') {
			await sequelize.sync();
			console.log('✓ Database models synced (dev mode).');
		}

		// Khởi tạo roles trong database
		try {
			await initializeRoles();
		} catch (error) {
			console.warn('Warning: Could not initialize roles. They may already exist.', error.message);
		}

		startHttpServer();
	})
	.catch(err => {
		app.locals.dbReady = false;
		console.error('✗ Unable to connect to the database:', err.message);

		if (ALLOW_START_WITHOUT_DB) {
			console.warn('⚠ Starting server without database connection (degraded mode).');
			startHttpServer();
			return;
		}

		process.exit(1);
	});