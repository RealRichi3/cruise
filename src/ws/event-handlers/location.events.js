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
        console.log('updateLocation')
        const socket = this
        const curr_location = data.location
        const [longitude, latitude] = curr_location.coordinates

        // Check if location record exists
        const location = await RiderLocation.findOne({ rider: socket.user.rider._id });
        if (!location) {
            // Create new location if no existing location
            const new_location_data = {
                rider_id: socket.user.rider._id,
                location: { coordinates: [longitude, latitude] }
            }
            await saveNewLocation(new_location_data, socket)

            res(null, new_location_data)
            return
        }

        // Update existing location
        const new_location_data = await location.updateCoordinates(longitude, latitude)

        res(null, new_location_data)
        return
    } catch (error) {
        res(error)
        return
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

    socket.on('location:update', (data) => updateLocation.call(socket, data, res));
    socket.on('location:get-location', (data) => getLocation.call(socket, data, res));
    socket.on('location:save-new', (data) => saveNewLocation.call(socket, data, res));
}
