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
    .get(
        '/get/:id',
        rbacMiddleware('enduser rider admin superadmin'),
        getVehicleData
    )
    .put('/update/:id', updateVehicleData)
    .get('/riders-vehicles', getRidersVehicles)
    .delete('/remove/:id', removeVehicle)
    .put('/activate/:id', rbacMiddleware('admin superadmin'), activateVehicle)
    .put(
        '/deactivate/:id',
        rbacMiddleware('admin superadmin'),
        deactivateVehicle
    );

module.exports = router;
