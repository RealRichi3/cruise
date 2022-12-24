const { User } = require('../models/entity')
const { AuthCode } = require('../models/token')
const asyncWrapper = require('./async_wrapper')
const { NotFoundError } = require('./custom_errors')
const jwt = require('jsonwebtoken')
const config = require('./config')
const { v4: UUID } = require('uuid')

const getAuthTokens = async (user_id) => {
    try {
        const current_user = await User.findById(user_id).populate('status')

        if (!current_user) {
            throw new NotFoundError('User does not exist')
        }

        const data = {
            id: current_user.id,
            email: current_user.email,
            role: current_user.role,
            status: current_user.status,
        }

        if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
            config.JWT_ACCESS_EXP = '6h'
            config.JWT_REFRESH_EXP = '6h'
        }

        const access_token = jwt.sign(data, config.JWT_ACCESS_SECRET, {
            expiresIn: config.JWT_ACCESS_EXP,
        })
        const refresh_token = jwt.sign(data, config.JWT_REFRESH_SECRET, {
            expiresIn: config.JWT_REFRESH_EXP,
        })

        return { access_token, refresh_token }
    } catch (error) {
        throw error
    }
}

const getAuthCodes = async (user_id, code_type) => {
    try {
        let random_code = `${Math.floor(100000 + Math.random() * 900000)}`
        let verification_code, password_reset_code, activation_code

        if (code_type == 'verification') {
            verification_code = random_code
            await AuthCode.findOneAndUpdate(
                { user: user_id },
                { verification_code }
            )
        }

        if (code_type == 'password_reset') {
            password_reset_code = random_code
            await AuthCode.findOneAndUpdate(
                { user: user_id },
                { password_reset_code }
            )
        }

        if (code_type == 'activation') {
            activation_code = UUID()
            await AuthCode.findOneAndUpdate({ user: user_id }, { activation_code })
        }

        return { verification_code, password_reset_code, activation_code }
    } catch (error) {
        throw error
    }
}

const decodeJWT = (token) => {
    try {
        const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET)
        return decoded
    } catch (error) {
        throw error
    }
}

module.exports = { getAuthTokens, getAuthCodes, decodeJWT }
