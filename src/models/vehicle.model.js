const mongoose = require('mongoose')
const schema = mongoose.Schema

const vehicleSchema = new schema({
    name: { type: String, required: true },
    manufacturer: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    color: { type: String, required: true },
    plate_number: { type: String, required: true },
    rider: { type: schema.Types.ObjectId, ref: 'Rider', required: true },
    createdAt: { type: Date, default: Date.now },
})

const Vehicle = mongoose.model('Vehicle', vehicleSchema)

module.exports = Vehicle
