const { saveNewLocation, updateLocation, getLocation, deleteVehicleLocation } = require('../../utils/location');
const { socketAsyncWrapper } = require("../middlewares/wrapper.ws");
const { stringify } = require('../../utils/json');
const Vehicle = require('../../models/vehicle.model');
const { Rider } = require('../../models/users.model');
const config = require('../../utils/config');
const { clients } = require('../utils/clients');

class CallSockets {
    constructor(client, sock) {
        this.client = client;
        this.socket = sock;
    }

    init() {
        const self = this.client;
        // TODO: Add role based access control to all events
        // Change rider status to online
        this.client.on('call:rider:init', socketAsyncWrapper(async (data) => {
            // User should send rider email and peeer id
            const { rider_email, peer_id } = data;

            // Get rider client
            const rider_client = clients.get(rider_email);

            // If rider is not online, notify user
            if (rider_client == null) {
                self.send(stringify({
                    event: 'call:offline',
                    data: { message: 'Rider is offline' }
                }));
                return;
            }

            // If rider is online, notify rider
            // TODO: Check if rider is busy with another ride
            // TODO: Add user details to data sent to rider
            rider_client.send(stringify({ event: 'call:incoming', data: { peer_id } }));

            
            // Await rider response with rider's peer id
            const rider_response = await new Promise((resolve, reject) => {
                rider_client.on('call:response', (data) => {
                    resolve(data);
                });

                // Set timeout to close call if no response
                setTimeout(() => {
                    self.send(stringify({ event: 'call:timeout', data: { message: 'Call timeout' } }));
    
                    // Notify rider that call timed out
                    rider_client.send(stringify({ event: 'call:timeout', data: { message: 'Call timeout' } }));
    
                    // Close call
                    self.emit('call:end');
                    
                    resolve(null);
                }, config.call_timeout);
            });

            // If rider rejects call, notify user
            if (rider_response == null || rider_response.peer_id == null) {
                return;
            }

            // If rider accepts call, notify user
            self.send(stringify({ event: 'call:accepted', data: { peer_id: rider_response.peer_id } }));
        }, this.socket));

        this.client.on('call:enduser:init', socketAsyncWrapper(async (data) => {
            // Rider should send endusers_email and riders peeer id
            const { enduser_email, peer_id } = data;

            // Get enduser client
            const enduser_client = clients.get(enduser_email);

            // If enduser is not online, notify rider
            if (enduser_client == null) {
                self.send(stringify({
                    event: 'call:offline',
                    data: { message: 'Enduser is offline' }
                }));
                return;
            }

            // If enduser is online, notify enduser of incoming call
            enduser_client.send(stringify({ event: 'call:incoming', data: { peer_id } }));

            // Await enduser response with enduser's peer id
            const enduser_response = await new Promise((resolve, reject) => {
                enduser_client.on('call:response', (data) => {
                    resolve(data);
                });

                // If enduser rejects call, notify rider
                enduser_client.on('call:rejected', (data) => {
                    self.send(stringify({ event: 'call:rejected', data: { message: 'Enduser rejected call' } }));
                });

                // Set timeout to close call if no response
                setTimeout(() => {
                    self.send(stringify({ event: 'call:timeout', data: { message: 'Call timeout' } }));

                    // Close call
                    self.emit('call:end');

                    resolve(null)
                }, config.call_timeout);
            });

            if (enduser_response == null || enduser_response.peer_id == null) {
                return;
            }

            // If enduser accepts call, notify rider
            self.send(stringify({ event: 'call:accepted', data: { peer_id: enduser_response.peer_id } }));

        }, this.socket));


        // Change rider status to offline
        this.client.on('call:end', socketAsyncWrapper(async (data) => {
            

        }, this.socket));
    }
}

module.exports = {
    CallSockets,
};
