const jwt = require('jsonwebtoken');
const config = require('../../utils/config');
const { User, Rider } = require('../../models/users.model');
const { RiderLocation } = require('../../models/location.model');

async function authenticate(socket) {
    try {
        const token = socket.handshake.query?.access_token;
        if (!token) {
            throw new Error('Authentication token not provided')
        }

        const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET);
        const user_doc = await User.findById(decoded.id).populate('rider');

        const rider = await Rider.findOne({ user: user_doc._id })
        console.log(rider.toJSON({ virtuals: true}))
        console.log(rider.toObject({ virtuals: true }))


        const riderLocation = await RiderLocation.findOne({ rider: rider._id })
        console.log(JSON.stringify(rider.toJSON(), null, 2))
        // console.log(user_doc.rider)
        // Show virtuals
        socket.user = user_doc;

        return socket
    } catch (err) {
        console.log(err)
        return err
    }
}

module.exports = authenticate
