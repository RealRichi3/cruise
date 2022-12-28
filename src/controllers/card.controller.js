const {
    BadRequestError,
    UnauthorizedError,
    NotFoundError,
} = require('../utils/errors');
const { Card, PaymentInfo } = require('../models/payment_info.model');
const { EndUser } = require('../models/users.model');

// Card Controller
const addNewCard = async (req, res, next) => {
    const { card_number, card_name, cvv, expiry_date } = req.body;
    const middle = card_number.slice(4, -4)
    const enduser = await EndUser.findOne({ user: req.user.id });

    // Check if user is an end user
    if (!enduser) return next(new UnauthorizedError('User is not an end user'));

    // Create new card
    const card = await Card.create({
        user: req.user.id,
        enduser: enduser._id,
        first_four: card_number.slice(0, 4),
        last_four: card_number.slice(-4),
        card_name,
        cvv,
        expiry_date,
    });

};
const removeCard = async (req, res, next) => {};
const getCards = async (req, res, next) => {};
const getCardData = async (req, res, next) => {};

module.exports = {
    addNewCard,
    removeCard,
    getCards,
    getCardData,
};
