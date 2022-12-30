const express = require('express');
const router = express.Router();

const {
    getWalletBalance,
    getWalletTransactions,
    getWalletTransactionData,
    getWalletData,
    topUpWallet,
    confirmTopup
} = require('../controllers/wallet.controller');

const { basicAuth } = require('../middlewares/auth');
const rbacMiddleware = require('../middlewares/rbac');

router.use(basicAuth(), rbacMiddleware('enduser rider superadmin'));

router
    .get('/', getWalletData)
    .get('/balance', getWalletBalance)
    .get('/transactions', getWalletTransactions)
    .get('/transaction-data/:id', getWalletTransactionData)
    .post('/topup', topUpWallet)
    .post('/topup/confirm', confirmTopup);

module.exports = router;
