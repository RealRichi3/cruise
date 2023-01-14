const { DepartureOrDestination, RiderLocation } = require('../models/location.model');
const { wsClients, clientIndexes, clients } = require('../ws/utils/clients');
const { stringify } = require('../utils/json');
const { BadRequestError } = require('../utils/errors');
const { Rider } = require('../models/users.model');
const Ride = require('../models/ride.model');

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns
 *
 * @todo Implement vehivle rating
 * @todo Implement rider rating
 * @todo Implement enduser rating
 * @todo Implement ride cancellation
 * @todo Implement ride completion
 * @todo calculate cost of ride
 */
const bookRide = async (req, res, next) => {
    // console.log(req.body)
    //    Get the ride info
    const { departure, destination } = req.body;

    if (
        !departure ||
        !destination ||
        !departure.coordinates ||
        !destination.coordinates ||
        !departure.address ||
        !destination.address
    ) {
        return next(new BadRequestError('Invalid ride info'));
    }

    const departure_location = await DepartureOrDestination.create({
            address: departure.address,
            type: 'departure',
            location: {
                type: 'Point',
                coordinates: departure.coordinates,
            },
        }),
        destination_location = await DepartureOrDestination.create({
            address: destination.address,
            type: 'destination',
            location: {
                type: 'Point',
                coordinates: destination.coordinates,
            },
        });

    //    Check riders within the current users location
    //    Get the nearest rider
    const closest_riders = await RiderLocation.find({
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: departure_location.location.coordinates,
                },
                $maxDistance: 100000000000000000,
            },
        },
    })
        .populate({
            path: 'rider',
            populate: {
                path: 'user',
            },
        })
        .populate('vehicle');

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

    // Calculate distance between departure and destination
    const ride_distance = calcCordDistance(
        departure_location.location.coordinates,
        destination_location.location.coordinates,
    );

    // Calculate cost of ride - based on distance, and vehicle rating

    // Effect cost multiplier for available packages, (elite, urban, standard)

    //   Calculate distance between rider and user
    closest_riders.forEach((rider) => {
        rider.distance = calcCordDistance(rider.location.coordinates, departure_location.location.coordinates);
    });

    //   Sort riders by distance
    const sorted_riders = closest_riders.sort((a, b) => {
        return a.distance - b.distance;
    });

    //    Check if rider is available
    const available_riders = sorted_riders.filter((rider) => {
        return rider.rider.rideStatus === 'available';
    });

    //    Get users socket connection
    const user_client = clients[clientIndexes[req.user.email]];

    //    Send request to rider,
    let curr_rider = null;
    function sendRideRequestToRiders(riders) {
        return new Promise(async (resolve, reject) => {
            try {
                //  Get riders socket connections
                const rider = riders[0].rider;
                const rider_client = clients[clientIndexes[rider.user.email]];

                curr_rider = await Rider.findOne({
                    user: rider.user._id,
                });

                //  If rider is connected, send notification to rider
                if (rider_client) {
                    rider_client.send(
                        stringify({
                            event: 'ride:request',
                            data: {
                                departure: departure_location,
                                destination: destination_location,
                            },
                        }),
                    );
                }

                // Wait for rider to accept or decline - limit time to 20 seconds
                rider_client.on('ride:request_response', (data) => {
                    if (data.accepted) {
                        resolve(data);
                        //  If rider accepts, create a ride, and init map tracking for rider on user app and rider app
                    } else {
                        //  If rider declines, try next rider - limit to 3 riders
                        resolve(null);
                    }
                    resolve(data);
                });

                setTimeout(() => {
                    //  If no rider accepts, send notification to user

                    resolve(null);
                }, 20000);
            } catch (error) {
                reject(error);
            }
        });
    }

    const response = await sendRideRequestToRiders(available_riders);
    if (!response) {
        //  If no rider accepts, send notification to user
        return res.status(200).json({
            success: false,
            data: {
                message: 'No rider available',
            },
        });
    }

    const sensitive_fields = [
        'bank_accounts',
        'driver_license',
        'email',
        'removed_vehicle',
        'taxi_license',
        'riderStatus',
    ];

    //  Get rider data
    const rider_data = await Rider.findById(curr_rider._id).populate({
        path: 'vehicles user',
        select: sensitive_fields.join(' '),
    });

    //  If rider accepts, create a ride, and init map tracking for rider on user app and rider app
    const ride = await Ride.create({
        departure: departure_location._id,
        destination: destination_location._id,
        rider: rider_data._id,
        user: req.user.id,
        vehicle: rider_data.currentVehicle,
        passenger: req.user.id,
    });

    return res.status(200).json({
        success: true,
        data: {
            message: 'Ride request sent',
            ride,
        },
    });
};

const acceptRideRequest = async (req, res, next) => {};

const declineRideRequest = async (req, res, next) => {};

const cancelRide = async (req, res, next) => {};

const startRide = async (req, res, next) => {};

const completeRide = async (req, res, next) => {};

const reviewRide = async (req, res, next) => {};

const getRides = async (req, res, next) => {};

const getRideData = async (req, res, next) => {};

const getRideReviews = async (req, res, next) => {};

const getRideReviewData = async (req, res, next) => {};

const payForRide = async (req, res, next) => {};

module.exports = {
    bookRide,
    acceptRideRequest,
    declineRideRequest,
    cancelRide,
    startRide,
    completeRide,
    reviewRide,
    getRides,
    getRideData,
    getRideReviews,
    getRideReviewData,
    payForRide,
};
