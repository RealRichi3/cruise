const espress = require('express');
const router = espress.Router();

const {
    getRideData,
    getRideReview,
    getRideReviewData,
    getUsersRides,
    initRideRequest,
    completeRideRequest,
    cancelRideRequest,
    rideArrived,
    startRide,
    completeRide,
    submitRideReview,
    getRidersReviews,
    payForRide,
    getUsersBookedRides,
    getRidersCompletedRides
} = require('../controllers/ride.controller')

const { basicAuth } = require('../middlewares/auth');
const permit = require('../middlewares/rbac');

router.use(basicAuth());

router
    .post('/request/init', permit('enduser rider superadmin'), initRideRequest)
    .post('/request/complete', permit('enduser rider superadmin'), completeRideRequest)
    .post('/request/cancel', permit('enduser superadmin'), cancelRideRequest)
    .post('/arrived', permit('rider'), rideArrived)
    .post('/start', permit('rider'), startRide)
    .post('/complete', permit('rider'), completeRide)
    .get('/data', permit('enduser rider superadmin'), getRideData)
    .get('/rides', permit('enduser'), getUsersRides)
    .get('/booked', getUsersBookedRides)
    .get('/completed', getRidersCompletedRides)

    // Ride review
    .post('/review/submit', permit('rider enduser'), submitRideReview)
    .get('/review', permit('superadmin admin enduser'), getRideReview)
    .get('/review/data', permit('superadmin admin enduser'), getRideReviewData)
    .get('/review/rider', permit('superadmin admin enduser'), getRidersReviews)

module.exports = router;
