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

router.use(basicAuth(), rbacMiddleware('rider admin superadmin'));

router
    .post('/add', addVehicle)
    .get(
        '/:id',
        rbacMiddleware('enduser rider admin superadmin'),
        getVehicleData
    )
    .put('/:id', updateVehicleData)
    .delete('/:id', removeVehicle)
    .get('/riders-vehicles/:id', getRidersVehicles)
    .put('/activate/:id', rbacMiddleware('admin superadmin'), activateVehicle)
    .put(
        '/deactivate/:id',
        rbacMiddleware('admin superadmin'),
        deactivateVehicle
    );

module.exports = router;
