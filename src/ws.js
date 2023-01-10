const WebSocketServer = require('ws');
const app = require('./app');
const PORT = process.env.PORT;
const config = require('./utils/config');
const jwt = require('jsonwebtoken');

const express_server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const wss = new WebSocketServer.Server({ server: express_server, path: '/ws' });

function authenticate(socket, request) {
    return new Promise((resolve, reject) => {
        try {
            const token = request.headers['sec-websocket-protocol'];
            jwt.verify(token, config.JWT_ACCESS_SECRET, (error, decoded) => {
                if (error) {
                    throw error;
                } else {
                    socket.user = decoded;
                    resolve(socket);
                }
            });
        } catch (error) {
            console.log(error);
            socket.close();

            reject(error);
        }
    });
}

wss.on('connection', async (ws, request) => {
    ws = await authenticate(ws, request);

    console.log(`${ws.user.id} - Connected`);
    ws.send('Connection to server established');

    ws.on('message', (data) => {
        console.log(JSON.parse(data));
        console.log(ws.id);
        // request = JSON.parse(request);
        // authenticate
        // switch (request.event) {
        //     case 'authenticate':
        //         authenticate(ws);
        //         break;
        // }
        ws.send('echo');
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        const index = clients.indexOf(ws);
        if (index !== -1) {
            clients.splice(index, 1);
        }
    });
});

wss.on('echo', (data) => {
    console.log(data);
});

// wss.onmessage = (data) => {
//     console.log(data);
// };

module.exports = wss;
