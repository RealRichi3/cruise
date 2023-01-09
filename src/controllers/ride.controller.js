const bookRide = async (req, res) => {
//    Get the ride info
//    Get the location, to and fro
//    Check riders within the current users location
//    Send request to rider,
//    If rider accepts, create a ride, and init map tracking for rider on user app and rider app
//    If rider declines, send notification to user
};

const acceptRideRequest = async (req, res) => {};

const declineRideRequest = async (req, res) => {};

const cancelRide = async (req, res) => {};

const startRide = async (req, res) => {};

const completeRide = async (req, res) => {};

const reviewRide = async (req, res) => {};

const getRides = async (req, res) => {};

const getRideData = async (req, res) => {};

const getRideReviews = async (req, res) => {};

const getRideReviewData = async (req, res) => {};

const payForRide = async (req, res) => {};

module.exports = {
    bookRide,
    acceptRideRequest,
    declineRideRequest,
    cancelRide,
    startRide,
    completeRide,
    reviewRide,
    getRides,
    getRideData,
    getRideReviews,
    getRideReviewData,
    payForRide,
};
