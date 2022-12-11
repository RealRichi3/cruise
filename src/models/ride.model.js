const mongoose = require('mongoose')
const schema = mongoose.Schema

const rideSchema = new schema({
    rider: { type: schema.Types.ObjectId, ref: 'Rider', required: true },
    user: { type: schema.Types.ObjectId, ref: 'User', required: true },
    vehicle: { type: schema.Types.ObjectId, ref: 'Vehicle', required: true },
    start_location: { type: String, required: true },
    end_location: { type: String, required: true },
    start_time: { type: Date, required: true },
    end_time: { type: Date, required: true },
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
