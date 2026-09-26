const express = require('express');
const controller = require('./controller');
const {readLeadsCheck, writeLeadsCheck} = require("../../../middleware/auth0");
const {authenticate} = require('../../../middleware/auth');
const router = express.Router();

router.get('/' ,authenticate, readLeadsCheck ,controller.getAllLeads);
router.get('/getOnlyLeads' ,authenticate, readLeadsCheck ,controller.getOnlyLeads);
router.get('/getAllLeadOfSingleRep' ,authenticate, readLeadsCheck ,controller.getAllLeadOfSingleRep)
router.get('/:id' ,authenticate, readLeadsCheck ,controller.getSingleLead);
router.post('/' ,authenticate, writeLeadsCheck ,controller.createNewLead);
router.put('/:id' ,authenticate, writeLeadsCheck ,controller.updatedLead);
router.delete('/:id',authenticate, writeLeadsCheck ,controller.deleteLead);

module.exports = router;
