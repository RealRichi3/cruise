const { activateForBooking, deactivateForBooking } = require('../../controllers/vehicle.controller');

const { saveNewLocation, updateLocation, getLocation, deleteVehicleLocation } = require('../../utils/location');
const { socketAsyncWrapper } = require("../middlewares/wrapper.ws");
const { stringify } = require('../utils/json');
const Vehicle = require('../../models/vehicle.model');

class VehicleSockets {
    constructor(client, sock) {
        this.client = client;
        this.socket = sock;
    }

    init() {
        const self = this.client;

        this.client.on('vehicle:goonline', socketAsyncWrapper(async (data) => {
            const { vehicle_id, location } = data;

            const vehicle = await Vehicle.findById(vehicle_id).populate('rider');

            if (!vehicle) throw new Error('BadRequest Error: Vehicle not found');

            // Check if user owns the vehicle
            if (vehicle.rider.user != self.user.id) {
                throw new Error('Unauthorized Error: You are not the owner of this vehicle');
            }
            
            if (vehicle.rider.is_online) return;

            vehicle.rider.is_online = true;
            vehicle.rider.save();
            vehicle.updateOne({ booking_status: 'available' })

            const vehicle_location = await saveNewLocation(vehicle_id, location);

            self.send(stringify({
                event: 'vehicle:goonline',
                data: {
                    vehicle,
                    location: vehicle_location,
                }
            }))

        }, this.socket));

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
