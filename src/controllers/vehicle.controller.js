const {
    BadRequestError,
    UnauthenticatedError,
    UnauthorizedError,
} = require('../utils/errors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const mongoose = require('mongoose');

// Models
const { BlacklistedToken, AuthCode } = require('../models/token.model');
const {
    User,
    Status,
    Enduser,
    Rider,
    Admin,
} = require('../models/users.model');
const Password = require('../models/password.model');

// Utils
const config = require('../utils/config');
const asyncWrapper = require('../utils/async_wrapper');
const sendEmail = require('../utils/email');
const { getAuthCodes, getAuthTokens } = require('../utils/token');
const Vehicle = require('../models/vehicle.model');

const addVehicle = async (req, res, next) => {
    console.log(req.body);
    const { name, manufacturer, model, year, color, plate_number } = req.body;
    console.log(req.user);
    const vehicle = new Vehicle({
        name,
        manufacturer,
        model,
        year,
        color,
        plate_number,
    });

    const rider = await Rider.findOneAndUpdate(
        { user: req.user.id },
        { $push: { vehicles: vehicle._id } },
        { new: true }
    ).populate('vehicles');

    vehicle.rider = rider._id;
    await vehicle.save();

    res.status(200).send({
        success: true,
        message: 'Vehicle added successfully',
        data: vehicle,
    });
};

const getVehicleData = async (req, res, next) => {};

const updateVehicleData = async (req, res, next) => {};

const removeVehicle = async (req, res, next) => {};

const getRidersVehicles = async (req, res, next) => {};

const activateVehicle = async (req, res, next) => {};

const deactivateVehicle = async (req, res, next) => {};

module.exports = {
    addVehicle,
    getVehicleData,
    updateVehicleData,
    removeVehicle,
    getRidersVehicles,
    activateVehicle,
    deactivateVehicle,
};
