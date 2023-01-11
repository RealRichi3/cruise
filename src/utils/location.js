const Location = require('../models/location.model')

const saveNewLocation = async (vehicleId, location) => {
    const new_location = await Location.create({
        vehicle: vehicleId,
        location: {
            type: 'Point',
            coordinates: [location.longitude, location.latitude],
        },
    });

    console.log(new_location)

    return new_location;
};

const updateLocation = async (location_id, long, lat) => {
    const location = await Location.findById(location_id);

    if (!location) { return null; }

    const new_location_data = await location.updateCoordinates(long, lat)

    return new_location_data
}

const getLocation = async(vehicleId) => {
    const location = await Location.findOne({vehicle: vehicleId})

    if (!location) { return null; }

    return location
}

const deleteVehicleLocation = async(vehicle_id) => {
    const location = await Location.findOneAndDelete({vehicle: vehicle_id})

    if (!location) { return null; }

    return location
}

module.exports = {
    saveNewLocation,
    updateLocation,
    getLocation,
    deleteVehicleLocation,
}
