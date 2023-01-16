if (process.env.NODE_ENV) {
    require('dotenv').config({
        path: `${__dirname}/.env.${process.env.NODE_ENV}`,
    });
} else {
    require('dotenv').config({ path: `${__dirname}/.env` });
}

const { MONGO_URI, PORT } = require('./utils/config');
const connectDatabase = require('./db/connectDB');

async function start() {
    try {
        await connectDatabase(MONGO_URI);

        require('./ws')
    } catch (error) {
        console.log(error);
    }
}

start();
