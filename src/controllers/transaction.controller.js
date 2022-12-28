const { Transaction, Invoice } = require('../models/transaction.model');
const config = require('../utils/config');
const axios = require('axios');
const { NotFoundError, UnauthorizedError } = require('../utils/errors');

// Transaction Controller
const initiateTransaction = function (data) {
    return new Promise((resolve, reject) => {
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
            invoice
                .save()
                .then()
                .catch((err) => {
                    throw err;
                });

            transaction
                .save()
                .then()
                .catch((err) => {
                    throw err;
                });

            console.log(invoice);
            console.log(transaction);
            resolve(transaction);
        } catch (error) {
            reject(error);
        }
    });
};
// initiate transaction
// return transaction reference
const verifyPaystackTransaction = function (reference) {
    return new Promise((resolve, reject) => {
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
                .catch((error) => console.log(error));

            // Check if transaction is successful
            if (!transaction.data.status)
                throw new BadRequestError(transaction.data.message);

            if (transaction.data.status != 'success')
                throw new BadRequestError('Transaction not successful');

            resolve('success');
        } catch (error) {
            reject(error);
        }
    });
};

const verifyTransactionStatus = function (reference) {
    return new Promise(async (resolve, reject) => {
        try {
            const transaction = await Transaction.findOne({ reference });

            if (!transaction) {
                reject(new NotFoundError('Transaction not found'));
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
            
            if (status != 'success')
                throw new Error('Transaction not successful');

            Transaction.findOneAndUpdate(
                { reference },
                { status: 'success' },
                { new: true }
            ).then((transaction) => {
                resolve(transaction);
            });
        } catch (error) {
            reject(error);
        }
    });
};

const getUsersTransactions = async (req, res, next) => {
    const transactions = await Transaction.find({ user: req.user.id }).populate(
        'invoice receipt'
    );

    res.status(200).json({
        status: 'success',
        data: transactions,
    });
};

const getTransactionData = async (req, res, next) => {
    const { id } = req.params;

    const transaction = await Transaction.findById(id).populate('invoice');

    // Check if transaction exists
    if (!transaction) {
        return next(new NotFoundError('No transaction found with that ID'));
    }

    // Check if user is authorized to view transaction
    if (transaction.user != req.user.id) {
        return next(
            new UnauthorizedError(
                'You do not have permission to view this transaction'
            )
        );
    }

    res.status(200).json({
        status: 'success',
        data: transaction,
    });
};

module.exports = {
    getUsersTransactions,
    getTransactionData,
    initiateTransaction,
    verifyTransactionStatus,
};
