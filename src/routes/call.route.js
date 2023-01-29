const express = require('express');
const router = express.Router();

const {
    getSignallingId,
    getCallLogs,
} = require('../controllers/call.controller')

const { basicAuth } = require('../middlewares/auth');

router.use(basicAuth());

router
    .get('/signallingId', getSignallingId)
