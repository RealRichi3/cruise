const { DepartureOrDestination, RiderLocation } = require("../models/location.model");

const bookRide = async (req, res, next) => {
    //    Get the ride info
    const { departure, destination, } = req.body;

    if (!departure || !arrival ||
        !departure.coordinates || !arrival.coordinates ||
        !departure.address || !arrival.address) {
        return next(new BadRequestError('Invalid ride info'));
    }

    const departure_location = await DepartureOrDestination.create({
        address: departure.address,
        type: 'departure',
        location: {
            type: 'Point',
            coordinates: departure.coordinates,
        },
    })

    const destination_location = await DepartureOrDestination.create({
        address: arrival.address,
        type: 'destination',
        location: {
            type: 'Point',
            coordinates: arrival.coordinates,
        },
    })

    //    Check riders within the current users location
    //    Get the nearest rider
    const closest_riders = await RiderLocation.find({
        location: {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: [departure.coordinates[0], departure.coordinates[1]],
                },
                $maxDistance: 1000,
            },
        },
    }).populate('rider vehicle')

    //   Calculate distance between rider and user
    closest_riders.forEach((rider) => {
        rider.distance = rider.location.distanceTo(departure_location.location)
    })

    //   Sort riders by distance
    const sorted_riders = closest_riders.sort((a, b) => {
        return a.distance - b.distance
    })

    //    Check if rider is available
    const available_riders = sorted_riders.filter((rider) => {
        return rider.rider.rideStatus === 'available'
    })

    //    Send request to rider,
        //  Check clients.rider.id in array of socket connections
        //  If rider is connected, send notification to rider
        //  Emmit event to rider
        //  Wait for rider to accept or decline - limit time to 20 seconds
        //  If rider accepts, create a ride, and init map tracking for rider on user app and rider app
        //  If rider declines, try next rider - limit to 3 riders
        //  If no rider accepts, send notification to user
    
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
