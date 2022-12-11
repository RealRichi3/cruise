const { BadRequestError } = require('../utils/custom_errors')

const mongoose = require('mongoose'),
    bcrypt = require('bcryptjs'),
    schema = mongoose.Schema,
    UU = require('uuid').v4

const invoiceSchema = new schema({
    user: { type: schema.Types.ObjectId, ref: 'User', required: true },
    invoiceId: { type: UU, required: true },
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
})

const receiptSchema = new schema({
    user: { type: schema.Types.ObjectId, ref: 'User', required: true },
    rider: { type: schema.Types.ObjectId, ref: 'Rider' },
    ride: { type: schema.Types.ObjectId, ref: 'Ride' },
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
    reference: { type: UU, required: true },
    createdAt: { type: Date, default: Date.now },
})

const transactionsSchema = new schema(
    {
        amount: { type: Number, required: true },
        type: {
            type: String,
            required: true,
            enum: ['wallet_topup', 'book_ride', 'wallet_withdrawal'],
        },
        user: { type: schema.Types.ObjectId, ref: 'User', required: true },
        receipt: {
            type: schema.Types.ObjectId,
            ref: 'Receipt',
            required: true,
        },
        invoice: {
            type: schema.Types.ObjectId,
            ref: 'Invoice',
            required: true,
        },
        status: {
            type: String,
            required: true,
            default: 'pending',
            enum: ['pending', 'success', 'failed'],
        },
    },
    { timestamps: true }
)

receiptSchema.pre('save', async function (next) {
    const receipt = await this.populate('transaction').execPopulate()

    if (receipt.transaction.status != 'success') {
        throw new BadRequestError('Receipt transaction is not successful')
    }

    if (receipt.transaction.type != receipt.type) {
        throw new BadRequestError('Receipt transaction type does not match')
    }

    if (receipt.transaction.amount != receipt.amount) {
        throw new BadRequestError('Receipt transaction amount does not match')
    }

    if (receipt.transaction.user != receipt.user) {
        throw new BadRequestError('Receipt transaction user does not match')
    }

    if (receipt.type == 'wallet_topup') {
        if (receipt.ride) {
            throw new BadRequestError('Receipt type is wallet_topup')
        }
    }

    if (receipt.type == 'book_ride') {
        if (!receipt.ride) { throw new BadRequestError('Please specify Ride id') }
        if (!receipt.rider) { throw new BadRequestError('Please specify Rider id') }
    }

    next()
})

const Invoice = mongoose.model('Invoice', invoiceSchema)
const Receipt = mongoose.model('Receipt', receiptSchema)
const Transaction = mongoose.model('Transaction', transactionsSchema)

module.exports = { Invoice, Receipt, Transaction }
