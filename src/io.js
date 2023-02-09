const socketWrapper = require('./ws/middlewares/wrapper');
const authenticate = require('./ws/middlewares/auth');
const { createServer } = require('http');
const { Server } = require('socket.io');
const app  = require("./app");

const onConnection = async (socket) => {
    await authenticate(socket);
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

// Create http server with express app
const httpServer = createServer(app);

// Create socket server with http server
const io = new Server(httpServer, {
    cors: {
        origin: 'http://localhost:3000',
    }
});

io.use(socketWrapper((socket, next) => {
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

module.exports = httpServer;
