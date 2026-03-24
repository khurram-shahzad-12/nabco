const createError = require('http-errors');
const SERVICE_PDF = require('./service.pdf');
const validate = require('./../../../utils/validate');

const createInvoice = async (req, res, next) => {
    await streamInvoicePDF(req, res, next, SERVICE_PDF.generateInvoicePDF, false, false, false);
};
const createInvoiceByZone = async (req, res, next) => {
    await streamInvoicePDF(req, res, next, SERVICE_PDF.generateInvoicePDF, false, true, false);
};
const createInvoiceByZoneMap = async (req, res, next) => {
    await streamInvoicePDF(req, res, next, SERVICE_PDF.generateInvoicePDF, false, false, true);
};
const createInvoiceReprint = async (req, res, next) => {
    await streamInvoicePDF(req, res, next, SERVICE_PDF.generateInvoicePDF, true, false, false);
};
const createPicklist = async (req, res, next) => {
    await streamPDF(req, res, next, SERVICE_PDF.generatePicklistPDF);
};
const createPicklistShortages = async (req, res, next) => {
    await streamPDF(req, res, next, SERVICE_PDF.generatePicklistShortagesPDF);
};
const createZoneRun = async (req, res, next) => {
    await streamPDF(req, res, next, SERVICE_PDF.generateZoneRunPDF, false, false);
};
const createZoneRunMap = async (req, res, next) => {
    await streamPDF(req, res, next, SERVICE_PDF.generateZoneRunPDF, false, true);
};
const createVanLoadShopwise = async (req, res, next) => {
    await streamPDF(req, res, next, SERVICE_PDF.generateVanLoadShopwisePDF, false, false);
};
const createVanLoadShopwiseMap = async (req, res, next) => {
    await streamPDF(req, res, next, SERVICE_PDF.generateVanLoadShopwisePDF, false, true);
};
const createCustomerStatement = async (req, res, next) => {
    await streamPDF(req, res, next, SERVICE_PDF.generateCustomerStatementPDF);
};

const validateRequest = (req) => {
    if (Array.isArray(req.body.invoices) && req.body.invoices.length && validate.id(req.body.invoices, 'invoice')) {
        return [...(new Set(req.body.invoices))];
    }
    throw new createError(400);
};
const streamPDF = async (req, res, next, pdfFn, reprint, byZoneMap) => {
    try {
        const pdfDoc = await pdfFn(validateRequest(req), reprint, byZoneMap);
        res.contentType('application/pdf');
        pdfDoc.pipe(res);
        pdfDoc.end();
    } catch (e) {next(e);}
};
const streamInvoicePDF = async (req, res, next, pdfFn, reprint, byZoneSort, byZoneSortMap) => {
    try {
        const pdfDoc = await pdfFn(validateRequest(req), reprint, byZoneSort, byZoneSortMap);
        res.contentType('application/pdf');
        res.send(pdfDoc);
    } catch (e) {next(e);}
};

module.exports = {
    createInvoice,
    createInvoiceByZone,
    createInvoiceReprint,
    createPicklist,
    createPicklistShortages,
    createZoneRun,
    createVanLoadShopwise,
    createCustomerStatement,
    createInvoiceByZoneMap,
    createZoneRunMap,
    createVanLoadShopwiseMap,
};
