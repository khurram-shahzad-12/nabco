const SERVICE_PDF = require('./service.pdf');

const printCustomerItems = async (req, res, next) => {
    await streamPDF(req, res, next, SERVICE_PDF.printCustomerItemsList);
};

const streamPDF = async (req, res, next, pdfFn, reprint) => {
    try {
        const pdfDoc = await pdfFn(req.params.id, reprint, req.query);
        res.contentType('application/pdf');
        pdfDoc.pipe(res);
        pdfDoc.end();
    } catch (e) {next(e);}
};

module.exports = {
    printCustomerItems
};
