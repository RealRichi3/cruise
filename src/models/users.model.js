const { default: mongoose } = require('mongoose');
const schema = mongoose.Schema;
const { Wallet } = require('./payment_info.model');

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
        enduser: { type: schema.Types.ObjectId, ref: 'EndUser' },
        rider: { type: schema.Types.ObjectId, ref: 'Rider' },
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
        wallet: { type: schema.Types.ObjectId, ref: 'Wallet', required: true },
        cards: [{ type: schema.Types.ObjectId, ref: 'Card' }],
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
        bank_accounts: [{ type: schema.Types.ObjectId, ref: 'BankAccount' }],
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

userSchema.pre('validate', async function (next) {
    if (this.isNew) {
        const status = new Status({ user: this._id });
        this.status = status._id;

        if (this.role == 'enduser') status.isActive = true;

        await status.save();
    }
});

enduserSchema.pre('validate', async function (next) {
    if (this.isNew) {
        const wallet = new Wallet({ user: this.user._id, enduser: this._id });
        this.wallet = wallet._id;

        await wallet.save();
    }

    next();
});

riderSchema.pre('validate', async function (next) {
    if (this.isNew) {
        const wallet = new Wallet({ user: this.user._id, rider: this._id });
        this.wallet = wallet._id;

        await wallet.save();
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
