const  asyncWrapper  = require('../utils/async_wrapper')
const {
    CustomAPIError,
    BadRequestError,
    UnauthenticatedError,
} = require('../utils/custom_errors')
const jwt = require('jsonwebtoken')
const { BlacklistedToken } = require('../models/token.model')

const config = require('../utils/config')

/**
 * Middleware to check if the request has a valid authorization header
 * and if the token is valid
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @returns {Promise<void>}
 * @throws {BadRequestError} if the request has an invalid authorization header
 * @throws {UnauthenticatedError} if the token is invalid
 * @throws {UnauthenticatedError} if the token has been blacklisted
 * @throws {UnauthenticatedError} if the user's account is not active
 *
 */
const basicAuth = async (req, res, next) => {
    // Check if the request has a valid authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new BadRequestError('Invalid authorization header')
    }

    // Verify the token
    const jwtToken = authHeader.split(' ')[1],
        payload = jwt.verify(jwtToken, config.JWT_SECRET)
    req.user = payload

    // Check if access token has been blacklisted
    const blacklisted = await BlacklistedToken.findOne({ token: jwtToken })
    if (blacklisted) {
        throw new UnauthenticatedError('JWT token expired')
    }

    // To get new access token
    if (req.method == 'GET' && req.path == '/authtoken') {
        const new_access_token = (await getAuthTokens(payload.id)).access_token

        return res
            .status(200)
            .send({ message: 'success', access_token: new_access_token })
    }

    if (!req.user.status.isActive) {
        throw new UnauthenticatedError(
            'Unauthorized access, users account is not active'
        )
    }

    // If all is well, proceed to the next middleware
    next()
}

module.exports = {
    basicAuth,
}
