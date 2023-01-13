let path;

switch (process.env.NODE_ENV) {
    case 'prod':
        path = `/etc/secrets/.env.prod`;
        break;
    case 'dev':
        path = `${__dirname}/.env.dev`;
        break;
    case 'test':
        path = `${__dirname}/.env.test`;
    default:
        path = `${__dirname}/.env`;
}

require('dotenv').config({ path });

const { MONGO_URI, PORT } = require('./utils/config');
const app = require('./app');

const connectDatabase = require('./db/connectDB');

async function start() {
    try {
        await connectDatabase(MONGO_URI);

        app.listen(PORT, function () {
            console.log(`Server is running on port ${PORT}....`);
        });
    } catch (error) {
        console.log(error);
    }
}

start();
