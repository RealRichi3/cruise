// Utils
const { encrypt, decrypt } = require('../utils/cypher');
const {
    BadRequestError,
    UnauthorizedError,
    NotFoundError,
} = require('../utils/errors');

// Models
const { Card, PaymentInfo } = require('../models/payment_info.model');
const { Enduser } = require('../models/users.model');

// Card Controller
/**
 * Add a new card
 *
 * @param {string} card_number - The card number
 * @param {string} card_name - The name on the card
 * @param {string} cvv - The cvv of the card
 * @param {string} expiry_date - The expiry date of the card
 *
 * @returns {Object} - The card object
 *
 * @throws {BadRequestError} - If the request body is invalid
 * @throws {UnauthorizedError} - If the user is not an end user
 * @throws {InternalServerError} - If there is an error while saving the card
 * */
const addNewCard = async (req, res, next) => {
    const { card_number, card_name, cvv, expiry_date } = req.body;
    const middle = card_number.slice(4, -4);
    const enduser = await Enduser.findOne({ user: req.user.id });

    // Check if user is an end user
    if (!enduser) return next(new UnauthorizedError('User is not an end user'));

    // Create new card
    const card = await Card.create({
        user: req.user.id,
        enduser: enduser._id,
        first_four_numbers: card_number.slice(0, 4),
        last_four_numbers: card_number.slice(-4),
        middle_numbers: encrypt(middle),
        card_name,
        cvv,
        expiry_date,
    });

    // Add card to user's payment info
    await PaymentInfo.findOneAndUpdate(
        { user: req.user.id },
        { $push: { cards: card._id } },
        { new: true, upsert: true }
    ).populate('cards user');

    // Remove sensitive data
    card.middle_numbers = '****';
    card.cvv = '****';
    card.user = undefined;
    card.enduser = undefined;

    res.status(200).send({
        success: true,
        message: 'Card added successfully',
        data: card,
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
