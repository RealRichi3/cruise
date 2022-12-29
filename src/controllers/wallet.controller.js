const {
    BadRequestError,
    UnauthorizedError,
    NotFoundError,
} = require('../utils/errors');

// Models
const { Enduser, Rider } = require('../models/users.model');
const {
    PaymentInfo,
    BankAccount,
    Wallet,
} = require('../models/payment_info.model');
const {
    Invoice,
    Receipt,
    Transaction,
} = require('../models/transaction.model');

// Utils
const {
    initiateTransaction,
    verifyTransactionStatus,
} = require('../utils/transaction');
const config = require('../utils/config');
const sendEmail = require('../utils/email');
const {
    WalletTopupInvoiceMessage,
    WalletTopupReceiptMessage,
} = require('../utils/mail_message');

// Wallet Controller
const getWallet = async (req, res, next) => {};
const getWalletBalance = async (req, res, next) => {};
const getWalletTransactions = async (req, res, next) => {};
const getWalletTransactionData = async (req, res, next) => {
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

    const enduser = await Enduser.findOne({ user: id });

    const data = {
        amount: amount / 100,
        payment_method,
        type,
        user_id: id,
        enduser: enduser._id, // Add enduser ID to transaction object if it is made by an enduser
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

    const topup_message = new WalletTopupInvoiceMessage();
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
    const enduser = await Enduser.findOne({ user: req.user.id });

    // Get transaction reference from request body
    const { reference } = req.body;

    // Verify transaction
    const result = await verifyTransactionStatus(reference);

    // If error occured while verifying transaction, return error
    if (result instanceof Error) return next(result);

    // Get transaction
    const transaction = result;

    // Update wallet balance
    const wallet = await Wallet.findOneAndUpdate(
        { user: transaction.user },
        { $inc: { balance: transaction.amount } },
        { new: true }
    );

    // Update transaction status
    transaction.status = 'success';

    // Generate receipt
    const receipt = await (
        await transaction.generateReceipt()
    ).populate('transaction');

    const confirm_topup_message = new WalletTopupReceiptMessage();
    confirm_topup_message.setBody(receipt);
    
    // Send receipt to users email
    sendEmail({
        email: req.user.email,
        subject: 'Receipt for Wallet Topup',
        html: confirm_topup_message.getBody(),
    });

    res.status(200).json({
        success: true,
        data: transaction,
    });

};

module.exports = {
    getWallet,
    getWalletBalance,
    getWalletTransactions,
    getWalletTransactionData,
    topUpWallet,
    confirmTopup,
};
