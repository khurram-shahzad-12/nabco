const createError = require('http-errors');
const SERVICE_PDF = require('./service.pdf');
const validate = require('./../../../utils/validate');

const generateItemsList = async (req, res, next) => {
    await streamPDF(req, res, next, SERVICE_PDF.generateItemsListPDF);
};

const generateItemsInStockList = async (req, res, next) => {
    await streamPDFItemsInStock(req, res, next, SERVICE_PDF.generateItemsInStockPDF);
};

const validateRequest = (req) => {
    if (Array.isArray(req.body.items) && req.body.items.length && validate.id(req.body.items, 'item')) {
        return [...(new Set(req.body.items))];
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

const streamPDFItemsInStock = async (req, res, next, pdfFn) => {
    try {
        const pdfDoc = await pdfFn();
        res.contentType('application/pdf');
        pdfDoc.pipe(res);
        pdfDoc.end();
    } catch (e) {next(e);}
};

module.exports = {
    generateItemsList,
    generateItemsInStockList
};
