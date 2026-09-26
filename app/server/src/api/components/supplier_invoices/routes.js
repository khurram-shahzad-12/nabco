const express = require('express');
const controller = require('./controller');
const controllerPDF = require('./controller.pdf');
const {readInventorySuppliersCheck, writeInventorySuppliersCheck, writeSupplierInvoicePaymentsCheck} = require('../../../middleware/auth0');
const {authenticate} = require('../../../middleware/auth');
const router = express.Router();

router.all('/supplierInvoices.pdf',authenticate, writeInventorySuppliersCheck, controllerPDF.printSupplierInvoices);
router.all('/supplierInvoicesVAT.pdf',authenticate, writeInventorySuppliersCheck, controllerPDF.printSupplierInvoicesVAT);
router.all('/supplierInvoicesVAT.xlsx',authenticate, writeInventorySuppliersCheck, controllerPDF.printSupplierInvoicesVATExcel);

router.get('/:id?',authenticate, readInventorySuppliersCheck, controller.getSupplierInvoices);
router.post('/',authenticate, writeInventorySuppliersCheck, controller.addSupplierInvoice);
router.put('/:id',authenticate, writeInventorySuppliersCheck, controller.updateSupplierInvoice);
router.delete('/:id',authenticate, writeInventorySuppliersCheck, controller.deleteSupplierInvoice);
router.put('/recordPayments/:id',authenticate, writeSupplierInvoicePaymentsCheck, controller.recordPayments);

module.exports = router;
