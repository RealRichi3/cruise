const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const location = new Schema({
    rider: { type: Schema.Types.ObjectId, ref: 'Rider', required: true },
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
