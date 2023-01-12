const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { Rider } = require('./users.model')

const location = new Schema({
    vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    rider: { type: Schema.Types.ObjectId, ref: 'Rider', required: true },
    location: {
        type: new Schema({
            type: { type: String, default: 'Point' },
            coordinates: {
                type: [Number],
                default: [0, 0],    // [longitude, latitude]
                required: true,
            },
        }),
    },
    createdAt: { type: Date, default: Date.now },
});

location.index({ location: '2dsphere' });

location.pre('validate', async function () {
    if (this.isNew) {
        const rider = await Rider.findById(this.rider);
        if (!rider) { throw new Error('Rider not found') }

        this.vehicle = rider.currentVehicle;
    }
})

const Location = mongoose.model('Location', location);

location.methods.updateCoordinates = async function (long, lat) {
    this.location.coordinates = [long, lat];
    await this.save();

    return this
};

module.exports = Location;
