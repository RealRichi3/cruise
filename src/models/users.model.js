const { default: mongoose } = require('mongoose');
const schema = mongoose.Schema;
const { PaymentInfo } = require('./payment_info.model');

const statusSchema = new schema(
    {
        user: { type: schema.Types.ObjectId, ref: 'User', required: true },
        isVerified: { type: Boolean, default: false },
        isActive: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const userSchema = new schema(
    {
        firstname: { type: String, required: true },
        lastname: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        role: {
            type: String,
            required: true,
            default: 'enduser',
            enum: ['enduser', 'rider', 'admin', 'superadmin'],
        },
    },
    { timestamps: true }
);

const enduserSchema = new schema(
    {
        user: { type: schema.Types.ObjectId, ref: 'User', required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        payment_info: { type: schema.Types.ObjectId, ref: 'PaymentInfo' },
    },
    { timestamps: true }
);

const riderSchema = new schema(
    {
        user: { type: schema.Types.ObjectId, ref: 'User', required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        payment_info: { type: schema.Types.ObjectId, ref: 'PaymentInfo' },
        vehicles: [
            {
                type: schema.Types.ObjectId,
                ref: 'Vehicle',
            },
        ],
        removed_vehicles: [{ type: schema.Types.ObjectId, ref: 'Vehicle' }],
        driver_license: {
            type: String,
            required: true,
        },
        taxi_license: {
            type: String,
        },
        rider_status: {
            type: String,
            required: true,
            default: 'inactive',
            enum: ['active', 'inactive', 'suspended'],
        },
        hasVehicle: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const adminSchema = new schema(
    {
        user: { type: schema.Types.ObjectId, ref: 'User', required: true },
        state: { type: String, required: true },
    },
    { timestamps: true }
);

const superadminSchema = new schema(
    {
        user: { type: schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

// Virtuals
userSchema.virtual('password', {
    ref: 'Password',
    localField: '_id',
    foreignField: 'user',
    justOne: true,
});

userSchema.virtual('status', {
    ref: 'Status',
    localField: '_id',
    foreignField: 'user',
    justOne: true,
});

enduserSchema.pre('save', async function (next) {
    const user = this;
    if (user.isNew()) {
        const status = new Status({ user: user._id, isActive: true });
        await status.save();

        const payment_info = new PaymentInfo({ user: user._id, enduser: this._id });
        await payment_info.save();
    }
    next();
});

riderSchema.pre('save', async function (next) {
    const user = this;
    if (user.isNew()) {
        const status = new Status({ user: user._id });
        await status.save();

        const payment_info = new PaymentInfo({ user: user._id, rider: this._id});
        await payment_info.save();
    }

    next();
});
const Status = mongoose.model('Status', statusSchema);
const User = mongoose.model('User', userSchema);
const Enduser = mongoose.model('Enduser', enduserSchema);
const Rider = mongoose.model('Rider', riderSchema);
const Admin = mongoose.model('Admin', adminSchema);
const Superadmin = mongoose.model('Superadmin', superadminSchema);

module.exports = {
    User,
    Enduser,
    Rider,
    Admin,
    Superadmin,
    Status,
};
