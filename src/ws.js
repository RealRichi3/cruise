const WebSocketServer = require('ws');
const app = require('./app');
const PORT = process.env.PORT;

const express_server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const wss = new WebSocketServer.Server({ server: express_server, path: '/ws' });

const { RiderSockets } = require('./ws/event-handlers/rider.events');
const { authMiddleware } = require("./ws/middlewares/auth.ws");
const { toJSON, stringify } = require("./ws/utils/json");
const { removeClient } = require('./ws/utils/clients');
const wsWrapper = require('./ws/middlewares/wrapper.ws').socketAsyncWrapper;

let client = null;
wss.on('connection', async (ws, request) => {
    try {
        client = ws
        let res = await authMiddleware(ws, request);
        if (res instanceof Error) {
            ws.send('Authentication failed');
            ws.close();

            return;
        } else {
            ws = res;
        }

        // Init event handlers
        new RiderSockets(ws, wss).init()

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
            console.log('--------')
            const parsed_message = toJSON(message);
            console.log(parsed_message)

            // If no event is specified - Assume it's a sevrer message
            if (parsed_message == null) {
                // Plain message
                wss.emit('ws:message', message.toString());

                // console.log(parsed_message)
                // wss.emit('error', 'Message is not a valid JSON');

                // // Send error to error handler
                return;
            }

            // Server specific message
            if (parsed_message.event == 'ws:message') {
                wss.emit('ws:message', parsed_message.data);
                return;
            }

            // Socket specific message
            ws.emit(parsed_message.event, parsed_message.data);

            return;
        });

        ws.on('close', () => {
            console.log('Client disconnected');
            removeClient(ws);
        });
    } catch (error) {
        // ws.close();
        wss.emit('error', error)
    }
});

// Listen for server messages
wss.on('ws:message', (message) => {
    console.log('[msg] frontend: ' + message);

    client.send(JSON.stringify({
        event: 'backend:message',
        data: "Message received"
    }))

    return
});

/**
 * @todo - Add cases for different error types
 */
wss.on('error', (error) => {
    if (client != null && client.readyState == WebSocketServer.OPEN) {
        const data = stringify({
            data: "Error occured",
            event: "backend:message"
        })

        client.send(data)
        // client.close()
    }

    console.log(error);
});

module.exports = wss;
