const { default: mongoose } = require('mongoose');
const schema = mongoose.Schema;
const { Wallet } = require('./payment_info.model');
const Vehicle = require('./vehicle.model');

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
        defaultVehicle: { type: schema.Types.ObjectId, ref: 'Vehicle' },
        currentVehicle: { type: schema.Types.ObjectId, ref: 'Vehicle' },
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
        isOnline: { type: Boolean, default: false },
        rideStatus: { type: String, default: 'available', enum: ['available', 'unavailable'] },
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
        // status.isVerified = this.role == 'enduser' ? true : false;
        status.isVerified = true; status.isActive = true;

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
    return new Promise(async (resolve, reject) => {
        try {
            // Depopulate user
            await this.depopulate('defaultVehicle currentVehicle vehicles removed_vehicles');

            console.log(this)
            if (this.isNew) {
                const wallet = new Wallet({ user: this.user._id, rider: this._id });
                this.wallet = wallet._id;
                await wallet.save();
            }

            // Check if vehicle belongs to rider
            if ((this.isModified('defaultVehicle') && this.defaultVehicle) ||
                (this.isModified('currentVehicle') && this.currentVehicle)) {
                if (!this.vehicles.includes(this.defaultVehicle) || !this.vehicles.includes(this.currentVehicle)) {
                    throw new Error("Vehicle doesn't belong to rider");
                }
            }

            next();
        } catch (error) {
            reject(error);
        }
    });
});

riderSchema.pre('save', async function (next) {
    if (this.isModified('vehicles')) {
        if (this.vehicles.length > 0) {
            this.hasVehicle = true;
        } else {
            this.hasVehicle = false;
        }
    }

    if (!this.defaultVehicle && this.vehicles.length > 0) {
        this.defaultVehicle = this.vehicles[0];
        this.currentVehicle = this.vehicles[0];
    }
});

// Methods
riderSchema.methods.addVehicle = function (vehicle, session = null) {
    return new Promise(async (resolve, reject) => {
        try {
            console.log(this)
            // Check if vehicle belongs to rider
            if (typeof vehicle == 'object') vehicle = vehicle._id;

            let vehicleExists;
            if (session) vehicleExists = await Vehicle.findOne({ _id: vehicle, rider: this._id }).session(session);
            else vehicleExists = await Vehicle.findOne({ _id: vehicle, rider: this._id });

            if (!vehicleExists) throw new Error("Vehicle doesn't belong to rider");

            if (!this.defaultVehicle) {
                this.defaultVehicle = vehicle;
                this.currentVehicle = vehicle;
            }

            this.vehicles.push(vehicle);

            if (session) {
                await this.save({ session }).then((rider) => resolve(rider)).catch((error) => reject(error));
            } else {
                await this.save().then((rider) => resolve(rider)).catch((error) => reject(error));
            }
        } catch (error) {
            reject(error)
        }
    })
}

riderSchema.methods.goOnline = function (vehicle_id = null) {
    return new Promise((resolve, reject) => {
        try {
            console.log(this)
            this.isOnline = true; // set rider to online

            // Check if rider owns vehicle
            this.populate('vehicles')
            const vehicle = this.vehicles.find((vehicle) => vehicle._id == vehicle_id);
            if (!vehicle) throw new Error("Vehicle doesn't belong to rider");

            // Set current vehicle
            this.depopulate('currentVehicle defaultVehicle');
            this.currentVehicle = vehicle_id || this.currentVehicle || this.defaultVehicle;

            this.save()
                .then((rider) => resolve(rider)).catch((error) => reject(error));
        } catch (error) {
            reject(error)
        }
    })
}

riderSchema.methods.goOffline = function () {
    return new Promise((resolve, reject) => {
        try {
            this.isOnline = false; // set rider to offline

            this.save().then((rider) => resolve(rider)).catch((error) => reject(error));
        } catch (error) {
            reject(error)
        }
    })
}

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
