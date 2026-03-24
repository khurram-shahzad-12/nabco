const SERVICE_PDF = require('./service.pdf');

const printCustomerGroupItems = async (req, res, next) => {
    await streamPDF(req, res, next, SERVICE_PDF.printCustomerGroupItemsList);
};

const streamPDF = async (req, res, next, pdfFn, reprint) => {
    try {
        const pdfDoc = await pdfFn(req.params.id, reprint);
        res.contentType('application/pdf');
        pdfDoc.pipe(res);
        pdfDoc.end();
    } catch (e) {next(e);}
};

module.exports = {
    printCustomerGroupItems
};
