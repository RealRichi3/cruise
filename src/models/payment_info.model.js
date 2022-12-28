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

const paymentInfoSchema = new schema(
    {
        user: { type: schema.Types.ObjectId, ref: 'User', required: true },
        rider: { type: schema.Types.ObjectId, ref: 'Rider' },
        cards: [{ type: schema.Types.ObjectId, ref: 'Card' }],
        bank_accounts: [{ type: schema.Types.ObjectId, ref: 'BankAccount' }],
        wallet: { type: schema.Types.ObjectId, ref: 'Wallet' },
    },
    { timestamps: true }
);

const Card = mongoose.model('Card', cardSchema);
const BankAccount = mongoose.model('BankAccount', bankAccountSchema);
const PaymentInfo = mongoose.model('PaymentInfo', paymentInfoSchema);
const Wallet = mongoose.model('Wallet', walletSchema);
const WithdrawalRequest = mongoose.model(
    'WithdrawalRequest',
    withdrawalRequestSchema
);

module.exports = {
    Card,
    BankAccount,
    PaymentInfo,
    Wallet,
    WithdrawalRequest,
};
