const express = require('express');
const router = express.Router();

const {
    addNewBankAccount,
    removeBankAccount,
    getBankAccounts,
    getBankAccountData,
    createDVA,
    getLinkedDVA
} = require('../controllers/bankaccount.controller');

const { basicAuth } = require('../middlewares/auth');
const rbacMiddleware = require('../middlewares/rbac');

router.use(basicAuth(), rbacMiddleware('rider superadmin'));

router
    .post('/add', addNewBankAccount)
    .get(
        '/get/:id',
        rbacMiddleware('enduser rider admin superadmin'),
        getBankAccountData
    )
    .get('/get-all', getBankAccounts)
    .delete('/remove/:id', removeBankAccount)
    .post('/dva/create', createDVA)
    .get('/dva/linked/:ride_id', getLinkedDVA)

module.exports = router;
