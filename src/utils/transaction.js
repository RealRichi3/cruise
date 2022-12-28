const { Transaction, Invoice } = require('../models/transaction.model');
const config = require('../utils/config');
const axios = require('axios');
const { NotFoundError, UnauthorizedError } = require('../utils/errors');
const { Wallet } = require('../models/payment_info.model');

// Transaction Controller
const initiateTransaction = async function (data) {
    try {
        const { amount, type, payment_method, user_id } = data;

        // Create Invoice for pending transaction
        const invoice = new Invoice({
            user: user_id,
            amount,
            type,
        });

        // Create transaction record in Database
        const transaction = new Transaction({
            user: user_id,
            amount,
            type,
            payment_method,
            invoice: invoice._id,
        });

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

        console.log(invoice);
        console.log(transaction);
        return transaction;
    } catch (error) {
        throw error;
    }
};
// initiate transaction
// return transaction reference
const verifyPaystackTransaction = function (reference) {
    try {
        const URL = `https://api.paystack.co/transaction/verify/${reference}`;

        // Verify transaction from Paystack API
        const transaction = axios
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
            throw 'Transaction not successful';

        return 'success';
    } catch (error) {
        throw error;
    }
};

const verifyTransactionStatus = async function (reference) {
    try {
        const transaction = await Transaction.findOne({ reference });

        if (!transaction) {
            throw new Error('Transaction not found');
        }

        let status;
        if (transaction.payment_method == 'paystack') {
            // Verify transaction from Paystack API
            status = await verifyPaystackTransaction(reference);
        }

        if (transaction.payment_method == 'flutterwave') {
            // Verify transaction from Flutterwave API
            // status = await verifyFlutterwaveTransaction(reference);
        }

        if (transaction.payment_method == 'bank_transfer') {
            // Verify transaction from Bank Transfer
            // status = await verifyBankTransferTransaction(reference);
        }

        if (status != 'success') throw new Error('Transaction not successful');

        return await Transaction.findOneAndUpdate(
            { reference },
            { status: 'success' },
            { new: true }
        ).then((transaction) => {
            return transaction;
        });
    } catch (error) {
        throw error;
    }
};

module.exports = {
    initiateTransaction,
    verifyTransactionStatus,
};
