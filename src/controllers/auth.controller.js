const {
    BadRequestError,
    UnauthenticatedError,
    UnauthorizedError,
} = require('../utils/custom_errors');
const jwt = require('jsonwebtoken');

// Models
const { BlacklistedToken, AuthCode } = require('../models/token.model');
const { User, Status } = require('../models/users.model');
const Password = require('../models/password.model');

// Utils
const config = require('../utils/config');
const asyncWrapper = require('../utils/async_wrapper');
const sendEmail = require('../utils/email');
const { getAuthCodes, getAuthTokens } = require('../utils/token');

/**
 * Handle existing unverified user
 * Sends new verification email to user
 * @param {MongooseObject} user - Mongoose user object
 * @returns {string} access_token, refresh_token - JWT tokens
 */
const handleExistingUnverifiedUser = async function (user) {
    return new Promise(async (resolve, reject) => {
        try {
            // Get verification code
            const { verification_code } = await getAuthCodes(
                user.id,
                'verification'
            );

            // Send verification email
            sendEmail({
                email: user.email,
                subject: 'Account Verification',
                message: 'This is your verification code: ' + verification_code,
            });

            // Get access token
            const { access_token } = await getAuthTokens(user._id);

            resolve({ access_token });
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Enduser signup
 * @description - Creates a new enduser
 * @route POST /api/v1/auth/signup
 * @access Public
 * @param {string} firstname - Firstname of user
 * @param {string} lastname - Lastname of user
 * @param {string} email - Email of user
 * @param {string} password - Password of user
 * @returns {string} success - Success message
 * @returns {string} data - Data object
 * @returns {string} data.access_token - JWT access token
 * @returns {string} data.refresh_token - JWT refresh token
 * @returns {string} access_token, refresh_token - JWT tokens
 * @throws {BadRequestError} - If user already exists
 * @throws {BadRequestError} - If user already exists and is verified
 */
const enduserSignup = asyncWrapper(async (req, res, next) => {
    const { firstname, lastname, email, password } = req.body;

    const existing_user = await User.findOne({ email }).populate('status');
    // console.log(existing_user?.toJSON({ virtuals: true }))

    if (existing_user) {
        // If user is not verified - send verification email
        if (!existing_user.status.isVerified) {
            const { access_token, refresh_token } =
                await handleExistingUnverifiedUser(existing_user);

            return res
                .status(200)
                .json({ success: true, data: { access_token, refresh_token } });
        }

        throw new BadRequestError('User already exists');
    }

    // Create user
    const user = await User.create({
        firstname,
        lastname,
        email,
        role: 'enduser',
    });
    await Password.create({ password, user: user._id });
    await Status.create({ user: user._id, isActive: true });
    await AuthCode.create({ user: user._id });

    // Send verification email
    const { verification_code } = await getAuthCodes(user._id, 'verification');
    sendEmail({
        email: user.email,
        subject: 'Account Verification',
        message: 'This is your verification code: ' + verification_code,
    });

    // Get auth tokens
    const { access_token, refresh_token } = await getAuthTokens(user._id);

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
            },
        },
    });
});

const riderSignup = asyncWrapper(async (req, res, next) => {
    const { firstname, lastname, email, password } = req.body;

    // Check if user already exists
});

const adminSignup = asyncWrapper(async (req, res, next) => {});

const verifyEmail = asyncWrapper(async (req, res, next) => {
    const { email, verification_code } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).populate('status');
    console.log(user.toJSON({ virtuals: true }));
    if (!user) throw new BadRequestError('User does not exist');

    // Check if user is verified
    if (user.status.isVerified)
        throw new BadRequestError('User is already verified');

    // Check if verification code is valid
    const auth_code = await AuthCode.findOne({
        user: user._id,
        verification_code,
    });
    console.log(auth_code);
    if (!auth_code) throw new BadRequestError('Invalid verification code');

    // Verify user
    await user.status.updateOne({ isVerified: true });

    res.status(200).json({ success: true, data: {} });
});

/**
 * Resend verification email to user
 * @description - Resends verification email to user
 * @route POST /api/v1/auth/resend-verification-email
 * @access Public
 * @param {string} email - Email of user
 * @returns {string} success - Success message
 * @throws {BadRequestError} - If user does not exist
 * @throws {BadRequestError} - If user is already verified
 * @returns {string} data - Data object
 * @returns {string} data.access_token - JWT access token
 */
const resendVerificationEmail = asyncWrapper(async (req, res, next) => {
    const email = req.params.email;
    console.log(email);
    const user = await User.findOne({ email }).populate('status');

    if (!user) {
        throw new BadRequestError('User does not exist');
    }

    if (user.status.isVerified) {
        throw new BadRequestError('User is already verified');
    }

    const { access_token } = await handleExistingUnverifiedUser(user);

    res.status(200).json({ success: true, data: { access_token } });
});

const login = asyncWrapper(async (req, res, next) => {});

const logout = asyncWrapper(async (req, res, next) => {});

const forgotPassword = asyncWrapper(async (req, res, next) => {});

const resetPassword = asyncWrapper(async (req, res, next) => {});

const getLoggedInUserData = asyncWrapper(async (req, res, next) => {});

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
};
