const { BadRequestError } = require('../utils/errors');
const { enduserSignup, riderSignup } = require('../controllers/auth.controller');

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

    await enduserSignup(req, res, next);
};

const getUserAccount = async (req, res, next) => {};

const updateUserAccount = async (req, res, next) => {};

const deactivateUserAccount = async (req, res, next) => {};

const activateUserAccount = async (req, res, next) => {};

module.exports = {
    addUserAccount,
    getUserAccount,
    updateUserAccount,
    deactivateUserAccount,
    activateUserAccount,
};
