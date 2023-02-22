const { Transaction, Invoice } = require('../../models/transaction.model');
const config = require('../../config');
const axios = require('axios');
const { NotFoundError, UnauthorizedError } = require('../../utils/errors');
const { Wallet, VirtualAccount } = require('../../models/payment_info.model');
const { User } = require('../../models/users.model');

async function createVirtualAccountForTransaction(user_id, txn) {
    if (!txn.reference) throw new Error('No transaction reference');

    const user = await User.findById(user_id)
    if (!user) { throw new Error('User does not exist') }

    const data = {
        firstname, lastname, email,
        tx_ref: txn.reference,
        frequency: 1,
        amount: txn.amount,
        is_permanent: false,
    } = user

    console.log(data)

    // Send request to flutterwave to create virtual account
    const axios_config = {
        method: 'post',
        url: 'https://api.flutterwave.com/v3/virtual-account-numbers',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.FLUTTEWAVE_SECRET_KEY}`
        },
        data: data
    };
    const response = await axios(axios_config)
    if (response.data.status != 'success') {
        throw new Error('An error occured')
    }

    // Get flutterwave transaction data from response data
    const flw_txn_data = {
        user: user._id,
        flw_ref, order_ref, account_number,
        bank_name, created_at, expiry_date, amount,
        frequency
    } = response.data.data

    // Create Virtual account record in DB
    const virtual_account = await VirtualAccount.create(flw_txn_data)

    return virtual_account
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
            const virtual_account = createVirtualAccountForTransaction(user_id, transaction)
            transaction.virtual_account = virtual_account._id
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
        return transaction;
    } catch (error) {
        throw new Error(error);
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
