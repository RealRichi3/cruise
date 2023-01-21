// Utils
const {
    calcCordDistance,
    getCost,
    sendRideRequestToRiders,
    getRideRouteInKm,
    vehicle_rating,
    getClosestRiders,
} = require('../utils/ride');
const { clients } = require('../ws/utils/clients');
const { BadRequestError, UnauthorizedError, NotFoundError } = require('../utils/errors');
const config = require('../utils/config');

// Models
const { DepartureOrDestination, RiderLocation } = require('../models/location.model');
const { Rider } = require('../models/users.model');
const { Ride, RideRequest } = require('../models/ride.model');
const { stringify } = require('../utils/json');

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
 * 
 * // TODO: filter fields in response for initate ride request
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

    console.log(ride_cost);
    console.log(cost);
    // Create ride request
    const ride_request = await RideRequest.create({
        departure: departure_location._id,
        destination: destination_location._id,
        user: req.user.id,
        urban_cost: cost.urban,
        standard_cost: cost.standard,
        elite_cost: cost.elite,
        distance: distance_in_km,
    });

    const ride_request_populated = await ride_request.populate('departure destination user');
    console.log(ride_request_populated);
    return res.status(200).json({
        success: true,
        data: ride_request_populated,
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
 * // TODO: Include ride tracking link to response
 */
const completeRideRequest = async (req, res, next) => {
    // Get the selected ride class
    const { ride_class, payment_method, ride_request_id } = req.body;

    // Check if ride request exists
    const ride_request = await RideRequest.findOneAndUpdate(
        { _id: ride_request_id, status: 'pending' },
        { ride_class, payment_method },
    ).populate('departure destination user');
    if (!ride_request) return next(new BadRequestError('Invalid ride request'));

    // Update ride request payment method
    ride_request.payment_method = payment_method;

    // Search for riders within the current users location
    const closest_riders = await getClosestRiders(ride_request.departure.location.coordinates);

    // Filter closest riders based on vehicle rating and online status
    const filtered_riders = closest_riders.filter(
        (rider) => rider.vehicle.rating >= vehicle_rating[ride_class] && rider.rider.isOnline,
    );

    // Check if matching riders are available
    if (filtered_riders.length == 0) return next(new BadRequestError('No riders available'));

    // Send ride request to riders
    const rider_response = await sendRideRequestToRiders(filtered_riders, ride_request);
    if (!rider_response) {
        console.log('No riders available');
        // ride_request.status = 'cancelled';
        await ride_request.save();

        return next(new NotFoundError('No riders available'));
    }

    // Update ride request status
    ride_request.status = 'accepted';

    // Save ride request
    await ride_request.save();

    return res.status(200).json({
        success: true,
        data: rider_response,
    });
};

/**
 * Cancel Ride Request
 *
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
 * @throws {BadRequestError} Invalid ride request
 */
const cancelRideRequest = async (req, res, next) => {
    const { ride_request_id } = req.body;

    // Check if ride request exists
    const ride_request = await RideRequest.findOne({ _id: ride_request_id }).populate('ride');

    if (!ride_request) return next(new BadRequestError('Invalid ride request'));

    // Check if ride request has been accepted
    if (ride_request.status == 'accepted') {
        // If ride has started ride can't be cancelled
        if (ride_request.ride.status == 'started') { return next(new BadRequestError('Ride has already started')); }

        // Get riders client
        const rider = await Rider.findOne({ _id: ride_request.ride.rider }).populate('user'),
            riders_client = clients.get(rider.user.email);

        // Notify rider that ride request has been cancelled
        riders_client.send(stringify({
            event: 'ride:cancelled',
            data: { ride_request },
        }))
    }

    // Update ride request status
    ride_request.status = 'cancelled';

    // Save ride request
    await ride_request.save();

    return res.status(200).json({
        success: true,
        data: {
            message: 'Ride request cancelled',
        },
    });
};

// TODO: Add arrived
// TODO: Add ride tracking link
// TODO: Add start ride
// TODO: Add end ride
// TODO: Add customer review
// TODO: Add ride review
// TODO: Make reviews affect rider rating

/**
 * Arrived
 * 
 * Sends a notification to the user that the rider has arrived
 * 
 * @param {String} ride_request_id
 * 
 * @returns {string} message
 * 
 * @throws {BadRequestError} Invalid ride request
 */
const rideArrived = async (req, res, next) => {
    const { ride_request_id } = req.body;

    // Check if ride request exists
    const ride_request = await RideRequest.findOne({ _id: ride_request_id }).populate('user ride');
    if (!ride_request) return next(new BadRequestError('Invalid ride request'));

    // Check if ride request belongs to rider
    if (ride_request.ride.rider != req.user.id) return next(new UnauthorizedError('Unauthorized access'));

    // Check if ride request has been accepted
    if (ride_request.status != 'accepted') return next(new BadRequestError('Ride request has not been accepted'));

    // Check if ride has started
    if (ride_request.ride.status == 'started') return next(new BadRequestError('Ride has started'));

    // Check if rider has arrived
    if (ride_request.ride.status == 'arrived') return next(new BadRequestError('Rider has already arrived'));

    // Update ride status
    ride_request.ride.status = 'arrived';

    // Save ride
    await ride_request.ride.save();

    // Get users client
    const users_client = clients.get(ride_request.user.email);

    // Notify user that rider has arrived
    users_client.send(stringify({
        event: 'ride:arrived',
        data: { ride_request },
    }));

    return res.status(200).json({
        success: true,
        data: {
            message: 'Rider has arrived',
        },
    });
};

/**
 * Start Ride
 * 
 * Updates ride status to started
 * 
 * @param {String} ride_request_id
 * 
 * @returns {string} message
 * 
 * @throws {BadRequestError} Invalid ride request
 * @throws {BadRequestError} Ride request has not been accepted
 * @throws {BadRequestError} Ride has already started
 * */
const startRide = async (req, res, next) => {
    const { ride_id } = req.body;

    // Check if ride exists
    const ride = await Ride.findOne({ _id: ride_id }).populate('ride_request');
    if (!ride) return next(new BadRequestError('Invalid ride'));

    // Check if ride belongs to rider
    if (ride.rider != req.user.id) return next(new UnauthorizedError('Unauthorized access'));

    // Check if ride request has been accepted
    if (ride.ride_request.status != 'accepted') return next(new BadRequestError('Ride request has not been accepted'));

    // Check if ride has started
    if (ride.status == 'started') return next(new BadRequestError('Ride has already started'));

    // Update ride status
    ride.status = 'started';

    // Save ride
    await ride.save();

    return res.status(200).json({
        success: true,
        data: {
            message: 'Ride has started',
        },
    });
};

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
    cancelRideRequest,
    rideArrived,
    startRide,
    completeRide,
    reviewRide,
    getRides,
    getRideData,
    getRideReviews,
    getRideReviewData,
    payForRide,
};
