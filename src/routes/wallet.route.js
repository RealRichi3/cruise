const express = require('express');
const router = express.Router();

const {
    getWalletBalance,
    getWalletTransactions,
    getWalletTransactionData,
    getWallet,
    topUpWallet,
} = require('../controllers/wallet.controller');

const { basicAuth } = require('../middlewares/auth');
const rbacMiddleware = require('../middlewares/rbac');

router.use(basicAuth(), rbacMiddleware('enduser rider superadmin'));

router
    .get('/get', getWallet)
    .get('/get-balance', getWalletBalance)
    .get('/get-transactions', getWalletTransactions)
    .get('/get-transaction-data/:id', getWalletTransactionData)
    .post('/topup', topUpWallet);

module.exports = router;
