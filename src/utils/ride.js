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

async function sendRideRequestToRiders(riders, ride_request) {
    try {
        //  Get riders socket connections
        const rider = riders[0].rider;
        const rider_client = clients.get(rider.user.email);

        curr_rider = await Rider.findOne({
            user: rider.user._id,
        });

        //  If rider is connected, send notification to rider
        if (rider_client) {
            rider_client.send(
                stringify({
                    event: 'ride:request',
                    data: {
                        ride_request,
                    },
                }),
            );
        } else {
            //  Try next rider
            return null;
        }

        // Wait for rider to accept or decline - limit time to 20 seconds
        rider_client.on('ride:request_response', (data) => {
            //  If rider declines, try next rider - limit to 3 riders
            if (!data.accepted) return null;

            // If rider accepts, create a ride, and init map tracking for rider on user app and rider app
            
            // Add rider info to data object 
            data.rider = curr_rider;
            
            return data;
        });

        setTimeout(() => {
            //  If no rider accepts, send notification to user

            return null;
        }, 20000);
    } catch (error) {
        return error;
    }
}

async function getClosestRiders(coordinates) {
    return RiderLocation.find({
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates,
                },
                $maxDistance: 1000,
            },
        },
    }).populate('rider vehicle departure destination');
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
