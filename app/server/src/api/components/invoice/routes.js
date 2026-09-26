const express = require('express');
const controller = require('./controller');
const controllerPDF = require('./controller.pdf');
const {
    readInvoicesCheck,
    editInvoicesCheck,
    writeInvoicePaymentsDataCheck,
    readCustomerStatementsCheck,
    writeInventoryCheck,
    allReadInvoicesCheck,
    allWriteInvoicesCheck
} = require('../../../middleware/auth0');
const {authenticate} = require("../../../middleware/auth")
const router = express.Router();

router.all('/invoice.pdf',authenticate, allReadInvoicesCheck, controllerPDF.createInvoice);
router.all('/invoiceByZone.pdf',authenticate, readInvoicesCheck, controllerPDF.createInvoiceByZone);
router.all('/invoiceByZoneMap.pdf',authenticate, readInvoicesCheck, controllerPDF.createInvoiceByZoneMap);
router.all('/invoiceReprint.pdf',authenticate, allReadInvoicesCheck, controllerPDF.createInvoiceReprint);
router.post('/picklist.pdf',authenticate, allReadInvoicesCheck, controllerPDF.createPicklist);
router.post('/picklistshortages.pdf',authenticate, readInvoicesCheck, controllerPDF.createPicklistShortages);
router.post('/zonerun.pdf',authenticate, readInvoicesCheck, controllerPDF.createZoneRun);
router.post('/zonerunMap.pdf',authenticate, readInvoicesCheck, controllerPDF.createZoneRunMap);
router.post('/vanloadshopwise.pdf',authenticate, readInvoicesCheck, controllerPDF.createVanLoadShopwise);
router.post('/vanloadshopwiseMap.pdf',authenticate, readInvoicesCheck, controllerPDF.createVanLoadShopwiseMap);
router.post('/customerstatement.pdf',authenticate, readCustomerStatementsCheck, controllerPDF.createCustomerStatement);

router.post('/updateInvoiceItemPrices',authenticate, allWriteInvoicesCheck, controller.updateInvoiceItemPrices); //not used, just ignore for now
router.post('/updateInvoicesAfterWeightChange',authenticate, writeInventoryCheck, controller.updateInvoicesAfterWeightChange);

router.get('/routeorders',authenticate, readInvoicesCheck, controller.getOrderForRoute);
router.put('/updateorderpriority',authenticate, editInvoicesCheck, controller.updateOrderPriority);
router.put('/recordPayments/:id',authenticate, writeInvoicePaymentsDataCheck, controller.recordPayments);
router.get('/getCustomerAccountData',authenticate, readInvoicesCheck, controller.getCustomerAccountsData);
router.get('/:id?',authenticate, allReadInvoicesCheck, controller.getInvoices);
router.post('/', authenticate, allWriteInvoicesCheck, controller.addInvoice);
router.post('/getItemHistory',authenticate, allReadInvoicesCheck, controller.getItemHistory);
router.get('/getUnpaidInvoices/:customerID', authenticate, allReadInvoicesCheck, controller.getUnpaidInvoices);
router.get('/emailInvoice/:id',authenticate, allReadInvoicesCheck, controller.emailInvoice);
router.get('/printed/:id/:printedStatus',authenticate, allReadInvoicesCheck, controller.updatedPrintedStatus);
router.get('/picked/:id/:pickedStatus',authenticate, allReadInvoicesCheck, controller.updatedPickedStatus);
router.put('/:id',authenticate, editInvoicesCheck, controller.updateInvoice);
router.delete('/:id', authenticate, editInvoicesCheck, controller.deleteInvoice);

module.exports = router;