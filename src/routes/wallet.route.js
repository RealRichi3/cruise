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
const rbac = require('../middlewares/rbac');

router.use(basicAuth(), rbac('enduser rider superadmin'));

router
    .get('/', getWalletData)
    .get('/balance', getWalletBalance)
    .get('/transactions', getWalletTransactions)
    .get('/transaction-data/:id', getWalletTransactionData)
    .post('/topup', rbac('enduser'), topUpWallet)
    .post('/topup/confirm', confirmTopup);

module.exports = router;
