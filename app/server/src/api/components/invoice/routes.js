const express = require('express');
const controller = require('./controller');
const controllerPDF = require('./controller.pdf');
const {
    claimCheck,
} = require('express-oauth2-jwt-bearer');
const {
    readInvoicesCheck,
    editInvoicesCheck,
    writeInvoicePaymentsDataCheck,
    readCustomerStatementsCheck,
    writeInventoryCheck,
    allReadInvoicesCheck,
    allWriteInvoicesCheck
} = require('../../../middleware/auth0');

const router = express.Router();

router.all('/invoice.pdf', claimCheck(allReadInvoicesCheck, "Failed read invoices check"), controllerPDF.createInvoice);
router.all('/invoiceByZone.pdf', readInvoicesCheck, controllerPDF.createInvoiceByZone);
router.all('/invoiceByZoneMap.pdf', readInvoicesCheck, controllerPDF.createInvoiceByZoneMap);
router.all('/invoiceReprint.pdf', claimCheck(allReadInvoicesCheck, "Failed read invoices check"), controllerPDF.createInvoiceReprint);
router.all('/deliveryNote.pdf', claimCheck(allReadInvoicesCheck, "Failed read invoices check"), controllerPDF.deliveryNote);
router.post('/picklist.pdf', claimCheck(allReadInvoicesCheck, "Failed read invoices check"), controllerPDF.createPicklist);
router.post('/picklistshortages.pdf', readInvoicesCheck, controllerPDF.createPicklistShortages);
router.post('/zonerun.pdf', readInvoicesCheck, controllerPDF.createZoneRun);
router.post('/zonerunMap.pdf', readInvoicesCheck, controllerPDF.createZoneRunMap);
router.post('/vanloadshopwise.pdf', readInvoicesCheck, controllerPDF.createVanLoadShopwise);
router.post('/vanloadshopwiseMap.pdf', readInvoicesCheck, controllerPDF.createVanLoadShopwiseMap);
router.post('/customerstatement.pdf', readCustomerStatementsCheck, controllerPDF.createCustomerStatement);

router.post('/updateInvoiceItemPrices', claimCheck(allWriteInvoicesCheck, "Failed write invoices check"), controller.updateInvoiceItemPrices); //not used, just ignore for now
router.post('/updateInvoicesAfterWeightChange', writeInventoryCheck, controller.updateInvoicesAfterWeightChange);

router.get('/routeorders', readInvoicesCheck, controller.getOrderForRoute);
router.put('/updateorderpriority', editInvoicesCheck, controller.updateOrderPriority);
router.put('/recordPayments/:id', writeInvoicePaymentsDataCheck, controller.recordPayments);
router.get('/getCustomerAccountData', readInvoicesCheck, controller.getCustomerAccountsData);
router.get('/:id?', claimCheck(allReadInvoicesCheck, "Failed read invoices check"), controller.getInvoices);
router.post('/', claimCheck(allWriteInvoicesCheck, "Failed read invoices check"), controller.addInvoice);
router.post('/getItemHistory', claimCheck(allReadInvoicesCheck, "Failed read invoices check"), controller.getItemHistory);
router.get('/getUnpaidInvoices/:customerID', claimCheck(allReadInvoicesCheck, "Failed read invoices check"), controller.getUnpaidInvoices);
router.get('/emailInvoice/:id', claimCheck(allReadInvoicesCheck, "Failed read invoices check"), controller.emailInvoice);
router.get('/printed/:id/:printedStatus', claimCheck(allReadInvoicesCheck, "Failed read invoices check"), controller.updatedPrintedStatus);
router.get('/picked/:id/:pickedStatus', claimCheck(allReadInvoicesCheck, "Failed read invoices check"), controller.updatedPickedStatus);
router.put('/:id', editInvoicesCheck, controller.updateInvoice);
router.delete('/:id', editInvoicesCheck, controller.deleteInvoice);

module.exports = router;