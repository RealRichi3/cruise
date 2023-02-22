const express = require('express');
const router = express.Router();

const {
    getWalletTransactions,
    getTransactionData,
    confirmTopup,
    handleFlutterWaveTransactionWebhook
} = require('../controllers/transaction.controller');

const { basicAuth } = require('../middlewares/auth');
const rbac = require('../middlewares/rbac');

router.use(basicAuth(), rbac('enduser rider superadmin'));

router
    .get('/wallet', getWalletTransactions)
    .get('/:id', getTransactionData)
    .post('/topup/confirm', confirmTopup)
    .post('/webhook', handleFlutterWaveTransactionWebhook)

module.exports = router;
