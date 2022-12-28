const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
// const asyncError = require('./middlewares/async_error')
const errorHandler = require('./middlewares/error_handler');
require('express-async-errors')

const app = express();

// Middlewares
if (process.env.NODE_ENV == 'dev') {
    app.use(morgan('dev'));
}


// app.use(asyncError());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/auth', require('./routes/auth.route'));
app.use('/api/v1/user', require('./routes/user.route'));
app.use('/api/v1/vehicle', require('./routes/vehicle.route'));
app.use('/api/v1/bankaccount', require('./routes/bankaccount.route'));
app.use('/api/v1/card', require('./routes/card.route'));

// Error handler middleware
app.use(errorHandler);
app.use((req, res, next) => {
    res.status(404).json({
        status: 'fail',
        message: `Can't find ${req.originalUrl} on this server!`,
    });
});

module.exports = app;
