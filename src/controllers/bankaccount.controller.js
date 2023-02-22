const {
    BadRequestError,
    UnauthorizedError,
    NotFoundError,
} = require('../utils/errors');

// Models
const { Rider } = require('../models/users.model');
const { BankAccount } = require('../models/payment_info.model');
const { createDVA, createDVACustomerProfile } = require('../services/payment/dva.service');

// Bank Controller
/**
 * Add a new bank account
 *
 * @param {string} account_number - The account number of the bank account
 * @param {string} bank_name - The name of the bank
 * @param {string} account_name - The name of the account holder
 *
 * @returns {Object} - The bank account object
 *
 * @throws {BadRequestError} - If the request body is invalid
 * @throws {UnauthorizedError} - If the user is not a rider
 * @throws {InternalServerError} - If there is an error while saving the bank account
 * */
const addNewBankAccount = async (req, res, next) => {
    const { account_number, bank_name, account_name } = req.body;

    const rider = await Rider.findOne({ user: req.user.id });

    // Check if user is a rider
    if (!rider) {
        return next(new UnauthorizedError('User is not a rider'));
    }

    // Create new bank account
    const bankaccount = await BankAccount.create({
        user: req.user.id,
        rider: rider._id,
        account_number,
        bank_name,
        account_name,
    });

    // Add bank account to user's payment info
    await rider.updateOne(
        { $push: { bank_accounts: bankaccount._id } },
        { new: true, upsert: true }
    );

    res.status(200).send({
        success: true,
        message: 'Bank Account added successfully',
        data: bankaccount,
    });
};

/**
 * Remove a bank account
 *
 * @param {string} id - The id of the bank account
 *
 * @returns {Object} - The bank account object
 *
 * @throws {BadRequestError} - If the request body is invalid
 * @throws {UnauthorizedError} - If the user is not a rider
 * @throws {InternalServerError} - If there is an error while saving the bank account
 * @throws {NotFoundError} - If the bank account is not found
 * @throws {UnauthorizedError} - If the user is not authorized to remove the bank account
 * */
const removeBankAccount = async (req, res, next) => {
    const id = req.params.id;

    const rider = await Rider.findOne({ user: req.user.id });

    // Check if user is a rider
    if (!rider) return next(new UnauthorizedError('User is not a rider'));

    const bankaccount = await BankAccount.findById(id);

    // Check if bank account exists
    if (!bankaccount)
        return next(new BadRequestError('Bank Account not found'));

    // Check if bank account belongs to user
    if (bankaccount.user.toString() !== req.user.id) {
        return next(
            new UnauthorizedError(
                'User is not authorized to remove this bank account'
            )
        );
    }

    // Remove bank account from user's payment info
    await rider.updateOne(
        { $pull: { bank_accounts: bankaccount._id } },
        { new: true, upsert: true }
    );

    // await bankaccount.remove();

    res.status(200).send({
        success: true,
        message: 'Bank Account removed successfully',
        data: bankaccount,
    });
};

/**
 * Get all bank accounts
 *
 * @returns {Object} - The bank account object
 *
 * @throws {BadRequestError} - If the request body is invalid
 * @throws {UnauthorizedError} - If the user is not a rider
 * @throws {InternalServerError} - If there is an error while saving the bank account
 * */
const getBankAccounts = async (req, res, next) => {
    const rider = await Rider.findOne({ user: req.user.id }).populate(
        'bank_accounts'
    );

    // Get user's payment info
    const bank_accounts = rider.bank_accounts;

    res.status(200).send({
        success: true,
        message: 'Bank Accounts retrieved successfully',
        data: bank_accounts,
    });
};

/**
 * Get a bank account
 *
 * @param {string} id - The id of the bank account
 *
 * @returns {Object} - The bank account object
 *
 * @throws {BadRequestError} - If the request body is invalid
 * @throws {UnauthorizedError} - If the user is not a rider
 * @throws {InternalServerError} - If there is an error while saving the bank account
 * @throws {NotFoundError} - If the bank account is not found
 * */
const getBankAccountData = async (req, res, next) => {
    const id = req.params.id;

    // Get bank account
    const bankaccount = await BankAccount.findById(id);

    // Check if bank account exists
    if (!bankaccount) {
        return next(new NotFoundError('Bank Account not found'));
    }

    res.status(200).send({
        success: true,
        message: 'Bank Account retrieved successfully',
        data: bankaccount,
    });
};

const createDedicatedVirtualBankAccount = async (req, res, next) => {
    const dva_result = await createDVACustomerProfile(req.user)
    if (dva_result instanceof Error) next(dva_result);

    res.status(200).send({
        success: true,
        data: dva_result
    })
}

const getLinkedDedicatedVirtualBankAccount = async (req, res, next) => {

}

module.exports = {
    addNewBankAccount,
    removeBankAccount,
    getBankAccounts,
    getBankAccountData,
    createDedicatedVirtualBankAccount
};
