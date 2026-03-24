const express = require('express');
const controller = require('./controller');
const {readLeadsCheck, writeLeadsCheck} = require("../../../middleware/auth0");
const router = express.Router();

router.get('/' , readLeadsCheck ,controller.getAllLeads);
router.get('/getOnlyLeads' , readLeadsCheck ,controller.getOnlyLeads);
router.get('/getAllLeadOfSingleRep' , readLeadsCheck ,controller.getAllLeadOfSingleRep)
router.get('/:id' , readLeadsCheck ,controller.getSingleLead);
router.post('/' , writeLeadsCheck ,controller.createNewLead);
router.put('/:id' , writeLeadsCheck ,controller.updatedLead);
router.delete('/:id', writeLeadsCheck ,controller.deleteLead);

module.exports = router;
