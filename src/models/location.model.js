const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const location = new Schema({
    vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    location: {
        type: new Schema({
            type: { type: String, default: 'Point' },
            coordinates: {
                type: [Number],
                default: [0, 0],
                required: true,
            },
        }),
    },
    createdAt: { type: Date, default: Date.now },
});

location.index({ location: '2dsphere' });
const Location = mongoose.model('Location', location);

location.methods.updateCoordinates = async function (long, lat) {
    this.location.coordinates = [long, lat];
    await this.save();

    return this
};

module.exports = Location;
