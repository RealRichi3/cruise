const {
    BadRequestError,
    UnauthorizedError,
    NotFoundError,
} = require('../utils/errors');

// Models
const { Enduser, Rider } = require('../models/users.model');
const { PaymentInfo, BankAccount } = require('../models/payment_info.model');

// Utils
const { initiateTransaction } = require('../utils/transaction');
const config = require('../utils/config');
const { Invoice } = require('../models/transaction.model');
const sendEmail = require('../utils/email');
const { WalletTopupMessage } = require('../utils/mail_message');

// Wallet Controller
const getWallet = async (req, res, next) => {};
const getWalletBalance = async (req, res, next) => {};
const getWalletTransactions = async (req, res, next) => {};
const getWalletTransactionData = async (req, res, next) => {
    git;
};

/**
 * Top up wallet
 *
 * @param {string} amount - The amount to be topped up
 * @param {string} payment_method - The payment method to be used
 * @param {string} type - The type of transaction
 * @param {string} user_id - The ID of the user
 *
 * @returns {object} data - The transaction object
 * @returns {string} data.public_key - The paystack public key
 * @returns {string} data.amount - The amount to be topped up
 * @returns {string} data.payment_method - The payment method to be used
 * @returns {string} data.type - The type of transaction
 * @returns {string} data.user_id - The ID of the user
 *
 * @throws {BadRequestError} - If the request body is invalid
 * @throws {BadRequestError} - If the Validations fail
 * @throws {UnauthorizedError} - If the user is not an end user
 * @throws {InternalServerError} - If there is an error while initiating the transaction
 * */
const topUpWallet = async (req, res, next) => {
    const { amount, payment_method, type } = req.body;
    const id = req.user.id;

    const data = {
        amount,
        payment_method,
        type,
        user_id: id,
    };

    // Initiate transaction
    let result = await initiateTransaction(data);

    // If error occured whle initiating transaction, return error
    if (result instanceof Error) return next(result);

    // Convert transaction object to JSON
    result = result.toObject();

    // Add paystack public key to response
    result.public_key = config.PAYSTACK_PUBLIC_KEY;

    // Get invoice
    const invoice_id = result.invoice;
    const invoice = await Invoice.findById(invoice_id).populate('transaction');

    const topup_message = new WalletTopupMessage();
    topup_message.setBody(invoice);

    // Send Invoice to users email
    sendEmail({
        email: req.user.email,
        subject: 'Invoice for Wallet Topup',
        html: topup_message.getBody(),
    });

    res.status(200).json({
        success: true,
        data: result,
    });
};

const confirmTopup = async (req, res, next) => {
    // Verify initial transaction status
    // Verify transaction status
    // Update wallet balance
    // Update transaction status
    // Send response
    // Send notification to user
    // Send notification to merchant
};

module.exports = {
    getWallet,
    getWalletBalance,
    getWalletTransactions,
    getWalletTransactionData,
    topUpWallet,
};
