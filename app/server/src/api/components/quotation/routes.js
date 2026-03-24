const express = require('express');
const controller = require('./controller');
const controllerPDF = require('./controller.pdf');
const { readQuotationCheck, writeQuotationCheck } = require('../../../middleware/auth0');
const router = express.Router();

router.post('/createQuotation.pdf' , writeQuotationCheck , controllerPDF.createQuotation);
router.post('/printSelected.pdf', writeQuotationCheck ,controllerPDF.printSelectedQuotations);

router.post('/',writeQuotationCheck ,controller.createNewQuotation);
router.get('/', readQuotationCheck , controller.getAllQuotations);
router.put('/:id', writeQuotationCheck ,controller.updateQuotation);
router.delete('/:id', writeQuotationCheck ,controller.deleteQuotation);
module.exports = router;
