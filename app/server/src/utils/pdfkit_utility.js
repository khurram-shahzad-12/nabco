const PDFDocument = require('pdfkit');

const registerFont = (doc) => {
    doc.registerFont('Roboto-normal', 'fonts/Roboto-Regular.ttf');
    doc.registerFont('Roboto-Bold', 'fonts/Roboto-Medium.ttf');
    doc.registerFont('Roboto-Italic', 'fonts/Roboto-Italic.ttf');
    doc.registerFont('Roboto-BoldItalic', 'fonts/Roboto-MediumItalic.ttf');
};

const cleantText = (text) => {
    return String(text || '').replace(/\u200B/g,'').replace(/\u00A0/g,'').replace(/[\r\n]+/g,'').trim();
}
const renderTwoColumnList = ({ doc, categories, renderRow, fonts }) => {
    const FOOTER_HEIGHT = 40;
    const COLUMN_GAP = 15;
    const PAGE_WIDTH = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const COLUMN_WIDTH = (PAGE_WIDTH - COLUMN_GAP) / 2;
    const PAGE_BOTTOM = doc.page.height - doc.page.margins.bottom - FOOTER_HEIGHT;
    let column = 0;
    let x = doc.page.margins.left;
    let y = doc.page.margins.top;

    const renderCategoryHeader = (name) => {
        doc.font(fonts.header).fontSize(12).fillColor('black').text(name, x, y, { width: COLUMN_WIDTH });
        y += 16;
    };
    const nextColumn = (header) => {
        if (column === 0) {
            column = 1;
            x = doc.page.margins.left + COLUMN_WIDTH + COLUMN_GAP;
        } else {
            doc.addPage();
            column = 0;
            x = doc.page.margins.left;
        }
        y = doc.page.margins.top;
        if (header) renderCategoryHeader(header);
    };
    categories.forEach((category) => {
        if (y + 20 > PAGE_BOTTOM) nextColumn();
        renderCategoryHeader(category.name);
        category.items.forEach((item, idx) => {
            const text = cleantText(item.name) || "Unknown";
            const textHeight = doc.heightOfString(text, {
                width: COLUMN_WIDTH - 40,
                lineGap: 6,
            });
            const rowHeight = Math.max(14, textHeight + 2);
            if (y + rowHeight > PAGE_BOTTOM) {
                nextColumn(category.name);
            }
            renderRow({doc, item, x, y, columnWidth: COLUMN_WIDTH, idx});
            y += rowHeight;
        });
        y += 10;
    });
};

const PDFFooter = (doc) => {
    const dateTimeString = new Date().toLocaleString('en-GB', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
});
 const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        const footerY = doc.page.height - 25;
        doc.font('Helvetica')
           .fontSize(8)
           .fillColor('#666666')
           .text(`Page ${i + 1} of ${range.count}`, 0, footerY, {
               width: doc.page.width,
               align: 'center'
           });
        doc.text(
            `Printed on: ${dateTimeString}`,
            doc.page.margins.left,
            footerY,
            {
                width: doc.page.width - doc.page.margins.right * 2,
                align: 'right'
            }
        );
    }
};
const createPDFDoc = ({ size = 'A4', margin = { top: 50, bottom: 10, left: 40, right: 40 }, bufferPages = true } = {}) => {
    const doc = new PDFDocument({
        size,
        margin,
        bufferPages,
    });
    return doc;
};
const calculateWrappedText = ({ doc, text, columnWidth, font = 'Roboto-normal', fontSize = 11, lineGap = 2, padding = 4 }) => {
    doc.font(font).fontSize(fontSize);
    const words = text.split(' ');
    let currentLine = '';
    const lines = [];
    for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (doc.widthOfString(testLine) > columnWidth - 40) {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) lines.push(currentLine);
    const lineHeight = fontSize + lineGap;
    const rowHeight = lines.length * lineHeight + padding;
    return { lines, rowHeight, lineHeight };
};
const drawWrappedRow = ({ doc, lines, quantity, x, y, columnWidth, lineHeight, rowHeight, rowIndex }) => {
    if (rowIndex % 2 === 0) {
        doc.save()
           .rect(x, y, columnWidth, rowHeight)
           .fill('#dadae1')
           .restore();
    }
    lines.forEach((line, idx) => {
        doc.fillColor('black').text(line, x + 4, y + 1 + idx * lineHeight, { width: columnWidth - 40 });
    });
    doc.text(quantity.toString(), x, y + 2, { width: columnWidth - 10, align: 'right' });
};
const renderSingleColumnList = ({ doc, categories, renderRow, renderHeader, fonts }) => {
    const FOOTER_HEIGHT = 40;
    const PAGE_WIDTH = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const COLUMN_WIDTH = PAGE_WIDTH;
    const PAGE_BOTTOM = doc.page.height - doc.page.margins.bottom - FOOTER_HEIGHT;
    let x = doc.page.margins.left;
    let y = doc.page.margins.top;
    if(renderHeader) {y += renderHeader({doc, x, y, columnWidth: COLUMN_WIDTH})};
    const renderCategoryHeader = (name) => {
        doc.font(fonts.header)
           .fontSize(12)
           .fillColor('black')
           .text(name, x, y, { width: COLUMN_WIDTH });
        y += 18;
    };
    const nextPage = (header) => {
        doc.addPage();
        x = doc.page.margins.left;
        y = doc.page.margins.top;
        if(renderHeader) {y += renderHeader({doc, x, y, columnWidth: COLUMN_WIDTH})}
        if (header) renderCategoryHeader(header);
    };
    categories.forEach((category) => {
        if (y + 20 > PAGE_BOTTOM) nextPage();
        renderCategoryHeader(category.name);
        category.items.forEach((item, idx) => {
            const text = cleantText(item.name) || "Unknown";
            const textHeight = doc.heightOfString(text, {
                width: COLUMN_WIDTH - 40,
                lineGap: 6,
            });
            const rowHeight = Math.max(16, textHeight + 4);
            if (y + rowHeight > PAGE_BOTTOM) { nextPage(category.name); }
            renderRow({
                doc,
                item,
                x,
                y,
                columnWidth: COLUMN_WIDTH,
                idx
            });
            y += rowHeight;
        });
        y += 12;
    });
};
module.exports = {
    createPDFDoc, 
    registerFont,
    cleantText,
    PDFFooter,
    renderTwoColumnList,
    drawWrappedRow,
    calculateWrappedText,
    renderSingleColumnList,
}