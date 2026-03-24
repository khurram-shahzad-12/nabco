const SERVICE_INVENTORY = require('./service');
const SERVICE_INVENTORY_CATEGORY = require('../inventory_category/service');
const pdfkit_service = require("../../../utils/pdfkit_utility");
const PdfPrinter = require('pdfmake');
const PDFDocument = require("pdfkit");

const fonts = {
    Roboto: {
        normal: 'fonts/Roboto-Regular.ttf',
        bold: 'fonts/Roboto-Medium.ttf',
        italics: 'fonts/Roboto-Italic.ttf',
        bolditalics: 'fonts/Roboto-MediumItalic.ttf',
    },
};
const pdfPrinter = new PdfPrinter(fonts);

const LABEL_MISSING_CATEGORY = 'NoCategory';
const LABEL_MISSING_ITEM_NAME = '[ITEM NAME MISSING]';
const HEX_ROW_SHADE = '#e1e1e1';

const generateItemsListPDF = async (itemsIDList) => {
    const PICKLIST = {};
    const Inventory = await SERVICE_INVENTORY.fetchInventory({_id: {$in: itemsIDList}}, ['name', 'active', 'category']);
    const [Categories] = await fetchData([
        SERVICE_INVENTORY_CATEGORY.fetchInventoryCategories({}, ['name']),
    ]);
    for (const item of Inventory) {
        if(!item.active) continue;
        const itemCategory = item.category ?? LABEL_MISSING_CATEGORY;
        if (!PICKLIST[itemCategory]) PICKLIST[itemCategory] = {};
        if (!PICKLIST[itemCategory][item._id]) {
            PICKLIST[itemCategory][item._id] = {
                name: item.name ?? LABEL_MISSING_ITEM_NAME
            };
        }
    }
        const categoryBlocks = Object.keys(PICKLIST).sort((a,b)=>{
            const nameA =(Categories[a]?.name ?? a ??LABEL_MISSING_CATEGORY).trim().toUpperCase();
            const nameB =(Categories[b]?.name ?? b ??LABEL_MISSING_CATEGORY).trim().toUpperCase();
            return nameA.localeCompare(nameB);
        }).map(categoryId => {
        const categoryName = Categories[categoryId]?.name ?? LABEL_MISSING_CATEGORY;
        const items = Object.values(PICKLIST[categoryId]);
        const sortedItems = items.sort((a, b) =>
            pdfkit_service.cleantText(a.name).localeCompare(pdfkit_service.cleantText(b.name))
        );
        return {
            name: categoryName,
            items: sortedItems,
        };
    });
    const doc = pdfkit_service.createPDFDoc();
    pdfkit_service.registerFont(doc);
    pdfkit_service.renderTwoColumnList({
        doc,
        categories: categoryBlocks,
        fonts: { header: 'Roboto-Bold' },
        renderRow: ({ doc, item, x, y, columnWidth, idx }) => {
            const text = pdfkit_service.cleantText(item.name);
             const layout = pdfkit_service.calculateWrappedText({doc,text,columnWidth,font: 'Roboto-normal',fontSize: 10.5,lineGap: 0,padding: 8,
            });
            pdfkit_service.drawWrappedRow({
                doc,lines: layout.lines, quantity: '',x,y,columnWidth,lineHeight: layout.lineHeight + 2,rowHeight: layout.rowHeight,rowIndex: idx,
            });
            return layout.rowHeight;
        },
    });
    pdfkit_service.PDFFooter(doc);
    return doc;
};
const generateItemsInStockPDF = async (itemsIDList) => {
    const PICKLIST = {};
    const Inventory = await SERVICE_INVENTORY.fetchInventory({quantity: {$gt: 0}}, ['name', 'active', 'category']);
    const [Categories] = await fetchData([
        SERVICE_INVENTORY_CATEGORY.fetchInventoryCategories({}, ['name']),
    ]);
    for (const item of Inventory) {
        const itemCategory = item.category ?? LABEL_MISSING_CATEGORY;
        if (!PICKLIST[itemCategory]) PICKLIST[itemCategory] = {};
        if (!PICKLIST[itemCategory][item._id]) {
            PICKLIST[itemCategory][item._id] = {
                name: pdfkit_service.cleantText(item.name) ?? LABEL_MISSING_ITEM_NAME,
            };
        }
    }
    const sortedCategoryIds = Object.keys(PICKLIST).sort((a,b)=> {
        const A = (Categories[a]?.name ?? '').trim().toUpperCase();
        const B = (Categories[b]?.name ?? '').trim().toUpperCase();
        return A.localeCompare(B);
    });

    const categories = sortedCategoryIds.map(categoryId => ({
        name: Categories[categoryId]?.name ?? LABEL_MISSING_CATEGORY,
        items: Object.values(PICKLIST[categoryId]).sort((a, b) => a.name.localeCompare(b.name)),
    }));
    const doc = pdfkit_service.createPDFDoc();
    pdfkit_service.registerFont(doc);
    pdfkit_service.renderTwoColumnList({
        doc, categories,
        fonts: { header: 'Roboto-Bold', row: 'Roboto-normal' },
        renderRow: ({doc, item, x, y, columnWidth, idx}) => {
            const text = pdfkit_service.cleantText(item.name);
            const layout = pdfkit_service.calculateWrappedText({doc,text,columnWidth,font: 'Roboto-normal',fontSize: 10.5,lineGap: 0,padding: 8});
        pdfkit_service.drawWrappedRow({
            doc,lines: layout.lines,quantity: '', x,y,columnWidth,lineHeight: layout.lineHeight + 2,rowHeight: layout.rowHeight,rowIndex: idx,
        });
        return layout.rowHeight;
        }
    })
    pdfkit_service.PDFFooter(doc)
    return doc
};

const fetchData = (request) => {
    return Promise.all(request).then(values => {
        return values.map(list => list.reduce((a, v) => {
            const id = v._id;
            delete v._id;
            a[id] = v;
            return a;
        }, {}));
    });
};

module.exports = {
    generateItemsListPDF,
    generateItemsInStockPDF
};
