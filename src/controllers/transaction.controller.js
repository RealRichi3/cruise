const { Transaction, Invoice } = require('../models/transaction.model');
const config = require('../utils/config');
const axios = require('axios');
const { NotFoundError, UnauthorizedError } = require('../utils/errors');
const {
    initiateTransaction,
    verifyTransactionStatus,
} = require('../utils/transaction');

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
};
