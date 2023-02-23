const { Transaction, Invoice } = require('../../models/transaction.model');
const config = require('../../config');
const axios = require('axios');
const { NotFoundError, UnauthorizedError } = require('../../utils/errors');
const { Wallet, VirtualAccount } = require('../../models/payment_info.model');
const { User } = require('../../models/users.model');
const { createFLWVirtualAccount } = require('./virtualaccount.service');
const sendEmail = require('../email.service')
const {
    WalletTopupInvoiceMessage,
    WalletTopupReceiptMessage,
    WalletWithdrawalReceiptMessage } = require('../../utils/mail_message');

/**
 * Get Temporary Virtual Account
 * 
 * @param {MoongooseObjectId} user_id 
 * @param {MongooseObject} txn - Transaction record
 * 
 * @returns {MongooseObject} - Virtual Account record in database
 */
async function getTemporaryVirtualAccount(user_id, txn) {
    if (!txn.reference) throw new Error('No transaction reference');

    const user = await User.findById(user_id)
    if (!user) { throw new Error('User does not exist') }

    const data = { firstname, lastname, email, } = user
    data.tx_ref = txn.reference
    data.frequency = 1          // Maximum number of allowed payment
    data.amount = txn.amount
    data.is_permanent = false   // for static virtual account, set to true

    // Create virtual account from flutterwave API
    const virtual_account_data = await createFLWVirtualAccount(data)
    virtual_account_data.user = user._id

    // Create Virtual account record in DB
    const db_virtual_account = await VirtualAccount.create({
        ...virtual_account_data,
        ...data,
        transaction: txn._id
    })

    return db_virtual_account
}

// Transaction Controller
/**
 * Initiate a transaction
 *
 * @param {string} amount - The amount to be topped up
 * @param {string} payment_method - The payment method to be used
 * @param {string} type - The type of transaction
 * @param {string} user_id - The ID of the user
 * @param {string} enduser_id - The ID of the end user - Optional
 * @param {string} rider_id - The ID of the rider - Optional
 *
 * @returns {object} transaction - The transaction object
 * @returns {string} transaction.amount - The amount to be topped up
 * @returns {string} transaction.payment_method - The payment method to be used
 * @returns {string} transaction.type - The type of transaction
 * @returns {string} transaction.user - The ID of the user
 * @returns {string} transaction.enduser - The ID of the end user - Optional
 * @returns {string} transaction.rider - The ID of the rider - Optional
 *
 * @throws {Error} - If there is an error while initiating the transaction
 * */
async function initiateTransaction(data) {
    try {
        const { amount, type, payment_method, user_id, enduser_id, ride_id } = data;

        // Create Invoice for pending transaction
        const invoice = new Invoice({
            user: user_id,
            amount,
            type,
        });

        // Create transaction record in Database
        const transaction = new Transaction({
            enduser: enduser_id,
            user: user_id,
            amount,
            type,
            payment_method,
            invoice: invoice._id,
            ride_id, // If transaction is payment for ride
        });

        // Generate virtual account if payment method is bank transfer
        if (payment_method == 'bank_transfer') {
            const virtual_account = await getTemporaryVirtualAccount(user_id, transaction)
            transaction.virtual_account = virtual_account._id
            transaction.payment_gateway = 'flutterwave'

            console.log(virtual_account)
        } else if (payment_method == 'card') {
            transaction.payment_gateway = 'paystack'
        }

        console.log(transaction)
        console.log(invoice)

        invoice.transaction = transaction._id;
        let iresult = await invoice
            .save()
            .then()
            .catch((err) => {
                return err;
            });

        // Error occured while saving invoice
        if (iresult instanceof Error) throw iresult;

        let tresult = await transaction
            .save()
            .then()
            .catch((err) => {
                return err;
            });

        // Error occured while saving transaction
        if (tresult instanceof Error) throw tresult;

        // Add transaction to wallet
        if (type == 'wallet_topup' || payment_method == 'wallet') {
            const wall = await Wallet.findOneAndUpdate(
                { user: user_id },
                { $push: { transactions: transaction._id } }
            );
            console.log(wall);
        }

        console.log(transaction);
        return transaction.populate('invoice user virtual_account');
    } catch (error) {
        throw error;
    }
};

/**
 * Verify Paystack transaction
 *
 * @param {string} reference - The reference of the transaction
 *
 * @returns {object} transaction - The transaction object
 * @returns {string} transaction.data.status - The status of the transaction
 * @returns {string} transaction.data.message - The message of the transaction
 * @returns {string} transaction.data.data - The data of the transaction
 *
 * @throws {Error} - If there is an error while verifying the transaction
 * @throws {Error} - If the transaction is not successful
 */
async function verifyTransactionFromPaystackAPI(reference) {
    try {
        const URL = `https://api.paystack.co/transaction/verify/${reference}`;

        // Verify transaction from Paystack API
        const transaction = await axios
            .get(URL, {
                headers: {
                    Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}`,
                },
            })
            .then(
                (response) => {
                    return response.data;
                },
                (error) => {
                    return error.response;
                }
            )
            .catch((error) => {
                console.log(error);
                return error;
            });

        // Check if transaction is successful
        if (!transaction.data.status) throw transaction.data.message;

        if (transaction.data.status != 'success')
            throw new Error('Transaction not successful');

        return transaction;
    } catch (error) {
        throw error;
    }
};

async function verifyTransactionFromFlutterwaveAPI(reference) {
    const transaction = await Transaction.findOne({ reference })
}

/**
 * Verify transaction status
 *
 * @param {string} reference - The reference of the transaction
 *
 * @returns {object} transaction - The transaction object if transaction is successful
 * @returns {string} transaction.amount - The amount to be topped up
 * @returns {string} transaction.payment_method - The payment method to be used
 * @returns {string} transaction.type - The type of transaction
 * @returns {string} transaction.user - The ID of the user
 * @returns {string} transaction.enduser - The ID of the end user - Optional
 * @returns {string} transaction.rider - The ID of the rider - Optional
 *
 * @throws {Error} - If there is an error while verifying the transaction
 * @throws {Error} - If the transaction is not successful
 * @throws {Error} - If the transaction amount is not equal to the amount in the database
 * @throws {Error} - If the transaction is not found
 * */
async function verifyTransactionStatus(reference) {
    let transaction = await Transaction.findOne({ reference });

    // Check if transaction exists
    if (!transaction) throw new Error('Transaction not found');

    let gateway_transaction_result;
    switch (transaction.payment_gateway) {
        case 'paystack':
            gateway_transaction_result = await verifyTransactionFromPaystackAPI(reference)
            break;
        case 'flutterwave':
            gateway_transaction_result = await verifyTransactionFromFlutterwaveAPI(reference)
            break;
        default:
            throw new Error('Please specify payment gateway for transaction')
    }

    // Check for transaction amount mismatch
    if (
        transaction.amount !=
        gateway_transaction_result.data.amount / 100
    ) {
        throw new Error('Transaction amount mismatch');
    }

    // Check if transaction is successful
    if (gateway_transaction_result.data.status != 'success')
        throw new Error('Transaction not successful');

    return transaction
};

async function effectVerifiedRidePaymentTransaction(transaction_id) {
    let transaction = await Transaction.findById(transaction_id)
    if (!transaction) throw new Error('No matching transaction found')

    if (transaction.reflected) return transaction;




    transaction = await transaction.save()

    //  return updated transaction data
    return transaction
}

async function effectVerifiedWalletCreditTransaction(transaction_id) {
    let transaction = await Transaction.findById(transaction_id).populate('user')
    if (!transaction) throw new Error('No matching transaction found')

    if (transaction.reflected) return transaction;

    // Transaction has not reflected
    // Update wallet balance
    const wall = await Wallet.findOneAndUpdate(
        { user: transaction.user },
        { $inc: { balance: transaction.amount } },
        { new: true }
    )
    console.log(wall)

    // Generate transaction receipt
    const receipt = await transaction.generateReceipt()
    await transaction.updateOne({ status: 'success', reflected: true })
    transaction = await transaction.save()

    // Generate email notification
    const mail_message = new WalletTopupReceiptMessage();
    mail_message.setBody(receipt);

    sendEmail({
        email: transaction.user.email,
        subject: `Receipt for Wallet Topup`,
        html: mail_message.getBody(),
    })

    return transaction
}

async function effectVerifiedWalletDebitTranscation(transaction_id) {
    let transaction = await Transaction.findById(transaction_id).populate('user')
    if (!transaction) throw new Error('No matching transaction found')

    if (transaction.reflected) return transaction;  //  Transacation has reflected

    const wallet = await Wallet.findOne({ user: transaction.user })
    if (wallet.balance < transaction.amount) {
        throw new Error('Insufficient funds')
    }

    //  Transaction has reflected
    //  Update Wallet balance
    await wallet.updateOne({ $inc: { balance: -transaction.amount } })

    // Update transaction status
    transaction = await Transaction.findByIdAndUpdate(
        transaction_id,
        { status: 'success', reflected: true },
        { new: true }
    )
    
    // Generate transaction receipt
    const receipt = await transaction.generateReceipt()
    transaction = await transaction.save()

    // Generate email notification
    const mail_message = new WalletWithdrawalReceiptMessage();
    mail_message.setBody(receipt);

    sendEmail({
        email: transaction.user.email,
        subject: `Receipt for Wallet Withdrawal`,
        html: mail_message.getBody(),
    })

    return transaction.populate('receipt invoice ride user')
}

module.exports = {
    initiateTransaction,
    verifyTransactionStatus,
    effectVerifiedRidePaymentTransaction,
    effectVerifiedWalletCreditTransaction,
    effectVerifiedWalletDebitTranscation
};
