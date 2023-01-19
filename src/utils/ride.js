const { stringify } = require('./json');
const { Rider } = require('../models/users.model');
const { clients } = require('../ws/utils/clients');
const { RiderLocation } = require('../models/location.model');

const vehicle_rating = {
    "urban": 0,
    "standard": 3,
    "elite": 4.5
}

function calcCordDistance(cord1, cord2) {
    const R = 6371e3; // metres

    const φ1 = (cord1[0] * Math.PI) / 180; // φ, λ in radians
    const φ2 = (cord2[0] * Math.PI) / 180;
    const Δφ = ((cord2[0] - cord1[0]) * Math.PI) / 180;
    const Δλ = ((cord2[1] - cord1[1]) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const d = R * c; // in metres
    return d;
}

function getCost(distance, vehicle_rating) {
    //  Calculate cost of ride - based on distance, and vehicle rating
    const cost = distance * vehicle_rating;
    return cost;
}

function sendRideRequestToRider(client, ride_request) {
    console.log('Sending ride request to rider: ', client.user.email)
    client.send(
        stringify({
            event: 'ride:request',
            data: {
                ride_request,
            },
        }),
    );
}

/**
 * Handle Rider Response for Ride Request
 * 
 * @description - handles rider response to ride request
 * 
 * @param {Object} client - rider's socket connection
 * @param {Object} ride_request - ride request object
 * @returns {Promise} - resolves to rider response
 */
function handleRidersResponse(client, ride_request) {
    return new Promise((resolve, reject) => {
        client.on('ride:request_response', (data) => {
            console.log('Rider response received: ')
            console.log(data)
            //  If rider declines, try next rider - limit to 3 riders
            if (!data.accepted) resolve(null);

            // If rider accepts, create a ride, and init map tracking for rider on user app and rider app

            // Add rider info to data object 
            data.rider = curr_rider;
            client.removeAllListeners('ride:request_response');
            resolve(data);
        });
        
        // return null if no response from rider after 20 seconds
        setTimeout(() => {
            if (client) client.removeAllListeners('ride:request_response');
            resolve(null)
        }, 20000);
    });
}

async function sendRideRequestToRiders(riders, ride_request) {
    for (let i = 0; i < 4; i++) {
        const rider = await riders[i].rider.populate('user');
        if (i == 0) { rider.user.email = 'cruiserider9@gmail.com' }

        //  Get riders socket connections
        const rider_client = clients.get(rider.user.email);

        curr_rider = await Rider.findOne({
            user: rider.user._id,
        });

        // If rider isn't connected, Try next rider
        if (!rider_client) {
            console.log(rider.user.email + 'is not connected')
            continue;
        }

        //  If rider is connected, send ride request to rider
        sendRideRequestToRider(rider_client, ride_request);

        //  Listen for riders response
        const riders_response = await handleRidersResponse(rider_client, ride_request);
        if (riders_response) { return riders_response }
        console.log(riders_response)
    }
}

async function getClosestRiders(coordinates) {
    return await RiderLocation.find({
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates,
                },
                $maxDistance: 10000000000000,
            },
        },
    }).populate('rider vehicle');
}
async function getRideRouteInKm() { }

module.exports = {
    calcCordDistance,
    getCost,
    getClosestRiders,
    sendRideRequestToRiders,
    getRideRouteInKm,
    vehicle_rating
};
