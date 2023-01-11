const { activateForBooking, deactivateForBooking } = require('../../controllers/vehicle.controller');

const { saveNewLocation, updateLocation, getLocation, deleteVehicleLocation } = require('../../utils/location');
const { socketAsyncWrapper } = require("../middlewares/wrapper.ws");

class VehicleSockets {
    constructor(client, sock) {
        this.client = client;
        this.socket = sock;
        this.name = 'VehicleSockets';
    }

    init() {
        const self = this;
        this.client.on('vehicle:goonline', socketAsyncWrapper(async (data) => {
            console.log('Vehicle going online');
            console.log(this.name);

            const { vehicle_id, location } = data;

            const vehicle = await activateForBooking(vehicle_id);
            await saveNewLocation(vehicle_id, location);
            // self.socket.emit('error', 'Vehicle going online')
            // console.log(error);
            throw new Error('this is the test error');
        }, this.socket),
        );

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
