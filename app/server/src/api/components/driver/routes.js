const express = require('express');
const nameController = require('./name.controller');
const totalsController = require('./totals.controller');
const vehiclesController = require('./vehicle.controller');
const {writeDriverDetailsPermission, writeDriverTotalsPermission} = require('../../../middleware/auth0');
const {authenticate} = require('../../../middleware/auth')
const router = express.Router();

router.get('/name/:id?',authenticate, writeDriverDetailsPermission, nameController.getDrivers);
router.post('/name/',authenticate, writeDriverDetailsPermission, nameController.addDriver);
router.put('/name/:id',authenticate, writeDriverDetailsPermission, nameController.updateDriver);
router.delete('/name/:id',authenticate, writeDriverDetailsPermission, nameController.deleteDriver);

router.get('/total/:id?',authenticate, writeDriverTotalsPermission, totalsController.getDriverTotals);
router.post('/total/',authenticate, writeDriverTotalsPermission, totalsController.addDriverTotal);
router.put('/total/:id',authenticate, writeDriverTotalsPermission, totalsController.updateDriverTotal);
router.delete('/total/:id',authenticate, writeDriverTotalsPermission, totalsController.deleteDriverTotal);

router.put('/vehicle/availability',authenticate, writeDriverDetailsPermission, vehiclesController.changeAvailability);
router.get('/vehicle/:id?',authenticate, writeDriverDetailsPermission, vehiclesController.getVehicles);
router.post('/vehicle/',authenticate, writeDriverDetailsPermission, vehiclesController.addVehicle);
router.put('/vehicle/capacity',authenticate,  writeDriverDetailsPermission, vehiclesController.updateFields);
router.put('/vehicle/:id',authenticate, writeDriverDetailsPermission, vehiclesController.updateVehicle);
router.delete('/vehicle/:id', authenticate, writeDriverDetailsPermission, vehiclesController.deleteVehicle);

module.exports = router;
