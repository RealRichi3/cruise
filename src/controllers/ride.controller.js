const { DepartureOrDestination, RiderLocation } = require("../models/location.model");
const { wsClients, clientIndexes, clients } = require('../ws/utils/clients')
const { stringify } = require('../utils/json');
const { BadRequestError } = require('../utils/errors');
const { Rider } = require('../models/users.model')
const Ride = require('../models/ride.model')

const bookRide = async (req, res, next) => {
    // console.log(req.body)
    //    Get the ride info
    const { departure, destination, } = req.body;

    if (!departure || !destination ||
        !departure.coordinates || !destination.coordinates ||
        !departure.address || !destination.address) {
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
        address: destination.address,
        type: 'destination',
        location: {
            type: 'Point',
            coordinates: destination.coordinates,
        },
    })

    // console.log(departure_location)
    // console.log(destination_location)

    //    Check riders within the current users location
    //    Get the nearest rider
    const closest_riders = await RiderLocation.find({
        location: {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: departure_location.location.coordinates,
                },
                $maxDistance: 100000000000000000,
            },
        },
    }).populate({
        path: 'rider',
        populate: {
            path: 'user',
        },
    }).populate('vehicle')
    function calcCordDistance(cord1, cord2) {
        const R = 6371e3; // metres

        const φ1 = cord1[0] * Math.PI / 180; // φ, λ in radians
        const φ2 = cord2[0] * Math.PI / 180;
        const Δφ = (cord2[0] - cord1[0]) * Math.PI / 180;
        const Δλ = (cord2[1] - cord1[1]) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const d = R * c; // in metres
        return d;
    }

    //   Calculate distance between rider and user
    closest_riders.forEach((rider) => {
        rider.distance = calcCordDistance(
            rider.location.coordinates,
            departure_location.location.coordinates)
    })

    // console.log(closest_riders)

    //   Sort riders by distance
    const sorted_riders = closest_riders.sort((a, b) => {
        return a.distance - b.distance
    })

    //    Check if rider is available
    const available_riders = sorted_riders.filter((rider) => {
        return rider.rider.rideStatus === 'available'
    })

    //    Send request to rider,
    function sendRequestToRiders(riders) {
        return new Promise(async (resolve, reject) => {
            try {
                //  Get current client from socket connections
                // const curr_client = wsClients[riders[0].rider.email]
                const rider = riders[0].rider
                const cli_index = clientIndexes[rider.user.email]
                const curr_client = clients[cli_index]

                console.log(clientIndexes)
                console.log(cli_index)

                // console.log(clients[0])
                console.log(Object.keys(clientIndexes))
                console.log(rider)
                console.log(curr_client)

                console.log(riders[0].rider.user)
                const curr_rider = await Rider.findOne({ user: riders[0].rider.user._id })

                //  If rider is connected, send notification to rider
                if (curr_client) {
                    curr_client.send('ride:request', stringify({
                        departure: departure_location,
                        destination: destination_location,
                    }))
                }

                // Wait for rider to accept or decline - limit time to 20 seconds
                curr_client.on('ride:request_response', (data) => {
                    if (data.accepted) {
                        resolve(data)
                        //  If rider accepts, create a ride, and init map tracking for rider on user app and rider app
                    } else {
                        //  If rider declines, try next rider - limit to 3 riders
                        resolve(null)
                    }
                    resolve(data)
                })

                setTimeout(() => {
                    //  If no rider accepts, send notification to user
                    // curr_client.send('ride:request_response', stringify({
                    //     accepted: false,
                    //     message: 'No rider available',
                    // }))
                    resolve(null)
                }, 20000)
            } catch (error) {
                reject(error)
            }
        })
    }

    const response = await sendRequestToRiders(available_riders)
    if (!response) {
        //  If no rider accepts, send notification to user
        return res.status(200).json({
            success: false,
            data: {
                message: 'No rider available',
            }
        })
    }

    console.log(response)

    //  If rider accepts, create a ride, and init map tracking for rider on user app and rider app
    const ride = await Ride.create({
        departure: departure_location._id,
        destination: destination_location._id,
        rider: response.rider._id,
        user: req.user._id,
        vehicle: response.vehicle._id,
    })

    return res.status(200).json({
        success: true,
        data: {
            message: 'Ride request sent',
        }
    })
    //  Get current client from socket connections





    //  If rider is not connected, send notification to rider

    //  Emmit event to rider
    //  Wait for rider to accept or decline - limit time to 20 seconds

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
