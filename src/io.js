const socketWrapper = require('./ws/middlewares/wrapper');
const authenticate = require('./ws/middlewares/auth');
const { createServer } = require('http');
const { Server } = require('socket.io');
const app = require("./app");

const initializeSocketListeners = (socket) => {
    // console.log(socket.user)
    // Initialize socket listeners
    require('./ws/event-handlers/location.events')(io, socket);

    socket.on('message', (message) => {
        console.log(message);
    });

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

const onConnection = async (socket) => {
    const authenticated_socket = await authenticate(socket);

    if (authenticated_socket instanceof Error) {
        // Send error to client
        socket.emit('error', 'Authentication failed');

        // Close connection
        socket.disconnect();

        throw new Error('Authentication failed');
    }

    socket = authenticated_socket;
    console.log(`${socket.id}: connected`);

    // Initialize socket listeners
    initializeSocketListeners(socket);
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

    const allowed_origins = ['http://localhost:3000', 'http://localhost:3001'];
    if (allowed_origins.includes(origin)) {
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
