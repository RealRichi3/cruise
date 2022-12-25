const {
    BadRequestError,
    UnauthenticatedError,
    UnauthorizedError,
} = require('../utils/custom_errors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('express-async-error');

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
 * Handle existing unverified user.
 * it sends new verification email to user
 * @param {MongooseObject} user - Mongoose user object
 * @returns {string} access_token, refresh_token - JWT tokens
 */
const handleUnverifiedUser = async function (user) {
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
            const { access_token } = await getAuthTokens(
                user._id,
                'verification'
            );

            resolve({ access_token });
        } catch (error) {
            reject(error);
        }
    });
};

const handleUnverifiedSuperAdmin = async function (user) {
    return new Promise(async (resolve, reject) => {
        try {
            // Get verification code
            const { activation_code1, activation_code2, activation_code3 } = await getAuthCodes(
                user.id,
                'su_activation'
            );

            // Send first activation code to new user
            sendEmail({
                email: user.email,
                subject: 'Account Verification',
                message: 'This is your activation code: ' + activation_code1,
            });

            // Send second activation code to first admin
            sendEmail({
                email: config.SUPER_ADMIN_EMAIL1,
                subject: 'Account Verification for new superadmin',
                message: `New superadmin account creation for ${user.email}. This is your activation code: ${activation_code2}`,
            });

            // Send third activation code to second admin
            sendEmail({
                email: config.SUPER_ADMIN_EMAIL2,
                subject: 'Account Verification for new superadmin',
                message: `New superadmin account creation for ${user.email}. This is your activation code: ${activation_code3}`,
            });

            // Get access token
            const { access_token } = await getAuthTokens(
                user._id,
                'verification'
            );
                
            resolve({ access_token });
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Enduser signup
 * @description - Creates a new enduser
 * @route POST /api/v1/auth/signup/enduser
 * @access Public
 *
 * @param {string} firstname - Firstname of user
 * @param {string} lastname - Lastname of user
 * @param {string} email - Email of user
 * @param {string} password - Password of user
 *
 * @returns {string} success - Success message
 * @returns {string} data - Data object
 * @returns {string} data.access_token - JWT access token
 * @returns {string} data.refresh_token - JWT refresh token
 * @returns {string} access_token, refresh_token - JWT tokens
 *
 * @throws {BadRequestError} - If user already exists
 * @throws {BadRequestError} - If user already exists and is verified
 */
const enduserSignup = async (req, res, next) => {
    const { firstname, lastname, email, password } = req.body;

    const existing_user = await User.findOne({ email }).populate('status');
    // console.log(existing_user?.toJSON({ virtuals: true }))

    if (existing_user) {
        // If user is not verified - send verification email
        if (!existing_user.status.isVerified) {
            const { access_token } =
                await handleUnverifiedUser(existing_user);

            return res
                .status(200)
                .json({ success: true, data: { access_token} });
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
    const { access_token } = await getAuthTokens(user._id);

    res.status(201).json({
        success: true,
        data: {
            access_token,
            user: {
                id: user._id,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
            },
        },
    });
};

const riderSignup = async (req, res, next) => {
    const { firstname, lastname, email, password } = req.body;

    // Check if user already exists
};

/**
 * Email verification
 * @description - Verifies user email
 * @route POST /api/v1/auth/verifyemail
 * @access Private
 *
 * @param {string} email - Email of user
 * @param {string} verification_code - Verification code
 *
 * @returns {string} success - Success message
 * @returns {string} data - Data object
 *
 * @throws {BadRequestError} - If user does not exist
 * @throws {BadRequestError} - If user is already verified
 * @throws {BadRequestError} - If verification code is invalid
 */
const verifyEmail = async (req, res, next) => {
    const { email, verification_code } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).populate('status');
    // console.log(user.toJSON({ virtuals: true }));

    if (!user) throw new BadRequestError('User does not exist');

    // Check if user is verified
    if (user.status.isVerified)
        throw new BadRequestError('User is already verified');

    // Check if verification code is valid
    const auth_code = await AuthCode.findOne({
        user: user._id,
        verification_code,
    });
    // console.log(auth_code);
    if (!auth_code) throw new BadRequestError('Invalid verification code');

    // Remove verification code
    auth_code.updateOne({ verification_code: null });

    // Verify user
    await user.status.updateOne({ isVerified: true });

    res.status(200).json({ success: true, data: {} });
};

/**
 * Resend verification email to user
 * @description - Resends verification email to user
 * @route GET /api/v1/auth/verifyemail
 * @access Public
 *
 * @param {string} email - Email of user
 *
 * @returns {string} success - Success message
 * @returns {string} data - Data object
 * @returns {string} data.access_token - JWT access token
 *
 * @throws {BadRequestError} - If user does not exist
 * @throws {BadRequestError} - If user is already verified
 */
const resendVerificationEmail = async (req, res, next) => {
    const email = req.params.email;
    console.log(email);
    const user = await User.findOne({ email }).populate('status');

    if (!user) {
        throw new BadRequestError('User does not exist');
    }

    if (user.status.isVerified) {
        throw new BadRequestError('User is already verified');
    }

    const { access_token } = await handleUnverifiedUser(
        user,
        config.EMAIL_VERIFICATION_EXP
    );

    res.status(200).json({ success: true, data: { access_token } });
};

/**
 * Login
 * @description - Logs in user
 * @route POST /api/v1/auth/login
 * @access Public
 *
 * @param {string} email - Email of user
 * @param {string} password - Password of user
 *
 * @returns {string} success - Success message
 * @returns {string} data - Data object
 * @returns {string} data.access_token - JWT access token
 * @returns {string} data.refresh_token - JWT refresh token
 *
 * @throws {BadRequestError} - If user does not exist
 * @throws {BadRequestError} - If user is not verified
 * @throws {BadRequestError} - If user is not active
 * @throws {BadRequestError} - If password is incorrect
 */
const login = async (req, res, next) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate('status password');

    // Check if user exists
    if (!user) return next(new BadRequestError('User does not exist'));

    // Check if user is verified
    if (!user.status.isVerified)
        return next(new BadRequestError('User is not verified'));

    // Check if user is active
    if (!user.status.isActive)
        return next(new BadRequestError('User is not active'));

    // Check if password is correct
    const password_match = await bcrypt.compare(
        password,
        user.password.password
    );
    if (!password_match) return next(new BadRequestError('Invalid password'));

    // Get auth tokens
    const { access_token, refresh_token } = await getAuthTokens(user._id);

    res.status(200).json({
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
};

/**
 * Logout user
 * @description - Logs out user
 * @route POST /api/v1/auth/logout
 * @access Private
 *
 * @param {string} refresh_token - Refresh token
 *
 * @returns {string} success - Success message
 * @returns {string} data - Data object
 *
 * @throws {BadRequestError} - If refresh token is not provided
 * @throws {BadRequestError} - If access token is not provided
 */
const logout = async (req, res, next) => {
    const { refresh_token } = req.body;

    // Get access token from header
    const access_token = req.headers.authorization.split(' ')[1];

    // Check if refresh token exists
    if (!refresh_token) throw new BadRequestError('Refresh token is required');

    // Check if access token exists
    if (!access_token) throw new BadRequestError('Access token is required');

    // Blacklist jwt tokens
    BlacklistedToken.create({ token: access_token });
    BlacklistedToken.create({ token: refresh_token });

    res.status(200).json({ success: true, data: {} });
};

/**
 * Forgot password
 * @description - Sends password reset code to user
 * @route POST /api/v1/auth/forgotpassword
 * @access Public
 *
 * @param {string} email - Email of user
 *
 * @returns {string} success - Success message
 * @returns {string} data - Data object
 * @returns {string} data.access_token - JWT access token
 *
 * @throws {BadRequestError} - If user does not exist
 * */
const forgotPassword = async (req, res, next) => {
    const { email } = req.body;

    const user = await User.findOne({ email }).populate('status');

    // Check if user exists
    if (!user) throw new BadRequestError('User does not exist');

    // Generate password reset code
    const password_reset_code = await getAuthCodes(user._id, 'password_reset');

    // Send password reset email
    sendEmail({
        email: user.email,
        subject: 'Password Reset',
        text: `Your password reset code is ${password_reset_code}`,
    });

    // Get auth tokens
    const { access_token } = await getAuthTokens(user._id, 'password_reset');

    res.status(200).json({
        success: true,
        message: 'Password reset code sent to users email',
        data: { access_token },
    });
};

/**
 * Reset password
 * @description - Resets user password
 * @route PATCH /api/v1/auth/resetpassword
 * @access Private
 *
 * @param {string} password_reset_code - Password reset code
 * @param {string} new_password - New password
 *
 * @returns {string} success - Success message
 * @returns {string} data - Data object
 *
 * @throws {BadRequestError} - If user does not exist
 * @throws {BadRequestError} - If password reset code is invalid
 */
const resetPassword = async (req, res, next) => {
    const { password_reset_code, new_password } = req.body;

    const user = await User.findOne({ email: req.user.email }).populate(
        'status password'
    );

    // Check if password reset code is valid
    const password_reset_code_match = await AuthCode.findOne({
        user: user._id,
        password_reset_code,
    });
    if (!password_reset_code_match)
        throw new BadRequestError('Invalid password reset code');

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashed_password = await bcrypt.hash(new_password, salt);

    // Update password
    Password.findOneAndUpdate(
        { user: user._id },
        { password: hashed_password }
    );

    // Delete password reset code
    AuthCode.findOneAndDelete({ user: user._id });

    // Blacklist jwt tokens
    BlacklistedToken.create({ token: req.headers.authorization.split(' ')[1] });

    return res.status(200).json({ success: true, data: {} });
};

/**
 * Verify email
 * @description - Verifies user email
 * @route PATCH /api/v1/auth/verifyemail
 * @access Private
 * 
 * @returns {string} success - Success message
 * @returns {string} data - Data object
 * 
 * */ 
const getLoggedInUserData = async (req, res, next) => {
    const user = await User.findOne({ email: req.user.email })

    res.status(200).json({
        success: true,
        data: {
            user: {
                id: user._id,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
            },
        },
    });
};

// Admin controllers

const adminSignup = async (req, res, next) => {
    const { firstname, lastname, email, password } = req.body;

    // Check if user exists
    const existing_user = await User.findOne({ email }).populate('status');

    if (existing_user) {
        if (!existing_user.status.isVerified) {
            const { access_token } = await getAuthTokens(existing_user._id);
        }
};

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
