const WebSocketServer = require('ws');
const app = require('./app');
const PORT = process.env.PORT;
const config = require('./utils/config');
const jwt = require('jsonwebtoken');
require('express-async-errors')

const express_server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const wss = new WebSocketServer.Server({ server: express_server, path: '/ws' });

// const wsVehicle = require('./ws/vehicle.ws');
async function authenticate(socket, request) {
    try {
        const token = request.headers['sec-websocket-protocol'];
        return await jwt.verify(
            token,
            config.JWT_ACCESS_SECRET,
            (error, decoded) => {
                if (error) {
                    return error;
                } else {
                    socket.user = decoded;
                    return socket;
                }
            }
        );
    } catch (error) {
        console.log(error);
        return error;
    }
}

const wsClients = [];
function removeClient(connection) {
    const index = wsClients.indexOf(connection);
    if (index > -1) {
        wsClients.splice(index, 1);
    }
}

function parseData(data) {
    try {
        return JSON.parse(data);
    } catch (error) {
        if (error instanceof SyntaxError) {
            return data;
        }
        return error;
    }
}

const { VehicleSockets } = require('./ws/vehicle.ws');

wss.on('connection', async (ws, request) => {
    try {
        let res = await authenticate(ws, request);
        if (res instanceof Error) {
            ws.send('Authentication failed');
            ws.close();

            return;
        } else {
            ws = res;
        }

        const vs =  new VehicleSockets(ws, wss)
        vs.init()

        ws.send('Connection to server established');

        ws.on('message', (message) => {
            const parsed_message = parseData(message);
            if (typeof parseData == 'string') {
                wss.emmit('error', 'Message is not a valid JSON');
                // Send error to error handler
                return;
            }

            if (parsed_message.event == 'ws:message') {
                wss.emit(parsed_message.event, parsed_message.data);
                return;
            } else {
                ws.emit(parsed_message.event, 'dsfasdf');
                return;
            }
        });

        ws.on('close', () => {
            console.log('Client disconnected');
            removeClient(ws);
        });
    } catch (error) {
        wss.emit('error', error);
    }
});

wss.on('ws:message', (message) => {
    console.log(message);
    // ws.send('Message received');
});

wss.on('error', (error) => {
    console.log('Error occured')
    console.log(error);
});

module.exports = wss;
