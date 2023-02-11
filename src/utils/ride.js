const { Rider } = require("../models/users.model");
const { clients } = require("../ws/clients");
const { Ride, RideRequest } = require("../models/ride.model");
const { RiderLocation } = require("../models/location.model");

const vehicle_rating = {
    urban: 0,
    standard: 3,
    elite: 4.5,
};

function calcCordDistance(cord1, cord2) {
    const R = 6371e3; // metres

    const φ1 = (cord1[0] * Math.PI) / 180; // φ, λ in radians
    const φ2 = (cord2[0] * Math.PI) / 180;
    const Δφ = ((cord2[0] - cord1[0]) * Math.PI) / 180;
    const Δλ = ((cord2[1] - cord1[1]) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
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
    console.log("Sending ride request to rider: ", client.user.email);
    client.emit('ride:request',
        {
            data: {
                ride_request,
            },
        }
    );
}

/**
 * Handle Rider Response for Ride Request
 *
 * @description - handles rider response to ride request
 *
 * @param {Object} client - rider's socket connection
 * @param {MongooseObject} ride_request - ride request object
 * @returns {Promise} - resolves to rider response
 */
function getRideResponseFromRider(client, ride_req) {
    return new Promise((resolve, reject) => {
        client.on("ride:accepted", async (data) => {
            console.log("Rider response received: ");
            console.log(data);

            // Remove listener
            client.removeAllListeners("ride:accepted")
            client.removeAllListeners("ride:rejected");
            resolve(data);
        });

        client.on("ride:rejected", async (data) => {
            console.log(client.id)
            console.log("Rider response received: ");
            console.log(data);

            // Remove listener
            client.removeAllListeners("ride:accepted");
            client.removeAllListeners("ride:rejected");
            resolve(null);
        });

        // return null if no response from rider after 20 seconds
        setTimeout(() => {
            if (client) {
                client.removeAllListeners("ride:accepted");
                client.removeAllListeners("ride:rejected");
            }
            resolve(null);
        }, 20000);
    });
}

/**
 * Send Ride Request to Riders
 *
 * @description - sends ride request to riders
 *
 * @param {Array} riders - array of rider objects
 * @param {MongooseObject} ride_request - ride request object
 *
 * @returns {Promise} - resolves to rider response
 *
 * // TODO: - Implement realtime location tracking for rider on user app and rider app
 * // TODO: - Add ride tracking link to be used from any browser
 * */
async function sendRideRequestToRiders(riders, ride_request) {
    let ride;
    // const test_riders = [
    //     'cruiserider9@gmail.com',
    //     'cruiserider13@gmail.com',
    //     'cruiserider14@gmail.com',
    //     'cruiserider15@gmail.com',
    //     'cruiserider16@gmail.com',
    // ]
    // console.log(riders)
    const limit = riders.length > 5 ? 5 : riders.length;
    console.log(limit)
    for (let i = 0; i < limit; i++) {
        const rider = await riders[i].rider.populate("user");
        // rider.user.email = test_riders[i]

        //  Get riders socket connections
        const rider_client = clients.get(rider.user.email);

        // If rider isn't connected, Try next rider
        if (!rider_client) {
            console.log(rider.user.email + " is not connected");
            continue;
        }

        //  If rider is connected, send ride request to rider
        sendRideRequestToRider(rider_client, ride_request);

        //  Get response from rider
        const riders_response = await getRideResponseFromRider(rider_client, ride_request);
        if (riders_response) {
            // Create a ride
            ride = await ride_request.createNewRide(rider._id);

            // TODO: Start realtime location tracking for rider on user app and rider ap

            // Send ride data to rider
            rider_client.emit('ride:accepted',
                {
                    data: {
                        ride,
                    },
                }
            );

            break;
        }
    }
    return ride;
}

async function getClosestRiders(coordinates) {
    return await RiderLocation.find({
        location: {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates,
                },
                $maxDistance: 10000000000000,
            },
        },
    }).populate("rider vehicle");
}

async function getRideRouteInKm() { }

module.exports = {
    calcCordDistance,
    getCost,
    getClosestRiders,
    sendRideRequestToRiders,
    getRideRouteInKm,
    vehicle_rating,
};
