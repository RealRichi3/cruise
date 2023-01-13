const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { Rider } = require('./users.model')


const departurOrArrivalLocationShema = new Schema({
    name: { type: String },
    type: { type: String, enum: ['departure', 'arrival'], required: true },
    location: {
        type: new Schema({
            name: { type: String },
            type: {
                type: String,
                default: 'Point',
            },
            coordinates: {
                type: [Number],
                default: [0, 0],    // [longitude, latitude]
                required: true,
            },
        }),
    },
    createdAt: { type: Date, default: Date.now },
});

const location = new Schema({
    vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle' },
    rider: { type: Schema.Types.ObjectId, ref: 'Rider' },
    location: {
        type: new Schema({
            name: { type: String },
            type: {
                type: String,
                default: 'Point',
            },
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

location.methods.updateCoordinates = async function (long, lat) {
    this.location.coordinates = [long, lat];
    await this.save();

    return this
};

const Location = mongoose.model('Location', location);
const DepartureOrArrivalLocation = mongoose.model('DepartureOrArrivalLocation', departurOrArrivalLocationShema);

module.exports = { Location, DepartureOrArrivalLocation };
