const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
// const asyncError = require('./middlewares/async_error')
const errorHandler = require('./middlewares/error_handler');
require('express-async-errors');

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
app.use('/api/v1/wallet', require('./routes/wallet.route'));
app.use('/api/v1/ride', require('./routes/ride.route'));
app.use('/api/v1/rider', require('./routes/rider.route'));

// Error handler middleware
app.use(errorHandler);
app.use((req, res, next) => {
    res.status(404).json({
        status: 'fail',
        message: `Can't find ${req.originalUrl} on this server!`,
    });
});

const http = require('http').createServer(app);
const socketIO = require('socket.io');
const io = socketIO(http);
const socketWrapper = require('./ws/middlewares/wrapper')
const authenticate = require('./ws/middlewares/auth')

const onConnection = (socket) => {
    authenticate(socket);
    console.log('Socket connected');

    socket.on('disconnect', () => {
        console.log('Socket disconnected');
    });

    socket.on('error', (error) => {
        // Send error to client
        console.log(error);

        // Close connection
        socket.disconnect();
    });
};

// Use cors
io.use(socketWrapper((socket, next) => {
    console.log('lajsdlfjsdf')
    const { origin } = socket.handshake.headers;

    if (origin === 'http://localhost:3000') {
        next();
    } else {
        next(new Error('Not allowed by CORS'));
    }
}));

io.on('connection', socketWrapper(onConnection));
io.on('error', socketWrapper((error) => {
    // Send error to client
    console.log(error);

    // Close connection
    io.close();
}));

module.exports = app;
