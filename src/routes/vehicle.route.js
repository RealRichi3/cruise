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
const { basicAuth } = require('../middlewares/auth');
const rbacMiddleware = require('../middlewares/rbac');

router.use(basicAuth(), rbacMiddleware('rider'));

router
    .post('/add', addVehicle)
    .get('/:id', getVehicleData)
    .put('/:id', updateVehicleData)
    .delete('/:id', removeVehicle)
    .get('/riders-vehicles/:id', getRidersVehicles)
    .put('/activate/:id', activateVehicle)
    .put('/deactivate/:id', deactivateVehicle);

module.exports = router;
