const config = require('../../utils/config');
const jwt = require('jsonwebtoken');

// const wsVehicle = require('./ws/vehicle.ws');

async function authMiddleware(socket, request) {
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
                    // socket.id = decoded.email.split('@')[0];
                    socket.id = decoded.email
                    return socket;
                }
            }
        );
    } catch (error) {
        console.log(error);
        return error;
    }
}
exports.authMiddleware = authMiddleware;
