const express = require('express');
const controller = require('./controller');
const controllerPDF = require('./controller.pdf');
const {readInventorySuppliersCheck, writeInventorySuppliersCheck, writeSupplierInvoicePaymentsCheck} = require('../../../middleware/auth0');

const router = express.Router();

router.all('/supplierInvoices.pdf', writeInventorySuppliersCheck, controllerPDF.printSupplierInvoices);
router.all('/supplierInvoicesVAT.pdf', writeInventorySuppliersCheck, controllerPDF.printSupplierInvoicesVAT);
router.all('/supplierInvoicesVAT.xlsx', writeInventorySuppliersCheck, controllerPDF.printSupplierInvoicesVATExcel);

router.get('/:id?', readInventorySuppliersCheck, controller.getSupplierInvoices);
router.post('/', writeInventorySuppliersCheck, controller.addSupplierInvoice);
router.put('/:id', writeInventorySuppliersCheck, controller.updateSupplierInvoice);
router.delete('/:id', writeInventorySuppliersCheck, controller.deleteSupplierInvoice);
router.put('/recordPayments/:id', writeSupplierInvoicePaymentsCheck, controller.recordPayments);

module.exports = router;
