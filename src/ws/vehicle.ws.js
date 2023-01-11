const {
    activateForBooking,
    deactivateForBooking,
} = require('../controllers/vehicle.controller');

const {
    saveNewLocation,
    updateLocation,
    getLocation,
    deleteVehicleLocation,
} = require('../controllers/location');

module.exports = {
    vehicle: (socket, request) => {
        socket.on('me', async function (data) {
            console.log('Vehicle going online');
            const { vehicle_id } = data;
            const vehicle = await activateForBooking(vehicle_id);

            const cdata = JSON.stringify({
                vehicle,
                event: 'vehicle:goonline:res',
            });
            socket.send(cdata);
            // socket.on('vehicle:update-location', async function (data) {
            //     const { location } = data;
            //     const { longitude, latitude } = location;
            //     const location_id = await saveNewLocation(vehicle_id, location);

            //     socket.on('vehicle:update-location', async function (data) {
            //         const { location } = data;
            //         const { longitude, latitude } = location;
            //         const location_id = await updateLocation(location_id, longitude, latitude);
            //     });
            // })
        });

        return;
    },
};
