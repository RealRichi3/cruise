const { BadRequestError, UnauthorizedError } = require('../utils/errors');

// Models
const { EndUser, Rider } = require('../models/users.model');
const { PaymentInfo, BankAccount } = require('../models/payment_info.model');

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
    ).populate('bank_accounts user rider');

    console.log(users_payment_info);
    res.status(200).send({
        success: true,
        message: 'Bank Account added successfully',
        data: bankaccount,
    });
};

const removeBankAccount = async (req, res, next) => {
    const id = req.params.id;

    const rider = await Rider.findOne({ user: req.user.id });

    const bankaccount = await BankAccount.findById(id);

    if (!bankaccount) {
        return next(new BadRequestError('Bank Account not found'));
    }

    let users_payment_info = await PaymentInfo.findOneAndUpdate(
        { user: req.user.id, rider: rider._id },
        { $pull: { bank_accounts: bankaccount._id } },
        { new: true, upsert: true }
    ).populate('bank_accounts user rider');

    // await bankaccount.remove();

    res.status(200).send({
        success: true,
        message: 'Bank Account removed successfully',
        data: bankaccount,
    });
};

const getBankAccounts = async (req, res, next) => {
    const rider = await Rider.findOne({ user: req.user.id });

    const users_payment_info = await PaymentInfo.findOne({
        user: req.user.id,
        rider: rider._id,
    }).populate('bank_accounts');

    res.status(200).send({
        success: true,
        message: 'Bank Accounts retrieved successfully',
        data: users_payment_info,
    });
};

const getBankAccountData = async (req, res, next) => {
    const id = req.params.id;

    const bankaccount = await BankAccount.findById(id);

    if (!bankaccount) {
        return next(new BadRequestError('Bank Account not found'));
    }

    res.status(200).send({
        success: true,
        message: 'Bank Account retrieved successfully',
        data: bankaccount,
    });
};

module.exports = {
    addNewBankAccount,
    removeBankAccount,
    getBankAccounts,
    getBankAccountData,
};
