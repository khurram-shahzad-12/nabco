const express = require('express');
const controller = require('./controller');
const {readSalesTrackerCheck} = require('../../../middleware/auth0');
const {authenticate} = require('../../../middleware/auth');
const router = express.Router();

router.get('/dashboardData',authenticate, readSalesTrackerCheck, controller.dashboardData);
router.get('/salesRepData',authenticate, readSalesTrackerCheck, controller.salesRepData);
router.get('/productData',authenticate, readSalesTrackerCheck, controller.productData);
router.get('/orderReportData',authenticate, readSalesTrackerCheck, controller.orderReportData);
router.get('/businessReportData',authenticate, readSalesTrackerCheck, controller.businessReportData);
router.get('/customerRepData',authenticate, readSalesTrackerCheck ,controller.customerRepData);

module.exports = router;
