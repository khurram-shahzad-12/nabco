const express = require('express');
const controller = require('./controller');
const controllerPDF = require('./controller.pdf');
const { readQuotationCheck, writeQuotationCheck } = require('../../../middleware/auth0');
const {authenticate} = require('../../../middleware/auth');
const router = express.Router();

router.post('/createQuotation.pdf' ,authenticate, writeQuotationCheck , controllerPDF.createQuotation);
router.post('/printSelected.pdf',authenticate, writeQuotationCheck ,controllerPDF.printSelectedQuotations);

router.post('/',authenticate, writeQuotationCheck ,controller.createNewQuotation);
router.get('/',authenticate, readQuotationCheck , controller.getAllQuotations);
router.put('/:id',authenticate, writeQuotationCheck ,controller.updateQuotation);
router.delete('/:id',authenticate, writeQuotationCheck ,controller.deleteQuotation);
router.post('/converttoinvoice',authenticate, writeQuotationCheck, controller.convertQuotationToInvoice);
module.exports = router;
