const WebSocketServer = require('ws');
const app = require('./app');
const PORT = process.env.PORT;

const express_server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const wss = new WebSocketServer.Server({ server: express_server, path: '/ws' });

const { VehicleSockets } = require('./ws/event-handlers/vehicle.events');
const { authMiddleware } = require("./ws/middlewares/auth.ws");
const { toJSON, stringify } = require("./ws/utils/json");
const { removeClient } = require('./ws/utils/clients');
const wsWrapper = require('./ws/middlewares/wrapper.ws').socketAsyncWrapper;

wss.on('connection', async (ws, request) => {
    try {
        let res = await authMiddleware(ws, request);
        if (res instanceof Error) {
            ws.send('Authentication failed');
            ws.close();

            return;
        } else {
            ws = res;
        }

        // Init event handlers
        new VehicleSockets(ws, wss).init()

        console.log('new client connected')
        ws.send('Connection established');

        /**
         * For plain message from client
         * message - string
         * 
         * For event message from client
         * message - JSON string
         * message = { event, data }
         * event - string
         * data - object
         */
        ws.on('message', (message) => {
            const parsed_message = toJSON(message);
            if (parsed_message == null) {
                // Plain message
                wss.emit('ws:message', message.toString());

                console.log(parsed_message)
                wss.emit('error', 'Message is not a valid JSON');
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
        ws.send('Error occured');
        ws.close();
        wss.emit('error', error)
    }
});

wss.on('ws:message', (message) => {
    console.log('frontend: ' + message);
    return
});

wss.on('error', (error) => {
    console.log('Error occured')
    console.log(error);
});

module.exports = wss;
