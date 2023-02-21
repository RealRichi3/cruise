const mongoose = require('mongoose');
const schema = mongoose.Schema;
const withdrawalRequestSchema = new schema({
    rider: { type: schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'approved', 'declined'],
        default: 'pending',
    },
    transaction: { type: schema.Types.ObjectId, ref: 'Transaction' },
    createdAt: { type: Date, default: Date.now },
});

const walletSchema = new schema(
    {
        balance: { type: Number, required: true, default: 0 },
        user: { type: schema.Types.ObjectId, ref: 'User', required: true },
        enduser: { type: schema.Types.ObjectId, ref: 'EndUser' },
        rider: { type: schema.Types.ObjectId, ref: 'Rider' },
        transactions: [{ type: schema.Types.ObjectId, ref: 'Transaction' }],
        withdrawal_requests: [
            { type: schema.Types.ObjectId, ref: 'WithdrawalRequest' },
        ],
    },
    { timestamps: true }
);

const bankAccountSchema = new schema({
    user: { type: schema.Types.ObjectId, ref: 'User', required: true },
    rider: { type: schema.Types.ObjectId, ref: 'Rider', required: true },
    account_name: { type: String, required: true },
    account_number: { type: String, required: true },
    bank_name: { type: String, required: true },
});

const dedicatedVirtualAccountSchema = new schema({
    user: { type: schema.Types.ObjectId, ref: 'User', required: true },
    rider: { type: schema.Types.ObjectId, ref: 'rider', required: true, unique: true },
    customer_code: { type: schema.Types.String, /*required: true */ },
    customer_id: { type: schema.Types.String, /*required: true */ },
    bankname: { type: schema.Types.String, /* requird: true */ },
    bankid: { type: schema.Types.Number, /* required: true */ },
    account_name: { type: schema.Types.String, /* required: true */ },
    account_number: { type: schema.Types.Number, /* required: true */ },
    currency: { type: schema.Types.String, default: 'NGN' },
    customer_code: { type: schema.Types.String, required: true }
})

const cardSchema = new schema({
    user: { type: schema.Types.ObjectId, ref: 'User', required: true },
    enduser: { type: schema.Types.ObjectId, ref: 'EndUser', required: true },
    first_four_numbers: { type: String, required: true },
    middle_numbers: { type: String, required: true }, // Encrypted
    last_four_numbers: { type: String, required: true },
    card_name: { type: String, required: true },
    expiry_date: { type: String, required: true },
    cvv: { type: String, required: true },
});

dedicatedVirtualAccountSchema.virtual('transactions', {
    ref: 'Transaction',
    localField: '_id',
    foreignField: 'user',
    jsutOne: true,
})

const Card = mongoose.model('Card', cardSchema);
const BankAccount = mongoose.model('BankAccount', bankAccountSchema);
const Wallet = mongoose.model('Wallet', walletSchema);
const WithdrawalRequest = mongoose.model(
    'WithdrawalRequest',
    withdrawalRequestSchema
);
const DedicatedVirtualAccount = mongoose.model('DedicatedVirtualAccoun', dedicatedVirtualAccountSchema)

module.exports = {
    Card,
    BankAccount,
    Wallet,
    WithdrawalRequest,
    DedicatedVirtualAccount
};
