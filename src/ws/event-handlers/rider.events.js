const { activateForBooking, deactivateForBooking } = require('../../controllers/vehicle.controller');

const { saveNewLocation, updateLocation, getLocation, deleteVehicleLocation } = require('../../utils/location');
const { socketAsyncWrapper } = require("../middlewares/wrapper.ws");
const { stringify } = require('../../utils/json');
const Vehicle = require('../../models/vehicle.model');
const { Rider } = require('../../models/users.model');

class RiderSockets {
    constructor(client, sock) {
        this.client = client;
        this.socket = sock;
    }

    init() {
        const self = this.client;

        // Change rider status to online
        this.client.on('rider:goonline', socketAsyncWrapper(async (data) => {
            console.log(data)
            const { vehicle_id, location } = data;

            const rider = await Rider.findOne({ user: self.user.id })
            if (!rider) throw new Error('Unauthorized Error: User is not a rider');
            // console.log(rider)
            const vehicle = await Vehicle.findById(vehicle_id).populate('rider');
            if (!vehicle) {// use defaultVehicle;
                await rider.goOnline().catch(err => { throw err });
            } else {
                await rider.goOnline(vehicle_id).catch(err => { throw err });
            }

            const vehicle_location = await saveNewLocation(rider._id, location);

            self.send(stringify({
                event: data.event,
                data: {
                    vehicle,
                    location: vehicle_location,
                }
            }))

        }, this.socket));

        // Change rider status to offline
        this.client.on('rider:gooffline', socketAsyncWrapper(async (data) => {
            const rider = await Rider.findOne({ user: self.user.id })
            if (!rider) throw new Error('Unauthorized Error: User is not a rider');

            await rider.goOffline().catch(err => { throw err });

            const vehicle = await deleteVehicleLocation(rider.currentVehicle);

            self.send(stringify({
                event: data.event,
                data: {
                    vehicle,
                }
            }))
        }, this.socket));

        this.client.on('rider:update-location', async function (data) {
            const { location } = data;
            const { longitude, latitude } = location;
            const location_id = await saveNewLocation(vehicle_id, location);
        });
    }
}

module.exports = {
    RiderSockets,
};
