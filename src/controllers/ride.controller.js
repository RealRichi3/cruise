// Utils
const { calcCordDistance, getCost, sendRideRequestToRiders, getRideRouteInKm, vehicle_rating, getClosestRiders } = require('../utils/ride');
const { clients } = require('../ws/utils/clients');
const { BadRequestError } = require('../utils/errors');

// Models
const { DepartureOrDestination, RiderLocation } = require('../models/location.model');
const { Rider } = require('../models/users.model');
const { Ride, RideRequest } = require('../models/ride.model');

/**
 * Initiate Ride Request
 *
 * @param {Object} departure
 * @param {Object} destination
 * @param {String} departure.address
 * @param {String} destination.address
 * @param {Array} departure.coordinates
 * @param {Array} destination.coordinates
 *
 * @returns {Object} rideRequest
 * @returns {Object} rideRequest.departure
 * @returns {Object} rideRequest.destination
 * @returns {Object} rideRequest.ride_route
 * @returns {Object} rideRequest.user
 * @returns {Object} rideRequest.ride
 * @returns {Number} rideRequest.urban_cost
 * @returns {Number} rideRequest.standard_cost
 * @returns {Number} rideRequest.elite_cost
 *
 * @throws {BadRequestError} Invalid ride info
 * @throws {BadRequestError} Invalid ride route
 */
const initRideRequest = async (req, res, next) => {
    // console.log(req.body)

    //  Get the ride info
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

    // Create departure and destination locations
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

    /* Calculate distance between departure and destination 
       Distance should be for route, not straight line - Use google maps API */
    // const distance_in_km = getRideRouteInKm(departure_location, destination_location);
    const distance_in_km = 20;

    // Calculate cost of ride - based on cost per km and distance in km
    const ride_cost = config.COST_PER_KM * distance_in_km; // Distance in km from googleMap * multiplier

    // Effect cost multiplier for available packages, (elite, urban, standard)
    const cost = {
        urban: ride_cost * config.URBAN_MULTIPLIER,
        standard: ride_cost * config.STANDARD_MULTIPLIER,
        elite: ride_cost * config.ELITE_MULTIPLIER,
    };

    // Create ride request
    const ride_request = await RideRequest.create({
        departure: departure_location._id,
        destination: destination_location._id,
        user: req.user.id,
        urban_cost: cost.urban,
        standard_cost: cost.standard,
        elite_cost: cost.elite,
        distance: route_distance,
    });

    return res.status(200).json({
        success: true,
        data: ride_request.populate('departure destination user'),
    });
};

/**
 * Complete Ride Request
 * 
 * @param {String} ride_class
 * @param {String} payment_method
 * @param {String} ride_request_id
 * 
 * @returns {Object} rideRequest 
 * @returns {Object} rideRequest.departure
 * @returns {Object} rideRequest.destination
 * @returns {Object} rideRequest.ride_route
 * @returns {Object} rideRequest.user
 * @returns {Object} rideRequest.ride
 * @returns {Object} rideRequest.rider
 * @returns {Number} rideRequest.urban_cost
 * @returns {Number} rideRequest.standard_cost
 * @returns {Number} rideRequest.elite_cost
 * 
 */
const completeRideRequest = async (req, res, next) => {
    // Get the selected ride class
    const { ride_class, payment_method, ride_request_id } = req.body;

    // Check if ride request exists
    const ride_request = await RideRequest.findOne({ _id: ride_request_id, ride_class, status: 'pending' });
    if (!ride_request) return next(new BadRequestError('Invalid ride request'));

    // Update ride request payment method
    ride_request.payment_method = payment_method;

    // Search for riders within the current users location
    const closest_riders = await getClosestRiders(ride_request.departure.location.coordinates);

    // Filter closest riders based on vehicle class and online status
    const filtered_riders = closest_riders.filter(
        (rider) => rider.vehicle.rating >= vehicle_rating[ride_class] && rider.rider.isOnline == true,
    );

    // Check if matching riders are available
    if (filtered_riders.length == 0) return next(new BadRequestError('No riders available'));

    // Send ride request to riders
    const rider_response = await sendRideRequestToRiders(filtered_riders, ride_request);
    if (!rider_response) {
        ride_request.status = 'cancelled';
        await ride_request.save();

        return next(new BadRequestError('No riders available'))
    };

    // Update ride request status
    ride_request.status = 'accepted';

    // Save ride request
    await ride_request.save();

    return res.status(200).json({
        success: true,
        data: rider_response
    });
};

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

    // Create location for departure and destination
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

    //   Check riders within the current users location
    //   Get the closest rider based on shortest distance
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
        isOnline: true,
    })
        .populate({
            path: 'rider',
            populate: {
                path: 'user',
            },
        })
        .populate('vehicle');

    // Calculate distance between departure and destination
    // Distance should be for route, not straight line - Use google maps API
    // const route_distance = calcCordDistance(
    //     departure_location.location.coordinates,
    //     destination_location.location.coordinates,
    // );

    // Calculate cost of ride - based on route distance, use multiplier (urban, standard, elite)
    // const ride_cost = // Distance in km from googleMap * multiplier

    // Effect cost multiplier for available packages, (elite, urban, standard)
    // const final_cost = {
    // urban: ride_cost * config.URBAN_MULTIPLIER
    // standard: ride_cost * config.STANDARD_MULTIPLIER
    // elite: ride_cost * config.ELITE_MULTIPLIER
    // }

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
    const user_client = clients.get(req.user.email);

    //    Send request to rider,
    let curr_rider = null;

    const location = { departure: departure_location, destination: destination_location };
    const response = await sendRideRequestToRiders(available_riders, location);
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

const acceptRideRequest = async (req, res, next) => { };

const declineRideRequest = async (req, res, next) => { };

const cancelRide = async (req, res, next) => { };

const startRide = async (req, res, next) => { };

const completeRide = async (req, res, next) => { };

const reviewRide = async (req, res, next) => { };

const getRides = async (req, res, next) => { };

const getRideData = async (req, res, next) => { };

const getRideReviews = async (req, res, next) => { };

const getRideReviewData = async (req, res, next) => { };

const payForRide = async (req, res, next) => { };

module.exports = {
    initRideRequest,
    completeRideRequest,
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
