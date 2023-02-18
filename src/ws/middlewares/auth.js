const jwt = require('jsonwebtoken');
const config = require('../../utils/config');
const { User } = require('../../models/users.model');

async function authenticate(socket) {
    try {
        const token = socket.handshake.query?.access_token;
        if (!token) {
            throw new Error('Authentication token not provided')
        }

        const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET);
        const user_doc = await User.findById(decoded.id)
            .populate({
                path: 'rider',
                populate: {
                    path: 'location',
                    model: 'RiderLocation'
                }
            });

        // Show virtuals
        socket.user = user_doc;

        return socket
    } catch (err) {
        console.log(err)
        return err
    }
}

module.exports = authenticate
