const WebSocketServer = require('ws');
const app = require('./app');
const PORT = process.env.PORT;
const config = require('./utils/config');
const jwt = require('jsonwebtoken');

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

const vehicleSocks = require('./ws/vehicle.ws').vehicle

wss.on('connection', async (ws, request) => {
    let res = await authenticate(ws, request);
    if (res instanceof Error) {
        ws.send('Authentication failed');
        ws.close();
        
        return;
    } else {
        ws = res;
    }
    
    vehicleSocks(ws, request)
    console.log(`${ws.user.id} - Connected`);
    ws.send('Connection to server established');

    // ws.on('me', (data) => {
    //     console.log(data);
    // })

    ws.on('message', (message) => {
        console.log('received a message');
        const parsed_message = parseData(message);
        if (typeof parseData == 'string') {
            console.log('Message is not a valid JSON');
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
});

wss.on('ws:message', (message) => {
    console.log(message);
    // ws.send('Message received');
});

module.exports = wss;
