const { default: mongoose } = require('mongoose')
const schema = mongoose.Schema

const userSchema = new schema(
    {
        firstname: { type: String, required: true },
        lastname: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        role: {
            type: String,
            required: true,
            default: 'user',
            enum: ['enduser', 'rider', 'admin', 'superadmin'],
        },
        account_status: {
            type: String,
            required: true,
            default: 'active',
            enum: ['active', 'inactive', 'suspended'],
        },
        password: {
            type: schema.Types.ObjectId,
            ref: 'Password',
            required: true,
        },
    },
    { timestamps: true }
)

const enduserSchema = new schema(
    {
        user: { type: schema.Types.ObjectId, ref: 'User', required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        account_details: {
            type: schema.Types.ObjectId,
            ref: 'PaymentDetails',
            required: true,
        },
        wallet: {
            type: schema.Types.ObjectId,
            ref: 'Wallet',
            required: true,
        },
    },
    { timestamps: true }
)

const riderSchema = new schema(
    {
        user: { type: schema.Types.ObjectId, ref: 'User', required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        account_details: {
            type: schema.Types.ObjectId,
            ref: 'PaymentDetails',
            required: true,
        },
        wallet: {
            type: schema.Types.ObjectId,
            ref: 'Wallet',
            required: true,
        },
        vehicle: {
            type: schema.Types.ObjectId,
            ref: 'Vehicle',
            required: true,
        },
        driver_license: {
            type: schema.Types.ObjectId,
            ref: 'DriverLicense',
            required: true,
        },
        rider_status: {
            type: String,
            required: true,
            default: 'active',
            enum: ['active', 'inactive', 'suspended'],
        },
    },
    { timestamps: true }
)
