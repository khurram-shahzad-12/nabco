const moment = require('moment');
const pdfkit_service = require("../../../utils/pdfkit_utility");
const SERVICE_INVENTORY = require("../inventory/service");
const SERVICE_QUOTATION = require('../quotation/service');
const currentConfig = require('../../../utils/appConfig');

const addQuotationToPDF = (doc, quotation, imageMap) => {
    const { customerInfo, items, total_no_vat, vat_total, total_incl_vat, quotationNo } = quotation;
    const marginLeft = 50;
    const marginRight = 50;
    const marginTop = 50;
    const pageWidth = doc.page.width - marginLeft - marginRight;
    let y = marginTop;
    doc.image(currentConfig.logo, marginLeft, y, { width: 60 });
    doc.font('Roboto-Bold').fontSize(16).text(currentConfig.companyName, 0, y, { align: 'center' }); y += 22;
    doc.font('Roboto-normal').fontSize(9).text(currentConfig.address, 0, y, { align: 'center' }); y += 15;
    doc.font('Roboto-normal').fontSize(9).text(`Tel: ${currentConfig.phone} | Email: ${currentConfig.email}`, 0, y, { align: 'center' }); y += 30;
    doc.font('Roboto-Bold').fontSize(20).text('QUOTATION', 0, y, { align: 'center' }); y += 30;
    const quotationNumber = quotationNo || "";
    const date = moment(quotation.createdAt).format('DD/MM/YYYY');
    doc.font('Roboto-Bold').fontSize(10);
    doc.text(`Quotation No: ${quotationNumber}`, marginLeft, y);
    doc.text(`Date: ${date}`, marginLeft + 400, y); y += 20;
    doc.font('Roboto-Bold').fontSize(11).text('Bill To:', marginLeft, y); y += 15;
    doc.font('Roboto-normal').fontSize(10);
    doc.text(customerInfo.customer_name, marginLeft, y); y += 15;
    doc.text(`Phone: ${customerInfo.phone}`, marginLeft, y); y += 30;
    const colWidths = { image: 50, name: 250, qty: 60, unitPrice: 60, total: 60 };
    let totalTableWidth = Object.values(colWidths).reduce((a, b) => a + b, 0);
    if (totalTableWidth > pageWidth) {
        const scale = pageWidth / totalTableWidth;
        Object.keys(colWidths).forEach(key => { colWidths[key] = Math.floor(colWidths[key] * scale); });
        totalTableWidth = Object.values(colWidths).reduce((a, b) => a + b, 0);
    }
    let colX = {};
    let x = marginLeft;
    for (let col in colWidths) {
        colX[col] = x;
        x += colWidths[col];
    }
    const drawLine = (yPos) => {doc.moveTo(marginLeft, yPos).lineTo(marginLeft + totalTableWidth, yPos).stroke(); };
    const drawHeaderRow = () => {
        doc.font('Roboto-Bold').fontSize(10);
        doc.text('Image', colX.image, y, { width: colWidths.image, align: 'center' });
        doc.text('Item', colX.name, y, { width: colWidths.name, align: 'center' });
        doc.text('Qty', colX.qty, y, { width: colWidths.qty, align: 'right' });
        doc.text('Unit Price', colX.unitPrice, y, { width: colWidths.unitPrice, align: 'right' });
        doc.text('Total', colX.total, y, { width: colWidths.total, align: 'right' });
        drawLine(y + 12);
        y += 20;
    };
    const drawItemRow = (item) => {
        const name = pdfkit_service.cleantText(item.name || '');
        const qty = (item.quantity || 0).toString();
        const unitPrice = item.rate.toFixed(2) || '0.00';
        const total = (item.quantity * item.rate * (1 + (item.tax || 0) / 100)).toFixed(2);
        const imgBuffer = imageMap[item.productId];
        const nameLayout = pdfkit_service.calculateWrappedText({
            doc,
            text: name,
            columnWidth: colWidths.name,
            font: 'Roboto-normal',
            fontSize: 10,
            lineGap: 2,
            padding: 0
        });
        const textHeight = nameLayout.rowHeight;
        const imgHeight = imgBuffer ? 30 : 0;
        const rowHeight = Math.max(imgHeight, textHeight) + 1;
        if (y + rowHeight > doc.page.height - 50) {
            doc.addPage();
            y = marginTop;
            drawHeaderRow();
        }
        if (imgBuffer) {
            const imgY = y + (rowHeight - 25) / 2;
            doc.image(imgBuffer, colX.image, imgY, { width: 25, height: 25 });
        }
        pdfkit_service.drawWrappedRow({
            doc,
            lines: nameLayout.lines,
            quantity: '',
            x: colX.name,
            y,
            columnWidth: colWidths.name,
            lineHeight: nameLayout.lineHeight,
            rowHeight: textHeight,
            rowIndex: 0
        });
        doc.font('Roboto-normal').fontSize(10);
        doc.text(qty, colX.qty, y, { width: colWidths.qty, align: 'right' });
        doc.text(unitPrice, colX.unitPrice, y, { width: colWidths.unitPrice, align: 'right' });
        doc.text(total, colX.total, y, { width: colWidths.total, align: 'right' });
        y += rowHeight + 4;
    };
    drawHeaderRow();
    items.forEach(item => drawItemRow(item));
    drawLine(y);
    y += 15;
    const labelX = marginLeft + totalTableWidth - colWidths.total - 100;
    const labelWidth = 100;
    doc.font('Roboto-Bold').fontSize(10);
    doc.text('Subtotal:', labelX, y, { width: labelWidth, align: 'right' });
    doc.text(`£${total_no_vat.toFixed(2)}`, colX.total, y, { width: colWidths.total, align: 'right' });
    y += 15;
    doc.text('Total VAT:', labelX, y, { width: labelWidth, align: 'right' });
    doc.text(`£${vat_total.toFixed(2)}`, colX.total, y, { width: colWidths.total, align: 'right' });
    y += 20;
    doc.font('Roboto-Bold').fontSize(12);
    doc.text('Grand Total:', labelX, y, { width: labelWidth, align: 'right' });
    doc.text(`£${total_incl_vat.toFixed(2)}`, colX.total, y, { width: colWidths.total, align: 'right' });
    y += 30;
};

const createQuotationPDF = async (data) => {
   const itemIds = data.items.map(item => item._id);
   const imageMap = await SERVICE_INVENTORY.getMultipleImages(itemIds);
   const doc = pdfkit_service.createPDFDoc();
   pdfkit_service.registerFont(doc);
   addQuotationToPDF(doc, data, imageMap);
   pdfkit_service.PDFFooter(doc);
   return doc;
};

const printSelectedQuotations = async (quotationIds) => {
    const quotations = await SERVICE_QUOTATION.getQuotationsByIds(quotationIds);
    if(!quotations || quotations.length === 0) {throw new Error("No quotation found");}
    const allItemIds = [];
    quotations.forEach(quotation => {
        if (quotation.items && Array.isArray(quotation.items)) {
            quotation.items.forEach(item => allItemIds.push(item.productId));
        }
    });
    const uniqueItemIds = [...new Set(allItemIds)];
    const imageMap = await SERVICE_INVENTORY.getMultipleImages(uniqueItemIds);
    const doc = pdfkit_service.createPDFDoc();
    pdfkit_service.registerFont(doc);
    quotations.forEach((quotation, index) => {
        if (index > 0) { doc.addPage(); }
        addQuotationToPDF(doc, quotation, imageMap);
    });
    pdfkit_service.PDFFooter(doc);
    return doc;
}
module.exports = {
    createQuotationPDF,
    printSelectedQuotations,
};
