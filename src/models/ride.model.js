const mongoose = require('mongoose')
const schema = mongoose.Schema

const rideSchema = new schema({
    rider: { type: schema.Types.ObjectId, ref: 'Rider', required: true },
    passenger: {
        type: schema.Types.ObjectId,
        ref: 'User', // not EndUser so other user-roles can book ride
        required: true,
    },
    vehicle: { type: schema.Types.ObjectId, ref: 'Vehicle', required: true },
    start_location: { type: String, required: true },
    end_location: { type: String, required: true },
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

module.exports = Ride
