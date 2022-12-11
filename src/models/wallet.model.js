const mongoose = require('mongoose')
const schema = mongoose.Schema

const walletSchema = new schema({
    balance: { type: Number, required: true, default: 0 },
    user: { type: schema.Types.ObjectId, ref: 'User', required: true },
    transactions: [{ type: schema.Types.ObjectId, ref: 'Transaction' }],
})

const Wallet = mongoose.model('Wallet', walletSchema)

module.exports = Wallet
