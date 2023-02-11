const { RiderLocation } = require('../../models/location.model')

const saveNewLocation = async function (data, socket) {
    try {
        if (!socket) socket = this;

        const { location } = data
        const [longitude, latitude] = location.coordinates

        // Create new location
        const new_location = await RiderLocation.create({
            rider: socket.user.rider._id,
            location: {
                type: 'Point',
                coordinates: [longitude, latitude],
            },
        });

        return new_location;
    } catch (error) {
        console.log(error)
    }
};

const updateLocation = async function (data, res) {
    try {
        const socket = this
        const curr_location = data.location
        const [longitude, latitude] = curr_location.coordinates
        // await RiderLocation.deleteOne({ _id: socket.user.rider.location_id })

        // return
        const location = await RiderLocation.findOne({ rider: socket.user.rider._id });
        console.log(location)
        if (!location) {
            console.log('no loc found')
            // Create new location
            const new_location_data = {
                rider_id: socket.user.rider._id,
                location: { coordinates: [longitude, latitude] }
            }
            await saveNewLocation(new_location_data, socket)

            res(null, new_location_data)
            return
        }

        console.log(location)
        const new_location_data = await location.updateCoordinates(longitude, latitude)

        res(null, new_location_data)
    } catch (error) {
        console.log(error)
        res(error)
    }
}

const getLocation = async function (data, res) {
    const socket = this

    const { rider } = socket.user
    const rider_location = rider.location

    if (!rider_location) {
        res('Rider location not found', null)
    }

    res(null, rider_location)
}

module.exports = (io, socket) => {
    const res = (err, data) => {
        if (err) {
            socket.emit('error', err)
        } else {
            socket.emit('success', data)
        }
    }

    socket.on('update-location', (data) => updateLocation.call(socket, data, res));
    socket.on('get-location', (data) => getLocation.call(socket, data, res), res);
    socket.on('save-new-location', (data) => saveNewLocation.call(socket, data, res));
}
