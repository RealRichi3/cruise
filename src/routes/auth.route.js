const express = require('express')
const { basicAuth } = require('../middlewares/auth')
const router = express.Router()

const {
    enduserSignup,
    riderSignup,
    superAdminSignup,
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
    .post('/signup/superadmin', superAdminSignup)
    .post('/login', login)
    .post('/logout', basicAuth(), logout)
    .post('/forgotpassword', forgotPassword)
    .patch('/resetpassword', basicAuth('password_reset'), resetPassword)
    .get('/verifyemail/:email', resendVerificationEmail)
    .post('/verifyemail', basicAuth('verification'), verifyEmail)
    .get('/user', basicAuth(), getLoggedInUserData)
    .get('/authtoken', basicAuth())
    .get('/loggedinuser', basicAuth(), getLoggedInUserData)

module.exports = router
