const mongoose = require('mongoose')
const schema = mongoose.Schema

const walletSchema = new schema(
    {
        balance: { type: Number, required: true, default: 0 },
        user: { type: schema.Types.ObjectId, ref: 'User', required: true },
        transactions: [{ type: schema.Types.ObjectId, ref: 'Transaction' }],
        withdrawal_requests: [
            { type: schema.Types.ObjectId, ref: 'WithdrawalRequest' },
        ],
    },
    { timestamps: true }
)

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
})

const Wallet = mongoose.model('Wallet', walletSchema)
const WithdrawalRequest = mongoose.model(
    'WithdrawalRequest',
    withdrawalRequestSchema
)

module.exports = { Wallet, WithdrawalRequest }
