const mongoose = require('mongoose');
const schema = mongoose.Schema;

const vehicle_statusSchema = new schema({
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false },
    vehicle: { type: schema.Types.ObjectId, ref: 'Vehicle', required: true },
});

const vehicleSchema = new schema({
    name: { type: String, required: true },
    manufacturer: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    color: { type: String, required: true },
    plate_number: { type: String, required: true },
    rider: { type: schema.Types.ObjectId, ref: 'Rider', required: true },
    createdAt: { type: Date, default: Date.now },
    status: {
        type: schema.Types.ObjectId,
        ref: 'VehicleStatus',
        required: true
    },
    actveRide: { type: schema.Types.ObjectId, ref: 'Ride' },
    availableForBooking: { type: Boolean, default: false },
});

vehicleSchema.virtual('location', {
    ref: 'Location',
    localField: '_id',
    foreignField: 'vehicle',
})

const VehicleStatus = mongoose.model('VehicleStatus', vehicle_statusSchema);

vehicleSchema.pre('validate', async function (next) {
    // Create a new vehicle status
    const vehicle_status = await VehicleStatus.create({ vehicle: this._id });

    // Set the vehicle status
    this.status = vehicle_status;

    next();
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);


module.exports = Vehicle;
