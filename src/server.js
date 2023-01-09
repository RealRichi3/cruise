if (process.env.NODE_ENV) {
    require('dotenv').config({
        path: `${__dirname}/.env.${process.env.NODE_ENV}`,
    });
} else {
    require('dotenv').config({ path: `${__dirname}/.env` });
}

const { MONGO_URI, PORT } = require('./utils/config');
const app = require('./app');

const connectDatabase = require('./db/connectDB');
const WebSocket = require('ws');

async function start() {
    try {
        connectDatabase(MONGO_URI);

        const express_server = app.listen(PORT, function () {
            console.log(`Server is running on port ${PORT}....`);
        });

        const wss = new WebSocket.Server({ server: express_server });
        wss.on('connection', function connection(ws, wsReq) {
            console.log(`Websocket connection established on port ${PORT}`);
            ws.send('Hi i am a websocket server');
            ws.on('message', (data) => {
                if (data.type ==  'rider:online'){

                }
            });
        });
    } catch (error) {
        console.log(error);
    }
}

start();
