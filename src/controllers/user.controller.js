const { BadRequestError } = require('../utils/errors');
const {
    enduserSignup,
    riderSignup,
} = require('../controllers/auth.controller');

const { User } = require('../models/users.model');

/**
 * Add user account
 *
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 *
 * @returns {Promise<void>}
 *
 * @throws {BadRequestError} if role is not provided
 * @throws {BadRequestError} if role is invalid
 * */
const addUserAccount = async (req, res, next) => {
    const { role } = req.body;

    // Check if role is provided
    if (!role) return next(new BadRequestError('Role is required'));

    // Check if role is valid
    if (!['enduser', 'rider', 'admin'].includes(role)) {
        return next(new BadRequestError('Invalid role'));
    }

    // Check if role is rider
    if (role === 'rider') return next(riderSignup(req, res, next));

    enduserSignup(req, res, next);
};

/**
 * Get user account data
 *
 * @param {string} email - User's email
 *
 * @returns {string} - User's account data
 *
 * @throws {BadRequestError} if email is not provided
 * @throws {BadRequestError} if user does not exist
 */
const getUserAccountData = async (req, res, next) => {
    const { email } = req.params;

    // Check if email is provided
    if (!email) return next(new BadRequestError('Email is required'));

    const user = await User.findOne({ email });

    // Check if user exists
    if (!user) return next(new BadRequestError('User does not exist'));

    res.status(200).json({
        success: true,
        data: user,
    });
};

/**
 * Update user account
 * 
 * @param {string} email - User's email
 * 
 * @returns {string} - User's updated account data
 * 
 * @throws {BadRequestError} if email is not provided
 * @throws {BadRequestError} if user does not exist
 * */
const updateUserAccount = async (req, res, next) => {
    const { email } = req.params;

    // Check if email is provided
    if (!email) return next(new BadRequestError('Email is required'));

    const user = await User.findOne({ email });

    // Check if user exists
    if (!user) return next(new BadRequestError('User does not exist'));

    const updated = await User.findOneAndUpdate({ email }, req.body, {
        new: true,
    });

    res.status(200).json({
        success: true,
        data: updated,
    });
};

const deactivateUserAccount = async (req, res, next) => {};

const activateUserAccount = async (req, res, next) => {};

module.exports = {
    addUserAccount,
    getUserAccountData,
    updateUserAccount,
    deactivateUserAccount,
    activateUserAccount,
};
