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

// Routes chính
app.use('/api', routes);

// Xử lý lỗi tập trung
app.use(errorHandler);

module.exports = app;