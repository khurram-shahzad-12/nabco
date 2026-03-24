const express = require('express');
const controller = require("./controller");
const { writeOpportunityCheck, crmDashboardCheck, readTelesalesDashboardCheck} = require('../../../middleware/auth0');
const router = express.Router();

router.get('/CRMDashboard' , crmDashboardCheck , controller.crmDashboard);
router.get('/teleSalesDashboard', readTelesalesDashboardCheck ,controller.teleSalesDashboard);
router.put('/:id', writeOpportunityCheck, controller.updateOpportunity);

module.exports = router;