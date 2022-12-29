const mongoose = require('mongoose'),
    bcrypt = require('bcryptjs'),
    schema = mongoose.Schema,
    UU = require('uuid').v4;

const invoiceSchema = new schema({
    user: { type: schema.Types.ObjectId, ref: 'User', required: true },
    invoice_id: { type: String, required: true, default: UU },
    amount: { type: Number, required: true },
    type: {
        type: String,
        required: true,
        enum: ['wallet_topup', 'book_ride', 'wallet_withdrawal'],
    },
    transaction: {
        type: schema.Types.ObjectId,
        ref: 'Transaction',
        required: true,
    },
    date: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
});

const receiptSchema = new schema({
    user: { type: schema.Types.ObjectId, ref: 'User', required: true },
    rider: { type: schema.Types.ObjectId, ref: 'Rider' },
    enduser: { type: schema.Types.ObjectId, ref: 'EndUser' },
    ride: { type: schema.Types.ObjectId, ref: 'Ride' },
    amount: { type: Number, required: true },
    transaction: {
        type: schema.Types.ObjectId,
        ref: 'Transaction',
        required: true,
    },
    type: {
        type: String,
        enum: ['wallet_topup', 'book_ride', 'wallet_withdrawal'],
    },
    reference: { type: String, required: true, default: UU },
    createdAt: { type: Date, default: Date.now },
    date: { type: Date, default: Date.now },
});

const transactionsSchema = new schema(
    {
        amount: { type: Number, required: true },
        type: {
            type: String,
            required: true,
            enum: ['wallet_topup', 'book_ride', 'wallet_withdrawal'],
        },
        user: { type: schema.Types.ObjectId, ref: 'User', required: true },
        rider: { type: schema.Types.ObjectId, ref: 'Rider' },
        enduser: { type: schema.Types.ObjectId, ref: 'EndUser' },
        ride: { type: schema.Types.ObjectId, ref: 'Ride' },
        // Receipt is only required if transaction status is success
        receipt: {
            type: schema.Types.ObjectId,
            ref: 'Receipt',
            // required: true,
        },
        ride: { type: schema.Types.ObjectId, ref: 'Ride' },
        invoice: {
            type: schema.Types.ObjectId,
            ref: 'Invoice',
            required: true,
        },
        payment_method: {
            type: String,
            required: true,
            enum: ['ussd', 'card', 'bank_transfer'],
        },
        type: {
            type: String,
            required: true,
            enum: ['wallet_topup', 'book_ride', 'wallet_withdrawal'],
        },
        status: {
            type: String,
            required: true,
            default: 'pending',
            enum: ['pending', 'success', 'failed'],
        },
        reference: { type: String, default: UU },
        reflected: { type: Boolean, default: false }, // If transaction has been reflected in user's wallet
        date: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

transactionsSchema.pre('validate', async function (next) {
    return new Promise(async (resolve, reject) => {
        if (this.status == 'success') {
            // There should be a receipt if status is success
            if (!this.receipt) {
                reject('Please specify receipt id');
            }
            if (!this.invoice) {
                reject(new 'Please specify invoice id'());
            }
        }

        resolve();
    });
});

transactionsSchema.methods.generateReceipt = async function () {
    if (this.status != 'success')
        throw new Error('Transaction is not successful');

    const receipt = new Receipt({
        user: this.user,
        amount: this.amount,
        transaction: this._id,
        type: this.type,
    });

    if (this.type == 'book_ride') {
        receipt.ride = this.ride;
        receipt.rider = this.rider;
    }

    if (this.type == 'wallet_topup') {
        receipt.enduser = this.enduser;
    }

    await receipt.save();

    this.receipt = receipt._id;

    await this.save();
    
    return receipt;
};

const Invoice = mongoose.model('Invoice', invoiceSchema);
const Receipt = mongoose.model('Receipt', receiptSchema);
const Transaction = mongoose.model('Transaction', transactionsSchema);

module.exports = { Invoice, Receipt, Transaction };
