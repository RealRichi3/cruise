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
    rideArrived,
    startRide,
    completeRide,
    reviewRide,
    payForRide
} = require('../controllers/ride.controller')

const { basicAuth } = require('../middlewares/auth');
const permit = require('../middlewares/rbac');

router.use(basicAuth());

router
    .post('/request/init', permit('enduser superadmin'), initRideRequest)
    .post('/request/complete', permit('enduser superadmin'), completeRideRequest)
    .post('/request/cancel', permit('enduser superadmin'), cancelRideRequest)
    .post('/arrived', permit('rider'), rideArrived)
    .post('/start', permit('rider'), startRide)

module.exports = router;
