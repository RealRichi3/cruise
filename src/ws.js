const WebSocket = require('ws');

const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', function connection(ws) {
    console.log(`Websocket connection established on port ${PORT}`);
});

function wsOnConnect(ws) {
    wss.emit('connection', ws, req);
}

module.exports = {
    wss,
    wsOnConnect
}
