const express = require('express');
const controller = require("./controller");
const { writeOpportunityCheck, crmDashboardCheck, readTelesalesDashboardCheck} = require('../../../middleware/auth0');
const {authenticate} = require('../../../middleware/auth');
const router = express.Router();

router.get('/CRMDashboard' ,authenticate, crmDashboardCheck , controller.crmDashboard);
router.get('/teleSalesDashboard',authenticate, readTelesalesDashboardCheck ,controller.teleSalesDashboard);
router.put('/:id',authenticate, writeOpportunityCheck, controller.updateOpportunity);

module.exports = router;