const createError = require('http-errors');
const SERVICE_PDF = require('./service.pdf');
const validate = require('./../../../utils/validate');

const printSupplierInvoices = async (req, res, next) => {
    await streamPDF(req, res, next, SERVICE_PDF.printSupplierInvoicesList);
};

const printSupplierInvoicesVAT = async (req, res, next) => {
    await streamPDF(req, res, next, SERVICE_PDF.printSupplierInvoicesVATList);
};

const validateRequest = (req) => {
    if (Array.isArray(req.body) && req.body.length && validate.id(req.body, '_id')) {
        return [...(new Set(req.body))];
    }
    throw new createError(400);
};

const streamPDF = async (req, res, next, pdfFn) => {
    try {
        const pdfDoc = await pdfFn(validateRequest(req));
        res.contentType('application/pdf');
        pdfDoc.pipe(res);
        pdfDoc.end();
    } catch (e) {next(e);}
};

const printSupplierInvoicesVATExcel = async (req, res, next) => {
    const buffer = await SERVICE_PDF.printSupplierInvoicesVATListExcel(req.body);
    res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=SupplierInvoicesList.xlsx');
    res.send(buffer);
};


module.exports = {
    printSupplierInvoices,
    printSupplierInvoicesVAT,
    printSupplierInvoicesVATExcel,
};
