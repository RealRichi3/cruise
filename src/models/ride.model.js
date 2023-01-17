const mongoose = require('mongoose')
const schema = mongoose.Schema

const rideRequestSchema = new schema({
    urban_cost: { type: Number },
    standard_cost: { type: Number },
    elite_cost: { type: Number },
    ride_class: { type: String, enum: ['urban', 'standard', 'elite'] },
    departure: { type: schema.Types.ObjectId, ref: 'DepartureOrDestination', required: true },
    destination: { type: schema.Types.ObjectId, ref: 'DepartureOrDestination', required: true },
    distance: { type: Number },  // in kilometers
    user: { type: schema.Types.ObjectId, ref: 'User', required: true },
    ride: { type: schema.Types.ObjectId, ref: 'Ride'},
    payment_method: { type: String, enum: ['cash', 'card', 'wallet'] },
    status: { type: String, enum: ['pending', 'accepted', 'cancelled'], default: 'pending' },
})

const rideSchema = new schema({
    rider: { type: schema.Types.ObjectId, ref: 'Rider', required: true },
    passenger: {
        type: schema.Types.ObjectId,
        ref: 'User', // not EndUser so other user-roles can book ride
        required: true,
    },
    vehicle: { type: schema.Types.ObjectId, ref: 'Vehicle', required: true },
    departure: { type: schema.Types.ObjectId, ref: 'DepartureOrDestination', required: true },
    destination: { type: schema.Types.ObjectId, ref: 'DepartureOrDestination', required: true },
    start_time: { type: Date },
    end_time: { type: Date },
    estimated_ride_time: { type: Number },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'ongoing', 'completed', 'cancelled', 'arrived'],
        default: 'pending',
    },
    createdAt: { type: Date, default: Date.now },
})

const Ride = mongoose.model('Ride', rideSchema)
const RideRequest = mongoose.model('RideRequest', rideRequestSchema)

module.exports = { Ride, RideRequest }
