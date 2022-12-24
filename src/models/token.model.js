const mongoose = require('mongoose')
const schema = mongoose.Schema
const { JWT_REFRESH_EXPIRES_IN } = require('../utils/config')

const blacklistedTokenSchema = new schema(
    {
        token: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
    },
    { timestamps: true, expires: JWT_REFRESH_EXPIRES_IN }
)

const authCodesSchema = new schema(
    {
        user: { type: schema.Types.ObjectId, ref: 'User', required: true },
        verification_code: { type: String },
        password_reset_code: { type: String },
        createdAt: { type: Date, default: Date.now },
    },
    { timestamps: true, expires: JWT_REFRESH_EXPIRES_IN }
)

const AuthCode = mongoose.model('AuthCode', tokenSchema)

const BlacklistedToken = mongoose.model(
    'BlacklistedToken',
    blacklistedTokenSchema
)

module.exports = { BlacklistedToken, AuthCode }
