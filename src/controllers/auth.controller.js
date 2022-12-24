const {
    BadRequestError,
    UnauthenticatedError,
    UnauthorizedError,
} = require('../utils/custom_errors')
const jwt = require('jsonwebtoken')

// Models
const { BlacklistedToken, AuthCode } = require('../models/token.model')
const { User, Status } = require('../models/users.model')
const Password = require('../models/password.model')

// Utils
const config = require('../utils/config')
const asyncWrapper = require('../utils/async_wrapper')
const sendEmail = require('../utils/email')
const { getAuthCodes, getAuthTokens } = require('../utils/token')

/**
 * Handle existing unverified user
 * Sends new verification email to user
 * @param {MongooseObject} user - Mongoose user object
 * @returns {string} access_token, refresh_token - JWT tokens
 */
const handleExistingUnverifiedUser = async (user) => {
    // Send verification email
    const { verification_code } = await getAuthCodes(user._id, 'verification')
    sendEmail({
        email: user.email,
        subject: 'Account Verification',
        message: 'This is your verification code: ' + verification_code,
    })

    // Get auth tokens
    const { access_token, refresh_token } = await getAuthTokens(user._id)

    return { access_token, refresh_token }
}

const enduserSignup = asyncWrapper(async (req, res, next) => {
    const { firstname, lastname, email, password } = req.body

    // Check if user already exists
    const existing_user = await User.findOne({ email }).populate('status')
    console.log(existing_user)
    console.log(existing_user?.toJSON({ virtuals: true}))
    if (existing_user) {
        if (!existing_user.status.isVerified) {
            const { access_token, refresh_token } =
                handleExistingUnverifiedUser(existing_user)
            return res
                .status(200)
                .json({ success: true, data: { access_token, refresh_token } })
        }

        throw new BadRequestError('User already exists')
    }

    // Create user
    const user = await User.create({
        firstname,
        lastname,
        email,
        role: 'enduser',
    })
    const user_password = await Password.create({ password, user: user._id })
    const user_status = await Status.create({ user: user._id, isActive: true })
    console.log(user.populate('status'))
    console.log(user_password)
    console.log(user_status)

    // Send verification email
    const { verification_code } = await getAuthCodes(user._id, 'verification')
    sendEmail({
        email: user.email,
        subject: 'Account Verification',
        message: 'This is your verification code: ' + verification_code,
    })

    // Get auth tokens
    const { access_token, refresh_token } = await getAuthTokens(user._id)

    res.status(201).json({
        success: true,
        data: {
            access_token,
            refresh_token,
            user: {
                id: user._id,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                role: user.role,
                status: user.status,
            },
        },
    })
})

const riderSignup = asyncWrapper(async (req, res, next) => {
    const { firstname, lastname, email, password } = req.body

    // Check if user already exists
})

const adminSignup = asyncWrapper(async (req, res, next) => {})

const login = asyncWrapper(async (req, res, next) => {})

const logout = asyncWrapper(async (req, res, next) => {})

const forgotPassword = asyncWrapper(async (req, res, next) => {})

const resetPassword = asyncWrapper(async (req, res, next) => {})

const verifyEmail = asyncWrapper(async (req, res, next) => {})

const resendVerificationEmail = asyncWrapper(async (req, res, next) => {})

const getLoggedInUserData = asyncWrapper(async (req, res, next) => {})

module.exports = {
    enduserSignup,
    riderSignup,
    adminSignup,
    login,
    logout,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerificationEmail,
    getLoggedInUserData,
}
