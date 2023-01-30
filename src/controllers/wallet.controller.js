const {
    BadRequestError,
    UnauthorizedError,
    NotFoundError,
} = require('../utils/errors');

// Models
const { Enduser, Rider } = require('../models/users.model');
const { BankAccount, Wallet } = require('../models/payment_info.model');
const {
    Invoice,
    Receipt,
    Transaction,
} = require('../models/transaction.model');

// Utils
const {
    initiateTransaction,
    verifyTransactionStatus,
} = require('../services/transaction.service');
const config = require('../utils/config');
const sendEmail = require('../services/email.service');
const {
    WalletTopupInvoiceMessage,
    WalletTopupReceiptMessage,
} = require('../utils/mail_message');

// Wallet Controller
/**
 * Get wallet data
 *
 * @returns {Object} - The Wallet object
 *
 * @throws {NotFoundError} - If the user is not found
 * */
const getWalletData = async (req, res, next) => {
    const user = await Enduser.findOne({ user: req.user.id }).populate({
        path: 'wallet',
        populate: {
            path: 'transactions',
            model: 'Transaction',
        },
    });

    // Check if user exists
    if (!user) return next(new NotFoundError('User not found'));

    res.status(200).json({
        success: true,
        data: user.wallet,
    });
};

/**
 * Get wallet balance
 *
 * @param {string} id - The ID of the user
 *
 * @returns {object} data - The response data
 * @returns {string} data.balance - The wallet balance
 *
 * @throws {NotFoundError} - If the user is not found
 * */
const getWalletBalance = async (req, res, next) => {
    const user = await Enduser.findOne({ user: req.user.id }).populate(
        'wallet'
    );

    console.log(user);
    if (!user) return next(new NotFoundError('User not found'));

    res.status(200).json({
        success: true,
        data: {
            balance: user.wallet.balance,
        },
    });
};

/**
 * Get wallet transactions
 *
 * @param {string} id - The ID of the wallet
 *
 * @returns {array} data - The wallet transactions
 *
 * @throws {NotFoundError} - If the wallet is not found
 * @throws {UnauthorizedError} - If the wallet does not belong to the user
 * */
const getWalletTransactions = async (req, res, next) => {
    const { id } = req.params;

    const wallet = await Wallet.findById(id).populate('transactions');

    // Check if wallet exists
    if (!wallet) return next(new NotFoundError('Wallet not found'));

    // Check if the wallet belongs to the user
    if (wallet.user.toString() !== req.user.id)
        return next(new UnauthorizedError('Unauthorized'));

    const transactions = wallet.transactions;

    res.status(200).json({
        success: true,
        data: transactions,
    });
};

/**
 * Get wallet transaction data
 * 
 * @param {string} id - The ID of the transaction
 * 
 * @returns {object} data - The transaction object
 */
const getWalletTransactionData = async (req, res, next) => {
    const { id } = req.params;

    const transaction = await Transaction.findById(id).populate('invoice receipt');

    // Check if transaction exists
    if (!transaction)
        return next(new NotFoundError('Transaction not found'));

    // Check if the transaction belongs to the user
    if (transaction.user.toString() !== req.user.id)
        return next(new UnauthorizedError('Unauthorized'));

    res.status(200).json({
        success: true,
        data: transaction,
    });
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

/**
 * Confirm topup
 *
 * @param {string} reference - The reference of the transaction
 *
 * @returns {object} data - The transaction object
 * @returns {string} data.amount - The amount to be topped up
 * @returns {string} data.payment_method - The payment method to be used
 * @returns {string} data.type - The type of transaction
 * @returns {string} data.user_id - The ID of the user
 * @returns {string} data.status - The status of the transaction
 *
 * @throws {BadRequestError} - If the request body is invalid
 * @throws {BadRequestError} - If the Validations fail
 * @throws {UnauthorizedError} - If the user is not an end user
 * @throws {InternalServerError} - If there is an error while verifying the transaction
 * @throws {InternalServerError} - If there is an error while updating the wallet
 * @throws {InternalServerError} - If there is an error while updating the transaction
 * */
const confirmTopup = async (req, res, next) => {
    // Get transaction reference from request body
    const { reference } = req.body;

    // Verify transaction
    const result = await verifyTransactionStatus(reference)
        .then((result) => {
            return result;
        })
        .catch((err) => {
            return err;
        });

    const possible_error_msgs = [
        'Transaction not found',
        'Transaction not successful',
        'Transaction amount mismatch',
    ];

    /*  
        If transaction is not successful, the result will be an error
        If successful, the result will be a transaction object 
    */
    // If error occured while verifying transaction, return error
    if (result instanceof Error) {
        if (possible_error_msgs.includes(result.message))
            return next(new BadRequestError(result.message));

        return next(result);
    }
    const transaction = result;

    if (transaction instanceof Error) return next(transaction);

    /* 
        If the transaction is successful
        and the transaction is not already in the users wallet,
        proceed to update wallet balance and transaction status 
    */
    if (!transaction.reflected) {
        // Update wallet balance
        await Wallet.findOneAndUpdate(
            { user: transaction.user },
            { $inc: { balance: transaction.amount } },
            { new: true }
        );

        // Update transaction reflected status
        transaction.reflected = true;

        // Update transaction status
        transaction.status = 'success';

        // Generate receipt
        const receipt = await (
            await transaction.generateReceipt()
        ).populate('transaction');

        await transaction.save();

        const confirm_topup_message = new WalletTopupReceiptMessage();
        confirm_topup_message.setBody(receipt);

        // Send receipt to users email
        sendEmail({
            email: req.user.email,
            subject: 'Receipt for Wallet Topup',
            html: confirm_topup_message.getBody(),
        });
    }

    res.status(200).json({
        success: true,
        data: transaction,
    });
};

module.exports = {
    getWalletData,
    getWalletBalance,
    getWalletTransactions,
    getWalletTransactionData,
    topUpWallet,
    confirmTopup,
};
