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
const { removeClient, addClient, clients: wsClients } = require('./ws/utils/clients');
const wsWrapper = require('./ws/middlewares/wrapper.ws').socketAsyncWrapper;

const clients = require('./ws/utils/clients').wsClients;

let curr_client = null;
function startSocketEventListeners(client) {
    // Init event handlers
    new RiderSockets(client, wss).init()
    client.send('Connection established');

    /**
     * For plain message from curr_client
     * message - string
     * 
     * For event message from curr_client
     * message - JSON string
     * message = { event, data }
     * event - string
     * data - object
     */
    client.on('message', (message) => {
        curr_client = client;
        console.log('--------')
        const parsed_message = toJSON(message);

        // If no event is specified - Assume it's a server message
        if (parsed_message == null || parsed_message.event == 'ws:message') {
            // Plain message
            wss.emit('ws:message', message.toString());
            return;
        }

        const { event, data } = parsed_message;   // If event is specified

        client.emit(event, data);   // Emit event
    });

    client.on('close', () => {
        curr_client = client;
        console.log(`${clients[curr_client.user.email]}  disconnected`)
        removeClient(client);
    });
}

wss.on('connection', async (ws, request) => {
    try {
        curr_client = ws
        let res = await authMiddleware(ws, request);
        if (res instanceof Error) {
            ws.send('Authentication failed');
            ws.close();
            return;
        } else {
            ws = res;
            addClient(ws);
        }

        startSocketEventListeners(ws);
    } catch (error) {
        // ws.close();
        wss.emit('error', error)
    }
});

// Listen for server messages
wss.on('ws:message', (message) => {
    console.log(`[msg] ${curr_client.id} : ${message}`);

    curr_client.send(JSON.stringify({
        event: 'backend:message',
        data: "Message received"
    }))

    return
});

/**
 * @todo - Add cases for different error types
 */
wss.on('error', (error) => {
    if (curr_client != null && curr_client.readyState == WebSocketServer.OPEN) {
        const data = stringify({
            data: "Error occured",
            event: "backend:message"
        })

        curr_client.send(data)
        // curr_client.close()
    }

    console.log(error);
});

module.exports = wss;
