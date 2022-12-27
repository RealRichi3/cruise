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

/**
 * Add a new vehicle
 *
 * @param {string} name - The name of the vehicle
 * @param {string} manufacturer - The manufacturer of the vehicle
 * @param {string} model - The model of the vehicle
 * @param {number} year - The year of the vehicle
 * @param {string} color - The color of the vehicle
 * @param {string} plate_number - The plate number of the vehicle
 *
 * @returns {Object} - The vehicle object
 *
 * @throws {BadRequestError} - If the request body is invalid
 * @throws {UnauthorizedError} - If the user is not a rider
 * @throws {InternalServerError} - If there is an error while saving the vehicle
 * */
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

    if (!rider) {
        return next(new UnauthorizedError('User is not a rider'));
    }

    vehicle.rider = rider._id;
    await vehicle.save();

    res.status(200).send({
        success: true,
        message: 'Vehicle added successfully',
        data: vehicle,
    });
};

/**
 * Get Vehicle data
 *
 * @param {string} id - The id of the vehicle
 *
 * @returns {Object} - The vehicle object
 *
 * @throws {BadRequestError} - If the vehicle id is invalid
 * @throws {InternalServerError} - If there is an error while getting the vehicle data
 * */
const getVehicleData = async (req, res, next) => {
    console.log('dsljfal;ksjdf;laskjdf')
    const vehicle_id = req.params.id;

    // Get vehicle data
    const vehicle = await Vehicle.findById(vehicle_id).populate({
        path: 'rider',
        select: 'phone address ',
        populate: {
            path: 'user',
            select: 'firstname lastname email'
        },
    });

    // Check if vehicle exists
    if (!vehicle) {
        return next(new BadRequestError('Vehicle not found'));
    }

    res.status(200).send({
        success: true,
        message: 'Vehicle data',
        data: vehicle,
    });
};

/**
 * Update vehicle data
 *
 * @param {string} id - The id of the vehicle
 *
 * @returns {Object} - The vehicle object
 *
 * @throws {BadRequestError} - If the vehicle id is invalid
 * @throws {UnauthorizedError} - If the user is not authorized to perform this action
 * @throws {InternalServerError} - If there is an error while updating the vehicle data
 * */
const updateVehicleData = async (req, res, next) => {
    const vehicle_id = req.params.id;
    const vehicle = await Vehicle.findById(vehicle_id).populate('rider');

    // Check if vehicle exists
    if (!vehicle) {
        return next(new BadRequestError('Vehicle not found'));
    }

    // Check if user is authorized to perform this action
    if (vehicle.rider.user != req.user.id) {
        return next(
            new UnauthorizedError(
                'You are not authorized to perform this action'
            )
        );
    }

    const { name, manufacturer, model, year, color, plate_number } = req.body;

    // Update vehicle data
    await vehicle.updateOne({
        name,
        manufacturer,
        model,
        year,
        color,
        plate_number,
    });

    res.status(200).send({
        success: true,
        message: 'Vehicle updated',
        data: vehicle,
    });
};

/**
 * Remove vehicle
 *
 * @param {string} id - The id of the vehicle
 *
 * @returns {Object} - The vehicle object
 *
 * @throws {BadRequestError} - If the vehicle id is invalid
 * @throws {UnauthorizedError} - If the user is not authorized to perform this action
 * @throws {InternalServerError} - If there is an error while removing the vehicle
 * */
const removeVehicle = async (req, res, next) => {
    const vehicle_id = req.params.id;
    const vehicle = await Vehicle.findById(vehicle_id).populate('rider');

    // Check if vehicle exists
    if (!vehicle) {
        return next(new BadRequestError('Vehicle not found'));
    }

    // Check if user is authorized to perform this action
    if (vehicle.rider.user != req.user.id) {
        return next(
            new UnauthorizedError(
                'You are not authorized to perform this action'
            )
        );
    }

    // Remove vehicle from rider
    await Rider.findOneAndUpdate(
        { user: req.user.id },
        { $pull: { vehicles: vehicle._id } },
        { $push: { removed_vehicles: vehicle._id } }
    );

    // Remove vehicle
    await vehicle.remove();

    res.status(200).send({
        success: true,
        message: 'Vehicle removed',
    });
};

/**
 * Get rider vehicles
 *
 * @param {string} id - The id of the rider
 *
 * @returns {Array} data - The rider vehicles
 *
 * @throws {UnauthorizedError} - If the user is not a rider
 * @throws {InternalServerError} - If there is an error while getting the vehicles
 * */
const getRidersVehicles = async (req, res, next) => {
    let rider;
    if (req.params.id) {
        console.log(req.params.id)
        // If rider id is provided
        rider = await Rider.findById(req.params.id).populate('vehicles');
    } else {
        // If rider id is not provided (get current rider)
        rider = await Rider.findOne({ user: req.user.id }).populate('vehicles');
    }

    if (!rider) return next(new UnauthorizedError('User is not a rider'));

    res.status(200).send({
        success: true,
        message: 'Vehicles retrieved',
        data: rider.vehicles,
    });
};

/**
 * Activate vehicle
 *
 * @param {string} id - The id of the vehicle
 *
 * @returns {Object} - The vehicle object
 *
 * @throws {BadRequestError} - If the vehicle id is invalid
 * @throws {InternalServerError} - If there is an error while activating the vehicle
 * */
const activateVehicle = async (req, res, next) => {
    const vehicle_id = req.params.id;

    const vehicle = await Vehicle.findById(vehicle_id);

    if (!vehicle) {
        return next(new BadRequestError('Vehicle not found'));
    }

    vehicle.isActive = true;
    await vehicle.save();

    res.status(200).send({
        success: true,
        message: 'Vehicle activated',
        data: vehicle,
    });
};

/**
 * Deactivate vehicle
 *
 * @param {string} id - The id of the vehicle
 *
 * @returns {Object} - The vehicle object
 *
 * @throws {BadRequestError} - If the vehicle id is invalid
 * @throws {InternalServerError} - If there is an error while deactivating the vehicle
 * */
const deactivateVehicle = async (req, res, next) => {
    const vehicle_id = req.params.id;

    const vehicle = await Vehicle.findById(vehicle_id);

    if (!vehicle) {
        return next(new BadRequestError('Vehicle not found'));
    }

    vehicle.isActive = false;
    await vehicle.save();

    res.status(200).send({
        success: true,
        message: 'Vehicle deactivated',
        data: vehicle,
    });
};

module.exports = {
    addVehicle,
    getVehicleData,
    updateVehicleData,
    removeVehicle,
    getRidersVehicles,
    activateVehicle,
    deactivateVehicle,
};
