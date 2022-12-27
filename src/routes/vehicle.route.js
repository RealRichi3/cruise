const express = require('express');
const router = express.Router();

const {
    addVehicle,
    getVehicleData,
    updateVehicleData,
    removeVehicle,
    getRidersVehicles,
    activateVehicle,
    deactivateVehicle,
} = require('../controllers/vehicle.controller');

router
    .post('/add', addVehicle)
    .get('/get/:id', getVehicleData)
    .put('/update/:id', updateVehicleData)
    .delete('/remove/:id', removeVehicle)
    .get('/get/riders-vehicles/:id', getRidersVehicles)
    .put('/activate/:id', activateVehicle)
    .put('/deactivate/:id', deactivateVehicle);

module.exports = router;
