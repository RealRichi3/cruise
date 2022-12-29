const mongoose = require('mongoose');
const schema = mongoose.Schema;
const { Enduser, Rider, User } = require('./users.model');

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
        enduser: { type: schema.Types.ObjectId, ref: 'EndUser' },
        rider: { type: schema.Types.ObjectId, ref: 'Rider' },
        cards: [{ type: schema.Types.ObjectId, ref: 'Card' }],
        bank_accounts: [{ type: schema.Types.ObjectId, ref: 'BankAccount' }],
        wallet: { type: schema.Types.ObjectId, ref: 'Wallet' },
    },
    { timestamps: true }
);

paymentInfoSchema.pre('save', async function (next) {
    console.log('here')
    const curr = await this.model('PaymentInfo').findOne({ _id: this._id }).populate('user');

    console.log(curr)

    if (this.isNew) {
        if (curr.user.role === 'enduser' && !this.enduser) {
            throw new mongoose.MongooseError('Enduser is required');
        }

        if (curr.user.role === 'rider' && !this.rider) {
            throw new mongoose.MongooseError('Rider is required');
        }

        if (curr.user.role === 'admin') {
            throw new mongoose.MongooseError('Admin cannot have payment info');
        }

        if (curr.user.role === 'enduser' && this.rider) {
            throw new mongoose.MongooseError('Enduser cannot have rider');
        }

        if (curr.user.role === 'rider' && this.enduser) {
            throw new mongoose.MongooseError('Rider cannot have enduser');
        }

        if (curr.user.role === 'rider' && this.wallet) {
            throw new mongoose.MongooseError('Enduser cannot have wallet');
        }

        if (curr.user.role === 'enduser' && !this.wallet) {
            // Link a wallet for the enduser
            if (curr.enduser) this.wallet = curr.enduser.wallet;
            else throw new mongoose.MongooseError('Enduser must have wallet');
        }

        // this.save();
    }

    next();
});

paymentInfoSchema.pre('save', async function (next) {
    // const curr = this.populate('user');

    // if (this.isNew()) {
    //     if (curr.user.role === 'enduser') {
    //         // Link a wallet for the enduser

    //         // Wallet only belongs to enduser
    //         const wallet = new Wallet({ user: curr.user._id });
    //         const enduser = await Enduser.findOne({ user: curr.user._id });

    //         // Wallet enduser one to one relationship
    //         enduser.wallet = wallet._id;
    //         wallet.enduser = enduser._id;

    //         // Payment info one to one relationship with wallet
    //         this.wallet = wallet._id;
    //         this.enduser = enduser._id;

    //         await enduser.save();
    //         await wallet.save();
    //     }

    //     if (curr.user.role === 'rider') {
    //         this.rider = curr.user._id;
    //     }
    // }

    next();
});
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
