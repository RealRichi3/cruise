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

class VehicleSockets {
    constructor(client, sock) {
        this.client = client;
        const socket = sock;
    }

    init() {
        this.client
        return this.client.on('vehicle:goonline', async function (data) {
            try {
                console.log('Vehicle going online');
                // const { vehicle_id } = data;
                // const vehicle = await activateForBooking(vehicle_id);
                // throw Error('lk')
                sock.emit('error', 'fsdfa');
                return socket.emit('error', 'fsdfa');
            } catch (error) {
            }
        });

        this.client.on('vehicle:gooffline', async function (data) {
            console.log('Vehicle going offline');
            const { vehicle_id } = data;
            const vehicle = await deactivateForBooking(vehicle_id);
        });

        this.client.on('vehicle:update-location', async function (data) {
            const { location } = data;
            const { longitude, latitude } = location;
            const location_id = await saveNewLocation(vehicle_id, location);
        });
    }
}

module.exports = {
    VehicleSockets,
};
