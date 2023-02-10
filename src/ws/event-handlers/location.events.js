const { RiderLocation } = require('../../models/location.model')

const saveNewLocation = async function (data, socket) {
    try {
        if (!socket) socket = this;

        // console.log(socket.user)
        const { location } = data
        console.log(location)
        const [longitude, latitude] = location.coordinates

        const new_location = await RiderLocation.create({
            rider: socket.user.rider._id,
            location: {
                type: 'Point',
                coordinates: [longitude, latitude],
            },
        });

        console.log(new_location)

        return new_location;
    } catch (error) {
        console.log(error)
    }
};

const updateLocation = async function (data) {
    try {
        const socket = this
        console.log('Updating location', data)
        const curr_location = data.location
        const [longitude, latitude] = curr_location.coordinates
        // console.log(socket.user.rider)
        const location = await RiderLocation.findById(socket.user.rider.location);
        console.log(location)

        if (!location) {
            // Create new location
            const new_location_data = { rider_id: socket.user.rider._id, location: { coordinates: [longitude, latitude] } }

            await saveNewLocation(new_location_data, socket)
            console.log('New location', new_location_data)

            return new_location_data
        }

        const new_location_data = await location.updateCoordinates(long, lat)
        console.log('New location data', new_location_data)

        return new_location_data
    } catch (error) {
        console.log(error)
    }
}

const getLocation = async (vehicleId) => {
    const location = await RiderLocation.findOne({ vehicle: vehicleId })

    if (!location) { return null; }

    return location
}

const deleteVehicleLocation = async (vehicle_id) => {
    const location = await RiderLocation.findOneAndDelete({ vehicle: vehicle_id })

    if (!location) { return null; }

    return location
}

module.exports = (io, socket) => {
    socket.on('update-location', updateLocation);
    socket.on('get-location', getLocation);
    socket.on('save-new-location', saveNewLocation);
    socket.on('delete-vehicle-location', deleteVehicleLocation)
}
