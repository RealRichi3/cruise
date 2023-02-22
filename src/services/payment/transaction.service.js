const { Transaction, Invoice } = require('../../models/transaction.model');
const config = require('../../config');
const axios = require('axios');
const { NotFoundError, UnauthorizedError } = require('../../utils/errors');
const { Wallet, VirtualAccount } = require('../../models/payment_info.model');
const { User } = require('../../models/users.model');
const { createFLWVirtualAccount } = require('./virtualaccount.service');

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
const initiateTransaction = async function (data) {
    try {
        const { amount, type, payment_method, user_id, enduser_id } = data;

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
        });

        // Generate virtual account if payment method is bank transfer
        if (payment_method == 'bank_transfer') {
            const virtual_account = await getTemporaryVirtualAccount(user_id, transaction)
            transaction.virtual_account = virtual_account._id

            console.log(virtual_account)
        }

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
        if (type == 'wallet_topup') {
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
const verifyPaystackTransaction = async function (reference) {
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
const verifyTransactionStatus = function (reference) {
    return new Promise(async (resolve, reject) => {
        try {
            let transaction = await Transaction.findOne({ reference });

            // Check if transaction exists
            if (!transaction) throw new Error('Transaction not found');

            let gateway_transaction_result;
            gateway_transaction_result = await verifyPaystackTransaction(
                reference
            );

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

            resolve(transaction);
        } catch (error) {
            console.log(error);
            reject(error);
        }
    });
};

module.exports = {
    initiateTransaction,
    verifyTransactionStatus,
};