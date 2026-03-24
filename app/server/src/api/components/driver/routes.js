const express = require('express');
const nameController = require('./name.controller');
const totalsController = require('./totals.controller');
const vehiclesController = require('./vehicle.controller');
const {writeDriverDetailsPermission, writeDriverTotalsPermission} = require('../../../middleware/auth0');

const router = express.Router();

router.get('/name/:id?', writeDriverDetailsPermission, nameController.getDrivers);
router.post('/name/', writeDriverDetailsPermission, nameController.addDriver);
router.put('/name/:id', writeDriverDetailsPermission, nameController.updateDriver);
router.delete('/name/:id', writeDriverDetailsPermission, nameController.deleteDriver);

router.get('/total/:id?', writeDriverTotalsPermission, totalsController.getDriverTotals);
router.post('/total/', writeDriverTotalsPermission, totalsController.addDriverTotal);
router.put('/total/:id', writeDriverTotalsPermission, totalsController.updateDriverTotal);
router.delete('/total/:id', writeDriverTotalsPermission, totalsController.deleteDriverTotal);

router.put('/vehicle/availability', writeDriverDetailsPermission, vehiclesController.changeAvailability);
router.get('/vehicle/:id?', writeDriverDetailsPermission, vehiclesController.getVehicles);
router.post('/vehicle/', writeDriverDetailsPermission, vehiclesController.addVehicle);
router.put('/vehicle/capacity',  writeDriverDetailsPermission, vehiclesController.updateFields);
router.put('/vehicle/:id', writeDriverDetailsPermission, vehiclesController.updateVehicle);
router.delete('/vehicle/:id', writeDriverDetailsPermission, vehiclesController.deleteVehicle);

module.exports = router;
