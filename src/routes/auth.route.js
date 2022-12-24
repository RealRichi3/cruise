const express = require('express')
const { basicAuth } = require('../middlewares/auth')
const router = express.Router()

const {
    enduserSignup,
    riderSignup,
    adminSignup,
    login,
    logout,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerificationEmail,
    getLoggedInUserData,
} = require('../controllers/auth.controller')

router
    .post('/signup/enduser', enduserSignup)
    .post('/signup/rider', riderSignup)
    .post('/signup/admin', adminSignup)
    .post('/login', login)
    .post('/logout', basicAuth, logout)
    .post('/forgotpassword', forgotPassword)
    .patch('/resetpassword', resetPassword)
    .get('/verifyemail/:email', resendVerificationEmail)
    .post('/verifyemail', verifyEmail)
    .get('/user', basicAuth, getLoggedInUserData)

module.exports = router
