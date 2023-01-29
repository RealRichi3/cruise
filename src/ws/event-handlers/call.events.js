const { saveNewLocation, updateLocation, getLocation, deleteVehicleLocation } = require('../../utils/location');
const { socketAsyncWrapper } = require("../middlewares/wrapper.ws");
const { stringify } = require('../../utils/json');
const Vehicle = require('../../models/vehicle.model');
const { Rider } = require('../../models/users.model');

class CallSockets {
    constructor(client, sock) {
        this.client = client;
        this.socket = sock;
    }

    init() {
        const self = this.client;
        // TODO: Add role based access control to all events
        // Change rider status to online
        this.client.on('call:init', socketAsyncWrapper(async (data) => {
            // User should request server connection id - express route
            // Server should return connection id   - express response
            // Peer connection within server should already be established  - rtc
            // User should be connected to server peer connection   - rtc
            // User should request call to rider  - rtc
            /* checks if rider is online, if not, return error */
            // Server should notify rider of call, add peer connection details - ws event
                // if rider accepts, server should await for rider to connect to server peer connection
                // if rider declines, server should notify user that rider has declined 
            // if rider peers with server, server should notify user that rider has accepted

            // if rider accepts, notify user that rider has accepted
            // user should setup peer connection with server
        }, this.socket));

        // Change rider status to offline
        this.client.on('call:end', socketAsyncWrapper(async (data) => {

        }, this.socket));
    }
}

module.exports = {
    CallSockets,
};
