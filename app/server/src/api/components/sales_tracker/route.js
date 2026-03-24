const express = require('express');
const controller = require('./controller');
const {readSalesTrackerCheck} = require('../../../middleware/auth0')
const router = express.Router();

router.get('/dashboardData', readSalesTrackerCheck, controller.dashboardData);
router.get('/salesRepData', readSalesTrackerCheck, controller.salesRepData);
router.get('/productData', readSalesTrackerCheck, controller.productData);
router.get('/orderReportData', readSalesTrackerCheck, controller.orderReportData);
router.get('/businessReportData', readSalesTrackerCheck, controller.businessReportData);
router.get('/customerRepData', readSalesTrackerCheck ,controller.customerRepData);

module.exports = router;
