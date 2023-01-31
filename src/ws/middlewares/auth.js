const jwt = require('jsonwebtoken');

module.export = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, config.JWT_SECRET);
        socket.user = decoded;
        next();
    } catch (err) {
        return next(new Error('Authentication error'));
    }
}
