const espress = require('express');
const router = espress.Router();

const {
    getRideData,
    getRideReviews,
    getRideReviewData,
    getRides,
    initRideRequest,
    completeRideRequest,
    cancelRideRequest,
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

router.use(basicAuth());

router
    .post('/request/init', initRideRequest)
    .post('/request/complete', completeRideRequest)
    .post('/cancel', cancelRideRequest)
    .post('/book', bookRide)

module.exports = router;
