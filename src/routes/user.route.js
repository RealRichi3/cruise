const express = require('express');
const router = express.Router();

const { basicAuth } = require('../middlewares/auth');
const rbacMiddleware = require('../middlewares/rbac');

const {
    addUserAccount,
    getUserAccount,
    updateUserAccount,
    deactivateUserAccount,
    activateUserAccount,
} = require('../controllers/user.controller');

router.use(basicAuth(), rbacMiddleware('superadmin'));

router
    .post('/add', addUserAccount)
    .get('/get', getUserAccount)
    .put('/update', updateUserAccount)
    .put('/deactivate', deactivateUserAccount)
    .put('/activate', activateUserAccount);

module.exports = router;
