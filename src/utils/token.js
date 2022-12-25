const { User } = require('../models/users.model');
const { AuthCode } = require('../models/token.model');
const asyncWrapper = require('./async_wrapper');
const { NotFoundError } = require('./custom_errors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('./config');
const { v4: UUID } = require('uuid');

/**
 *
 * @param {string} type - Type of token to generate
 * @returns secret and expiry for the specified token type
 */
const getRequiredConfigVars = (type) => {
    switch (type) {
        case 'access':
            return {
                secret: config.JWT_ACCESS_SECRET,
                expiry: config.JWT_ACCESS_EXP,
            };

        case 'refresh':
            return {
                secret: config.JWT_REFRESH_SECRET,
                expiry: config.JWT_REFRESH_EXP,
            };

        case 'password_reset':
            return {
                secret: config.JWT_PASSWORDRESET_SECRET,
                expiry: config.JWT_PASSWORDRESET_EXP,
            };

        case 'verification':
            return {
                secret: config.JWT_EMAILVERIFICATION_SECRET,
                expiry: config.JWT_EMAILVERIFICATION_EXP,
            };
    }
};

/**
 * Generates a JWT token
 * @param {string} type - Type of token to generate
 * @param {UUID} user_id - ID of the user to generate token for
 * @returns JWT token
 * @throws {NotFoundError} - If user does not exist
 * @throws {Error} - If any other error occurs
 *  */
const getAuthTokens = async (user_id, token_type = null) => {
    try {
        // Get user details
        const current_user = await User.findById(user_id).populate('status');
        if (!current_user) {
            throw new NotFoundError('User does not exist');
        }

        const data = {
            id: current_user.id,
            email: current_user.email,
            role: current_user.role,
            status: current_user.status,
        };

        // Set token type to access if not specified
        if (!token_type) token_type = 'access';

        // Get token secret and expiry
        let { secret, expiry } = getRequiredConfigVars(token_type);
        console.log(expiry);

        // Set token expiry to 6 hours if in development
        if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
            expiry = '6h';
        }

        // Generate tokens
        const access_token = jwt.sign(data, secret, { expiresIn: expiry });
        const refresh_token = jwt.sign(data, config.JWT_REFRESH_SECRET, {
            expiresIn: config.JWT_REFRESH_EXP,
        });

        return { access_token, refresh_token };
    } catch (error) {
        throw error;
    }
};

const getAuthCodes = async (user_id, code_type) => {
    try {
        let random_code = `${Math.floor(100000 + Math.random() * 900000)}`;
        let verification_code,
            password_reset_code,
            activation_code1,
            activation_code2,
            activation_code3;

        if (code_type == 'verification') {
            verification_code = random_code;
            AuthCode.findOneAndUpdate(
                { user: user_id },
                { verification_code },
                { new: true, upsert: true }
            );
        }

        if (code_type == 'password_reset') {
            password_reset_code = random_code;
            AuthCode.findOneAndUpdate(
                { user: user_id },
                { password_reset_code },
                { new: true, upsert: true }
            );
        }

        // If code_type is 'su_activation', generate 3 codes - SuperAdminAccountActivation
        if (code_type == 'su_activation') {
            activation_code1 = UUID(); // Will be sent to user
            activation_code2 = UUID(); // Will be sent to first admin
            activation_code3 = UUID(); // Will be sent to second admin

            const activation_code = `${activation_code1}-${activation_code2}-${activation_code3}`;
            const hashed_activation_code = await bcrypt.hash(
                activation_code,
                10
            );

            AuthCode.findOneAndUpdate(
                { user: user_id },
                { activation_code: hashed_activation_code },
                { new: true, upsert: true }
            );
        }

        console.log(
            'getAuthCodes',
            verification_code,
            password_reset_code,
            activation_code1,
            activation_code2,
            activation_code3
        );
        return {
            verification_code,
            password_reset_code,
            activation_code1,
            activation_code2,
            activation_code3,
        };
    } catch (error) {
        throw error;
    }
};

const decodeJWT = (token) => {
    try {
        const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET);
        return decoded;
    } catch (error) {
        throw error;
    }
};

module.exports = { getAuthTokens, getAuthCodes, decodeJWT };
