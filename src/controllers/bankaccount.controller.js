const { BadRequestError, UnauthorizedError } = require('../utils/errors');

// Models
const BankAccount = require('../models/bankaccount.model');
const { EndUser, Rider } = require('../models/users.model');
const { PaymentInfo } = require('../models/payment_info.model');

// Bank Controller
const addNewBankAccount = async (req, res, next) => {
    const { account_number, bank_name, account_name } = req.body;

    const rider = await Rider.findOne({ user: req.user.id });

    const bankaccount = await BankAccount.create({
        user: req.user.id,
        rider: rider._id,
        account_number,
        bank_name,
        account_name,
    });

    let users_payment_info = await PaymentInfo.findOneAndUpdate(
        { user: req.user.id, rider: rider._id },
        { $push: { bank_accounts: bankaccount._id } },
        { new: true, upsert: true }
    ).populate('bank_accounts');

    res.status(200).send({
        success: true,
        message: 'Bank Account added successfully',
    });
};

const removeBankAccount = async (req, res, next) => {};

const getBankAccounts = async (req, res, next) => {};

const getBankAccountData = async (req, res, next) => {};

module.exports = {
    addNewBankAccount,
    removeBankAccount,
    getBankAccounts,
    getBankAccountData,
};
