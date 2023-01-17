const espress = require('express');
const router = espress.Router();

const {
    getRideData,
    getRideReviews,
    getRideReviewData,
    getRides,
    initRideRequest,
    completeRideRequest,
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
    .post('/init', initRideRequest)
    .post('/complete', completeRideRequest)
    .post('/book', bookRide)

module.exports = router;
