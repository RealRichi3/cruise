const {
    BadRequestError,
    UnauthenticatedError,
    UnauthorizedError,
} = require('../utils/custom_errors')
const jwt = require('jsonwebtoken')

// Models
const { BlacklistedToken, Token } = require('../models/token.model')
const { User } = require('../models/users.model')
const Password = require('../models/password.model')

// Utils
const config = require('../utils/config')
const { asyncWrapper } = require('../utils/async_wrapper')
const { sendEmail } = require('../utils/email')

const enduserSignup = asyncWrapper(async (req, res, next) => {})

const riderSignup = asyncWrapper(async (req, res, next) => {})

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

