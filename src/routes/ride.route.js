const espress  = require('express');
const router = espress.Router();

const {
    getRideData,
    getRideReviews,
    getRideReviewData,
    getRides,
    bookRide,
    acceptRideRequest,
    declineRideRequest,
    cancelRide,
    startRide,
    completeRide,
    reviewRide,
    payForRide
} = require('../controllers/ride.controller')

const { basicAuth } = require('../middlewares/auth');
const rbacMiddleware = require('../middlewares/rbac');

module.exports = router;
