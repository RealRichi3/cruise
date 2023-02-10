const jwt = require('jsonwebtoken');
const config = require('../../utils/config');

async function authenticate(socket) {
    try {
        const token = socket.handshake.query?.access_token;
        if (!token) {
            throw new Error('Authentication token not provided')
        }

        const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET);
        socket.user = decoded;

        return socket
    } catch (err) {
        console.log(err)
        return err
    }
}

module.exports = authenticate
