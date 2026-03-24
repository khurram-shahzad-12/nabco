const SERVICE_PDF = require('./service.pdf');

const createQuotation = async (req, res, next) => {
    try {
        const pdfDoc = await SERVICE_PDF.createQuotationPDF(req.body);
        res.contentType('application/pdf');
        pdfDoc.pipe(res);
        pdfDoc.end();
    } catch (e) {next(e) }
};
const printSelectedQuotations = async (req, res, next) => {
    try {
        const { ids } = req.body; 
        const pdfDoc = await SERVICE_PDF.printSelectedQuotations(ids);
        res.contentType('application/pdf');
        pdfDoc.pipe(res);
        pdfDoc.end();
    } catch (e) { next(e); }
};

module.exports = {
    createQuotation,
    printSelectedQuotations,
};
