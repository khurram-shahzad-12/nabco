const SERVICE_INVOICE = require('./service');
const SERVICE_CUSTOMER = require('./../customer/service');
const SERVICE_INVENTORY = require('./../inventory/service');
const SERVICE_INVENTORY_CATEGORY = require('./../inventory_category/service');
const SERVICE_INVENTORY_SUPPLIER = require('./../inventory_supplier/service');
const SERVICE_VAT = require('./../vat/service');
const SERVICE_ZONE = require('./../zone/service');
const SERVICE_PAYMENT_TERM = require('./../payment_term/service');
const PdfPrinter = require('pdfmake');
const moment = require('moment');
const PDFMerger = require('pdf-merger-js');
const fs = require('fs');
const {getInvoiceConfigForDate, getLatestInvoiceConfig} = require("../../../config.env");
const { v4: uuidv4 } = require('uuid');
const {once} = require('node:events');
const PDFDocument = require("pdfkit");
const pdfkit_service = require("../../../utils/pdfkit_utility");
const currentConfig = require('../../../utils/appConfig');

const momentFormat = 'DD/MM/YYYY';
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
const LABEL_MISSING_SUPPLIER_2 = 'NoSecondarySupplier';
const LABEL_MISSING_ITEM_NAME = '[ITEM NAME MISSING]';
const HEX_ROW_SHADE = '#e1e1e1';
const HEX_CUSTOMER_STATEMENT_HEADER_ROW_SHADE = '#009d52';

const generateInvoicePDF = async (invoiceIDList, reprint = false, byZoneSort = false, byZoneSortMap = false) => {
    const neededData = {
        customers: new Set(),
        items: new Set(),
        vats: new Set(),
    };
    let Invoices = await SERVICE_INVOICE.fetchInvoices({_id: {$in: invoiceIDList}},
        ['invoice_date', 'sale_number', 'customer', 'cash_invoice', 'remarks', 'items', 'total_no_vat', 'vat_total', 'total_incl_vat', 'in_person', 'created_by', 'zone'],
    );
    for (const invoice of Invoices) {
        invoice.analysisVAT = {};
        neededData.customers.add(invoice.customer.toString());
        for (const item of invoice.items) {
            neededData.items.add(item._id.toString());
            neededData.vats.add(item.vat.toString());
            if (!invoice.analysisVAT.hasOwnProperty(item.tax)) {
                invoice.analysisVAT[item.tax] = {
                    vatId: item.vat.toString(),
                    goods_value: 0,
                    vat_value: 0,
                };
            }
            item.price = +(item.rate * item.quantity).toFixed(2);
            invoice.analysisVAT[item.tax].goods_value += item.price;
            invoice.analysisVAT[item.tax].vat_value += item.price * (item.tax / 100);
        }
    }
    const [Customers, Inventory, VAT, Zones, PaymentTerms] = await fetchData([
        SERVICE_CUSTOMER.fetchCustomers({_id: {$in: [...neededData.customers]}},
            ['legal_entity', 'customer_name', 'mobile', 'phone', 'address', 'city', 'postcode', 'payment_term', 'print_outstanding_balances', 'zones', 'delivery_order'],
        ),
        SERVICE_INVENTORY.fetchInventory({_id: {$in: [...neededData.items]}}, ['name', 'barcode', 'tax']),
        SERVICE_VAT.fetchVAT({_id: {$in: [...neededData.vats]}}, ['name', 'rate', 'order']),
        SERVICE_ZONE.fetchZones({}, ['name', 'order']),
        SERVICE_PAYMENT_TERM.fetchPaymentTerms()
    ]);
    if(byZoneSort) {
        Invoices = Invoices.sort((invoiceA, invoiceB) => {
            const invoiceA_DayOfWeek = invoiceA.invoice_date.getDay();
            const invoiceA_Zone = Zones[Customers[invoiceA.customer].zones[invoiceA_DayOfWeek]];
            const invoiceA_DeliveryOrder = Customers[invoiceA.customer].delivery_order[invoiceA_DayOfWeek];

            const invoiceB_DayOfWeek = invoiceB.invoice_date.getDay();
            const invoiceB_Zone = Zones[Customers[invoiceB.customer].zones[invoiceB_DayOfWeek]];
            const invoiceB_DeliveryOrder = Customers[invoiceB.customer].delivery_order[invoiceB_DayOfWeek];

            if(invoiceA_Zone.order === invoiceB_Zone.order) {
                return invoiceA_DeliveryOrder < invoiceB_DeliveryOrder ? -1 :
                    invoiceA_DeliveryOrder > invoiceB_DeliveryOrder ? 1 : 0;
            } else {
                return invoiceA_Zone.order < invoiceB_Zone.order ? -1 : 1;
            }
        });
    }
    if(byZoneSortMap){
        Invoices = Invoices.sort((invoiceA, invoiceB)=>{
            const parseZone = (zone) => {
                const match = zone.match(/Zone - (\w+)\((\d+)\)/);
                if(!match){return [Infinity, Infinity]};
                const [_, zoneName, subNum] = match;
                let zoneOrder;
                if(zoneName.toLowerCase() === 'office') zoneOrder = 0;
                else zoneOrder = parseInt(zoneName, 10) || 9999;
                return [zoneOrder, parseInt(subNum, 10)];
            }
            const [zoneA, subA] = parseZone(invoiceA.zone);
            const [zoneB, subB] = parseZone(invoiceB.zone);
            if(zoneA !== zoneB) return zoneA - zoneB;
            return subA - subB;
        })
    };
    let unpaidInvoices = {};
    for (const invoice of Invoices) {
        if(unpaidInvoices[invoice.customer]) {
            continue;
        }
        if(Customers[invoice.customer].print_outstanding_balances) {
            unpaidInvoices[invoice.customer] = await SERVICE_INVOICE.fetchUnpaidInvoicesForCustomer(invoice.customer);
        }
    }
    const footerFunction = function(currentPage, pageCount, customerID, cashInvoice, footerText) {
        const pageString = 'Page ' + currentPage.toString() + ' of ' + pageCount;
        return {
            style: 'footer',
            fontSize: 8,
            columns: [
                {text: footerText, width: '*'},
                {text: `${cashInvoice ? 'CASH INVOICE' : Customers[customerID].customer_name}${currentPage === pageCount ? "\n[END OF INVOICE]" : ""}`, width: "15%"},
                {text: pageString, width: "10%"}
            ]
        }
    };
    const UNDERSCORE = "_________________________________";
    const SIGNATURE_CELL_MARGIN = [1, 10, 1, 1];
    const getInvoiceDefinition = invoice => {
        const currentInvoiceConfigData = getInvoiceConfigForDate(invoice.invoice_date);
        return {
            pageMargins: [20, 90, 20, 50],
            defaultStyle: {font: 'Roboto', fontSize: 10},
            header: {
                style: 'header',
                columns: [
                    {image: currentConfig.logo, width: 140, height: 75},
                    {text: invoice.in_person ? "COLLECTION" : "DELIVERY", width: '*', bold: true, alignment: 'center'},
                    {
                        text: currentInvoiceConfigData.addressLines.join("\n"), width: '40%',
                    },
                ],
            },
            footer: (currentPage, pageCount) => footerFunction(currentPage, pageCount, invoice.customer, invoice.cash_invoice, currentInvoiceConfigData.footer),
            content: [
                '\n\n',
                {
                    columns: [
                        {
                            text: invoice.cash_invoice ? '' : [
                                `${Customers[invoice.customer].legal_entity}\n`,
                                `T/A\n`,
                                `${Customers[invoice.customer].customer_name}\n`,
                                `${Customers[invoice.customer].mobile}\n`,
                                `${Customers[invoice.customer].address}\n`,
                                `${Customers[invoice.customer].city}\n`,
                                `${Customers[invoice.customer].postcode}\n`,
                            ],
                            width: '40%',
                        },
                        {text: Customers[invoice.customer].payment_term ? `Payment Term: ${PaymentTerms[Customers[invoice.customer].payment_term]?.name}\n` : "Payment Term: PAYMENT ON DELIVERY", fontSize: 12, bold: true, width: "35%"},
                        {
                            text: [
                                {text: invoice.cash_invoice ? `CASH INVOICE${reprint ? " - REPRINT" : ""}\n` : `INVOICE${reprint ? " - REPRINT" : ""}\n`, fontSize: 12, bold: true},
                                `Number: ${invoice.sale_number}\n`,
                                `Date: ${moment(invoice.invoice_date).format(momentFormat)}\n`,
                                `${invoice.created_by === 'OrderLion App' ? 'Order By: OrderLion App': ''}\n`
                            ],
                            width: '25%',
                        },
                    ],
                },  
                {
                    text: invoice.remarks ? [
                        {text: '\nRemarks\n', fontSize: 8},
                        {text: invoice.remarks},
                    ] : '',
                },
                '\n\n',
                {
                    layout: 'headerLineOnly',
                    table: {
                        dontBreakRows: true,
                        widths: ['15%', '45%', '10%', '10%', '10%', '10%'],
                        headerRows: 1,
                        body: invoice.items.reduce((a, item) => {
                            a.push([
                                {text: Inventory[item._id]?.barcode ?? (item.barcode ? item.barcode : ''), noWrap: true},
                                {text: Inventory[item._id]?.name ?? (item.name ? item.name : LABEL_MISSING_ITEM_NAME)},
                                {text: item.rate.toFixed(2), alignment: 'right', noWrap: true},
                                {text: item.quantity, alignment: 'right', noWrap: true},
                                {text: VAT[item.vat.toString()]?.name ?? item.tax, alignment: 'right', noWrap: true},
                                {text: item.price.toFixed(2), alignment: 'right', noWrap: true},
                            ]);
                            return a;
                        }, [
                            [
                                {text: 'Item#', style: 'tableHeader'},
                                {text: 'Item Name', style: 'tableHeader'},
                                {text: 'Unit Price', style: 'tableHeader', alignment: 'right'},
                                {text: 'Quantity', style: 'tableHeader', alignment: 'right'},
                                {text: 'VAT Code', style: 'tableHeader', alignment: 'right'},
                                {text: 'Total', style: 'tableHeader', alignment: 'right'},
                            ],
                        ]),
                    },
                },
                '\n\n',
                {
                    columns: [
                        {
                            width: '50%',
                            unbreakable: true,
                            layout: 'headerLineOnly',
                            table: {
                                dontBreakRows: true,
                                widths: ['20%', '20%', '30%', '30%'],
                                headerRows: 2,
                                body: Object.keys(invoice.analysisVAT)
                                    .sort((x, y) => (VAT[invoice.analysisVAT[x].vatId]?.order ?? -1) < (VAT[invoice.analysisVAT[y].vatId]?.order ?? -1) ? -1 : 1)
                                    .reduce((a, v) => {
                                        if (!invoice.analysisVAT.hasOwnProperty(v)) return a;
                                        a.push([
                                            {text: VAT[invoice.analysisVAT[v].vatId]?.name ?? ''},
                                            {text: v},
                                            {
                                                text: invoice.analysisVAT[v].goods_value.toFixed(2),
                                                alignment: 'right', noWrap: true,
                                            },
                                            {
                                                text: invoice.analysisVAT[v].vat_value.toFixed(2),
                                                alignment: 'right', noWrap: true,
                                            },
                                        ]);
                                        return a;
                                    }, [
                                        [{text: 'VAT Analysis', style: 'tableHeader', colSpan: 4, alignment: 'center'}, {}, {}, {}],
                                        [
                                            {text: 'Code', style: 'tableHeader'},
                                            {text: 'Rate', style: 'tableHeader'},
                                            {text: 'Goods Value', style: 'tableHeader', alignment: 'right'},
                                            {text: 'VAT Value', style: 'tableHeader', alignment: 'right'},
                                        ],
                                    ]),
                            },
                        },
                        {text: '', width: '*'},
                        {
                            width: '40%',
                            unbreakable: true,
                            layout: 'headerLineOnly',
                            table: {
                                dontBreakRows: true,
                                widths: ['50%', '50%'],
                                headerRows: 0,
                                body: [
                                    [
                                        {text: 'Subtotal'},
                                        {text: invoice.total_no_vat.toFixed(2), alignment: 'right', noWrap: true},
                                    ],
                                    [
                                        {text: 'VAT Amount'},
                                        {text: invoice.vat_total.toFixed(2), alignment: 'right', noWrap: true},
                                    ],
                                    [
                                        {text: 'Invoice Amount', bold: true},
                                        {
                                            text: invoice.total_incl_vat.toFixed(2),
                                            alignment: 'right',
                                            bold: true,
                                            noWrap: true,
                                        },
                                    ],
                                ],
                            }
                        },
                    ],
                },
                '\n\n',
                unpaidInvoices[invoice.customer] && unpaidInvoices[invoice.customer].length && [
                    {
                        columns: [
                            {
                                width: '60%',
                                layout: 'headerLineOnly',
                                table: {
                                    dontBreakRows: true,
                                    widths: ['20%', '20%', '20%'],
                                    headerRows: 1,
                                    body: unpaidInvoices[invoice.customer].reduce((a, invoice) => {
                                        a.push([
                                            {text: invoice.sale_number, noWrap: true},
                                            {text: moment(invoice.invoice_date).format(momentFormat)},
                                            {text: `£${(invoice.total_incl_vat - invoice.totalPaid).toFixed(2)}`, alignment: 'right', noWrap: true}
                                        ]);
                                        return a;
                                    }, [
                                        [{text: 'Invoices with outstanding balances', style: 'tableHeader', colSpan: 3, alignment: 'center'}, {}, {}],
                                        [
                                            {text: 'Invoice#', style: 'tableHeader'},
                                            {text: 'Date', style: 'tableHeader'},
                                            {text: 'Amount', style: 'tableHeader', alignment: 'right'}
                                        ],
                                    ]),
                                }
                            }
                        ],
                    },
                ],
                '\n\n',
                {
                    width: '60%',
                    unbreakable: true,
                    table: {
                        dontBreakRows: true,
                        widths: ['50%', '50%'],
                        body: [
                            [{text: 'Driver Name:              ' + UNDERSCORE, border: [true, true, false, false], margin: SIGNATURE_CELL_MARGIN}, {text: 'Payment Received: ' + UNDERSCORE, border: [false, true, true, false], margin: SIGNATURE_CELL_MARGIN}],
                            [{text: 'Customer Name:       ' + UNDERSCORE, border: [true, false, false, false], margin: SIGNATURE_CELL_MARGIN}, {text: 'Payment Type:         ' + UNDERSCORE, border: [false, false, true, false], margin: SIGNATURE_CELL_MARGIN}],
                            [{text: 'Customer Signature: ' + UNDERSCORE, border: [true, false, false, true], margin: SIGNATURE_CELL_MARGIN}, {text: ' ', border: [false, false, true, true], margin: SIGNATURE_CELL_MARGIN}],
                        ]
                    }
                }
            ],
            styles: {
                header: {
                    margin: [10, 10, 10, 10],
                },
                footer: {
                    margin: [10, 10, 10, 10],
                },
                tableHeader: {
                    bold: true,
                    fontSize: 8,
                },
            },
        };
    };
    let invoicePDFDocuments = [];
    Invoices.forEach(invoice => {
        invoicePDFDocuments.push(pdfPrinter.createPdfKitDocument(getInvoiceDefinition(invoice)));
    });

    const folderID = uuidv4();
    const folderPath = `PDF/${folderID}`
    fs.mkdirSync(folderPath);

    let filesWritten = [];

    for (const invoiceDocument of invoicePDFDocuments) {
        let index = invoicePDFDocuments.indexOf(invoiceDocument);
        let path = `${folderPath}/document-${index}.pdf`;
        let stream = invoiceDocument.pipe(fs.createWriteStream(path));
        invoiceDocument.end();
        await once(stream, 'finish');
        filesWritten.push(path);
    }

    const merger = new PDFMerger();
    for (const file of filesWritten) {
        await merger.add(file);
    }
    // await merger.save('merged.pdf'); //saves file to disk

    // Export the merged PDF as a nodejs Buffer
    const mergedPdfBuffer = await merger.saveAsBuffer();

    fs.rm(folderPath, {recursive: true}, () => {});

    return mergedPdfBuffer;
};

const generatePicklistPDF = async (invoiceIDList) => {
    const PICKLIST = {};
    const Invoices = await SERVICE_INVOICE.fetchInvoices({ _id: { $in: invoiceIDList } }, ['items']);
    const [Inventory, Categories] = await fetchData([
        SERVICE_INVENTORY.fetchInventory({}, ['name', 'category']),
        SERVICE_INVENTORY_CATEGORY.fetchInventoryCategories({}, ['name']),
    ]);
    for (const invoice of Invoices) {
        sortInvoiceItemsDescending(invoice.items);
        for (const item of invoice.items) {
            const itemCategory = Inventory[item._id]?.category ?? LABEL_MISSING_CATEGORY;
            if (!PICKLIST[itemCategory]) PICKLIST[itemCategory] = {};
            if (!PICKLIST[itemCategory][item._id]) {
                PICKLIST[itemCategory][item._id] = {
                    name: Inventory[item._id]?.name ?? item.name ?? LABEL_MISSING_ITEM_NAME,
                    quantity: item.quantity
                };
            } else {
                PICKLIST[itemCategory][item._id].quantity += item.quantity;
            }
        }
    }
    const organizedByCategoryIds = ['628a6c3bb6b05596c6bf77a3','628a6c3bb6b05596c6bf779d','643a8d3f497e0fe000979505'];
    const organizedData = {};
    organizedByCategoryIds.forEach(id => {
        if(PICKLIST[id]){
            organizedData[id] = PICKLIST[id];
        }
    });
    const remainingCategoryIds = Object.keys(PICKLIST).filter(id => !organizedByCategoryIds.includes(id)).sort((a,b)=>{
        const nameA = (Categories[a]?.name ?? '').trim().toUpperCase();
        const nameB = (Categories[b]?.name ?? '').trim().toUpperCase();
        return nameA.localeCompare(nameB);
    })
    remainingCategoryIds.forEach(id => {
        organizedData[id] = PICKLIST[id];
    });
    const categoryBlocks = Object.keys(organizedData).map(categoryId => {
        const categoryName = Categories[categoryId]?.name ?? LABEL_MISSING_CATEGORY;
        const items = Object.values(organizedData[categoryId]);
        
        const sortedItems = [...items].sort((a,b)=>{
            return pdfkit_service.cleantText(a.name).localeCompare(pdfkit_service.cleantText(b.name));
        });
        return {
        name: categoryName,
        items: sortedItems,
        }
    });
    const doc = pdfkit_service.createPDFDoc();
    pdfkit_service.registerFont(doc);
    pdfkit_service.renderTwoColumnList({
        doc, categories: categoryBlocks,
        fonts: { header: 'Roboto-Bold' },
        renderRow: ({ doc, item, x, y, columnWidth, idx }) => {
        const text = pdfkit_service.cleantText(item.name) || "Unknown";
        const layout = pdfkit_service.calculateWrappedText({doc,text,columnWidth,font: 'Roboto-normal',fontSize: 10.5,lineGap: 0,padding: 8});
        pdfkit_service.drawWrappedRow({
            doc,
            lines: layout.lines,
            quantity: item.quantity,
            x,y,
            columnWidth,
            lineHeight: layout.lineHeight + 2,
            rowHeight: layout.rowHeight,
            rowIndex: idx,
        });
        return layout.rowHeight;
    },
});
    pdfkit_service.PDFFooter(doc);
    return doc;
};

const generatePicklistShortagesPDF = async (invoiceIDList) => {
    const PICKLIST = {};
    const Invoices = await SERVICE_INVOICE.fetchInvoices({_id: {$in: invoiceIDList}}, ['items']);
    const [Inventory, Supplier2] = await fetchData([
        SERVICE_INVENTORY.fetchInventory({}, ['name', 'barcode', 'supplier2', 'quantity']),
        SERVICE_INVENTORY_SUPPLIER.fetchInventorySuppliers({}, ['name']),
    ]);
    for (const invoice of Invoices) {
        for (const item of invoice.items) {
            if(!Inventory[item._id]) continue;
            if(Inventory[item._id].quantity >= 0) continue;
            const itemSupplier2 = Inventory[item._id]?.supplier2 ?? LABEL_MISSING_SUPPLIER_2;
            if (!PICKLIST[itemSupplier2]) PICKLIST[itemSupplier2] = {};
            if (!PICKLIST[itemSupplier2][item._id]) {
                PICKLIST[itemSupplier2][item._id] = {
                    code: Inventory[item._id]?.barcode ?? '',
                    name: Inventory[item._id]?.name ?? LABEL_MISSING_ITEM_NAME,
                    stock: Inventory[item._id]?.quantity ?? 0,
                    quantity: item.quantity,
                };
            } else {
                PICKLIST[itemSupplier2][item._id].quantity += item.quantity;
            }
        }
    }

    const initialContent = Object.keys(PICKLIST).reduce((a, v) => {
        a.push({
            layout: {
                defaultBorder: false,
                fillColor: (rowIndex, node, columnIndex) => (rowIndex % 2 === 0) ? HEX_ROW_SHADE : null,
            },
            table: {
                dontBreakRows: true,
                widths: ['15%', '55%', '15%', '15%'],
                headerRows: 1,
                body: [
                    [
                        {
                            text: Supplier2[v]?.name ?? LABEL_MISSING_SUPPLIER_2,
                            style: 'tableHeader',
                            colSpan: 4,
                            alignment: 'center',
                            bold: true,
                            border: [false, false, false, true],
                        }, {}, {}, {},
                    ],
                    ...(Object.values(PICKLIST[v])
                        // .map(item => {
                        //     item.deficit = item.stock - item.quantity;
                        //     return item;
                        // })
                        // .filter(item => item.deficit < 0)
                        .sort((x, y) => x.remaining > y.remaining ? 1 : -1)
                        .map(item => [
                            {text: item.stock, alignment: 'right'},
                            {text: item.name},
                            // {text: item.code},
                            {text: ""},
                            {text: "", alignment: 'right'}
                        ])),
                ],
            },
        });
        return a;
    }, []);
    initialContent.sort((a, b) => {
        if(a.table.body[0][0].text > b.table.body[0][0].text) {
            return 1;
        } else if(a.table.body[0][0].text < b.table.body[0][0].text) {
            return -1;
        } else {
            return 0;
        }
    });
    let finalSortedContentList = [];
    initialContent.forEach(item => {
        finalSortedContentList.push(item, '\n');
    });
    const footerFunction = function(currentPage, pageCount) {
        const pageString = 'Page ' + currentPage.toString() + ' of ' + pageCount;
        return {
            style: 'footer',
            text: pageString
        }
    };

    const docDefinition = {
        pageMargins: [20, 60, 20, 35],
        defaultStyle: {font: 'Roboto', fontSize: 12},
        content: finalSortedContentList,
        footer: footerFunction,
        styles: {
            footer: {
                alignment: 'center'
            },
        },
    };
    return pdfPrinter.createPdfKitDocument(docDefinition);
};
const generateZoneRunPDF = async (invoiceIDList,reprint = false, byZoneMap = false,) => {
    const ZONERUN = {};
    const Invoices = await SERVICE_INVOICE.fetchInvoices({_id: {$in: invoiceIDList}},
        ['invoice_date', 'sale_number', 'customer', 'total_incl_vat', 'driverNotes', 'zone'],
    );
    const [Customers, Zones] = await fetchData([
        SERVICE_CUSTOMER.fetchCustomers({}, ['customer_name', 'zones', 'delivery_order', 'shop_keys']),
        SERVICE_ZONE.fetchZones({}, ['name', 'order']),
    ]);  
    for (const invoice of Invoices) {
        const currentInvoiceDay = invoice.invoice_date.getDay();
        const DATE = moment(invoice.invoice_date).format(momentFormat);
        const DELIVERY_ORDER_POSITION = Customers[invoice.customer].delivery_order[currentInvoiceDay];
        const CURRENT_INVOICE_ZONE = Zones[Customers[invoice.customer].zones[currentInvoiceDay]];
        const zoneName = byZoneMap ? (()=>{
            const match = invoice.zone.match(/Zone - (\d+)(?:\(\d+\))?/);
            return match ? `Zone - ${match[1]}`: invoice.zone;
        })():CURRENT_INVOICE_ZONE.name;
        const zoneOrder = byZoneMap ? (()=>{
            const match = invoice.zone.match(/Zone - (\d+)/);
            return match ? parseInt(match[1], 10) : CURRENT_INVOICE_ZONE.order;
        })() : CURRENT_INVOICE_ZONE.order;
        if (!ZONERUN[DATE]) ZONERUN[DATE] = {};
        if (!ZONERUN[DATE][zoneName]) ZONERUN[DATE][zoneName] = Object.create({}, {order: {value: zoneOrder}});
        if (!ZONERUN[DATE][zoneName][DELIVERY_ORDER_POSITION]) {
            ZONERUN[DATE][zoneName][DELIVERY_ORDER_POSITION] = Object.create({}, {
                order: {value: DELIVERY_ORDER_POSITION},
                invoices: {value: [], enumerable: true, writable: true},
            });
        }
        ZONERUN[DATE][zoneName][DELIVERY_ORDER_POSITION].invoices.push({
            customer_name: Customers[invoice.customer].customer_name,
            sale_number: invoice.sale_number,
            total_incl_vat: invoice.total_incl_vat,
            keys: Customers[invoice.customer].shop_keys,
            driverNotes: invoice.driverNotes
        });
    }
    const content = [];
    let pages = Object.keys(ZONERUN).reduce((a, v) => a + Object.keys(ZONERUN[v]).length, 0);
    for (const date in ZONERUN) {
        if (ZONERUN.hasOwnProperty(date)) {
            const orderedZones = Object.keys(ZONERUN[date]).sort((x, y) => ZONERUN[date][x].order > ZONERUN[date][y].order ? 1 : -1);
            for (const zone of orderedZones) {
                const orderedSections = Object.keys(ZONERUN[date][zone]).sort((x, y) => ZONERUN[date][zone][x].order > ZONERUN[date][zone][y].order ? 1 : -1);
                content.push(
                    {text: `Zone Run Report - Zone: ${zone}\n\n`, alignment: 'center'},
                    {
                        columns: [
                            {text: `Date: ${date}`},
                            {
                                text: [
                                    'Driver  ',
                                    {text: ' '.repeat(48) + '\n\n', decoration: 'underline'},
                                    'Helper ',
                                    {text: ' '.repeat(48) + '\n\n', decoration: 'underline'},
                                    'Van      ',
                                    {text: ' '.repeat(48) + '\n\n', decoration: 'underline'},
                                ],
                            },
                        ],
                    },
                    {
                        layout: {
                            hLineWidth: (i, node) => {
                                if (i === 1) return 2;
                                return (i > 1 && i < node.table.body.length) ? 1 : 0;
                            },
                            vLineWidth: (i, node) => {
                                return (i > 0 && i < node.table.widths.length) ? 1 : 0;
                            },
                            hLineColor: (i, node) => {
                                if (i === 1) return 'black';
                                return (i > 1 && i < node.table.body.length) ? 'black' : 'gray';
                            },
                            vLineColor: (i, node) => {
                                return 'gray';
                            },
                        },
                        table: {
                            dontBreakRows: true,
                            widths: ['5%', '30%', '10%', '10%', '5%', '15%', '25%'],
                            headerRows: 1,
                            body: orderedSections.reduce((a, section) => {
                                let showSection = true;
                                for (const invoice of ZONERUN[date][zone][section].invoices) {
                                    a.push([
                                        {text: showSection ? section : ''},
                                        {text: invoice.customer_name},
                                        {text: invoice.sale_number},
                                        {text: invoice.total_incl_vat.toFixed(2), alignment: 'right'},
                                        {text: invoice.keys ? 'YES' : ''},
                                        {},
                                        {text: invoice.driverNotes},
                                    ]);
                                    showSection = false;
                                }
                                return a;
                            }, [
                                [
                                    {text: ''},
                                    {text: 'Customer'},
                                    {text: 'Invoice'},
                                    {text: 'Total', alignment: 'right'},
                                    {text: 'Keys', alignment: 'right'},
                                    {text: 'Collection', alignment: 'right'},
                                    {text: 'Driver Notes'},
                                ],
                            ]),
                        },
                    },
                    {text: '\n\n'},
                    {
                        table: {
                            dontBreakRows: true,
                            widths: ['8%', '35%', '10%', '47%'],
                            headerRows: 1,
                            body: [
                                [
                                    {text: 'Quantity'},
                                    {text: 'Item'},
                                    {text: 'Damaged?\n(Yes/No)'},
                                    {text: 'Reason'},
                                ],
                                [...Array(4).fill({text: ' '})],
                                [...Array(4).fill({text: ' '})],
                                [...Array(4).fill({text: ' '})],
                                [...Array(4).fill({text: ' '})],
                                [...Array(4).fill({text: ' '})],
                                [...Array(4).fill({text: ' '})],
                                [...Array(4).fill({text: ' '})],
                                [...Array(4).fill({text: ' '})],
                            ],
                        },
                        pageBreak: --pages === 0 ? '' : 'after',
                    }
                );
            }
        }
    }

    const docDefinition = {
        pageMargins: [20, 20, 20, 20],
        defaultStyle: {font: 'Roboto', fontSize: 10},
        style: {},
        content,
    };
    return pdfPrinter.createPdfKitDocument(docDefinition);
};
const generateVanLoadShopwisePDF = async (invoiceIDList, reprint = false, byZoneMap = false) => {
    const VANLOADSHOPWISE = {};
    const Invoices = await SERVICE_INVOICE.fetchInvoices({ _id: { $in: invoiceIDList } },
        ['invoice_date', 'customer', 'items', 'zone']
    );
    const [Customers, Zones, Inventory, Categories] = await fetchData([
        SERVICE_CUSTOMER.fetchCustomers({}, ['customer_name', 'zones', 'delivery_order']),
        SERVICE_ZONE.fetchZones({}, ['name', 'order']),
        SERVICE_INVENTORY.fetchInventory({}, ['name', 'category']),
        SERVICE_INVENTORY_CATEGORY.fetchInventoryCategories({}, ['name']),
    ]);
    for (const invoice of Invoices) {
        const day = invoice.invoice_date.getDay();
        const CUSTOMER = Customers[invoice.customer];
        const DATE = moment(invoice.invoice_date).format(momentFormat);
        const DELIVERY_ORDER_POSITION = CUSTOMER.delivery_order[day];
        const CURRENT_ZONE = Zones[CUSTOMER.zones[day]];

        const zoneName = byZoneMap ? (() => {
            const m = invoice.zone.match(/Zone - (\w+)(?:\(\d+\))?/);
            if (m && m[1].toLowerCase() === 'office') return 'Zone - Office';
            return m ? `Zone - ${m[1]}` : invoice.zone;
        })() : CURRENT_ZONE.name;
        const zoneOrder = byZoneMap ? (() => {
            const m = invoice.zone.match(/Zone - (\w+)(?:\(\d+\))?/);
            if (m && m[1].toLowerCase() === 'office') return 0;
            return m ? parseInt(m[1], 10) : CURRENT_ZONE.order;
        })() : CURRENT_ZONE.order;

        VANLOADSHOPWISE[DATE] ??= {};
        VANLOADSHOPWISE[DATE][zoneName] ??= Object.create({}, { order: { value: zoneOrder } });
        VANLOADSHOPWISE[DATE][zoneName][DELIVERY_ORDER_POSITION] ??=
            Object.create({}, { order: { value: DELIVERY_ORDER_POSITION } });
        VANLOADSHOPWISE[DATE][zoneName][DELIVERY_ORDER_POSITION][CUSTOMER.customer_name] ??= {};
        sortInvoiceItemsDescending(invoice.items);
        invoice.items.forEach(item => {
            const ITEM = Inventory[item._id] ?? {};
            const CATEGORY = Categories[ITEM.category]?.name ?? LABEL_MISSING_CATEGORY;
            const node = VANLOADSHOPWISE[DATE][zoneName][DELIVERY_ORDER_POSITION][CUSTOMER.customer_name];
            node[CATEGORY] ??= {};
            node[CATEGORY][item._id] ??= {
                name: ITEM?.name ?? item.name ?? LABEL_MISSING_ITEM_NAME,
                quantity: 0,
            };
            node[CATEGORY][item._id].quantity += item.quantity;
        });
    }
    const categoryNameToId = {};
    for(const id in Categories){categoryNameToId[Categories[id].name] = id};
const doc = pdfkit_service.createPDFDoc();
pdfkit_service.registerFont(doc);
const PAGE_WIDTH = doc.page.width - doc.page.margins.left - doc.page.margins.right;
const COLUMN_GAP = 15;
const COLUMN_WIDTH = (PAGE_WIDTH - COLUMN_GAP) / 2;
const FOOTER_HEIGHT = 40;
const HEADER_HEIGHT = 55;
const PAGE_BOTTOM = doc.page.height - doc.page.margins.bottom - FOOTER_HEIGHT;
let column = 0;
let x = doc.page.margins.left;
let y = doc.page.margins.top + HEADER_HEIGHT;
const renderHeader = (zone, date) => {
    doc.font('Roboto-Bold').fontSize(14).text(`Van Load Shop Wise Report - Zone: ${zone}`, {
            align: 'center'
        });
    doc.moveDown(0.2);
    doc.font('Roboto-normal').fontSize(10).text(`Date: ${date}`, {
            align: 'center'
        });
};
const nextColumn = (zone, date) => {
    if (column === 0) {
        column = 1;
        x = doc.page.margins.left + COLUMN_WIDTH + COLUMN_GAP;
        y = doc.page.margins.top + HEADER_HEIGHT;
    } else {
        doc.addPage();
        column = 0;
        x = doc.page.margins.left;
        renderHeader(zone, date);
        y = doc.page.margins.top + HEADER_HEIGHT;
    }
};
const ensureSpace = (height, zone, date) => {
    if (y + height > PAGE_BOTTOM) {
        nextColumn(zone, date);
        return true;
    }
    return false;
};
let firstPage = true;
for (const date of Object.keys(VANLOADSHOPWISE)) {
    const zones = Object.keys(VANLOADSHOPWISE[date]).sort((a, b) => VANLOADSHOPWISE[date][a].order - VANLOADSHOPWISE[date][b].order);
    for (const zone of zones) {
        if (!firstPage) {
            doc.addPage();
        }
        firstPage = false;
        column = 0;
        x = doc.page.margins.left;
        renderHeader(zone, date);
        y = doc.page.margins.top + HEADER_HEIGHT;
        const sections = Object.keys(VANLOADSHOPWISE[date][zone]).filter(k => k !== 'order').sort((a, b) =>
                VANLOADSHOPWISE[date][zone][a].order - VANLOADSHOPWISE[date][zone][b].order
            );
        for (const section of sections) {
            const customers = VANLOADSHOPWISE[date][zone][section];
            for (const customer of Object.keys(customers)) {
                doc.font("Roboto-Bold").fontSize(12);
                const customerHeaderText = `[ ${section} ] - ${customer}`;
                const customerHeaderHeight = doc.heightOfString(customerHeaderText,{width: COLUMN_WIDTH, lineGap: 2})
                ensureSpace(customerHeaderHeight, zone, date);
                doc.text(customerHeaderText, x, y, { width: COLUMN_WIDTH});
                y += customerHeaderHeight + 4;
                const organizedByCategoryIds = [ '628a6c3bb6b05596c6bf77a3', '628a6c3bb6b05596c6bf779d', '643a8d3f497e0fe000979505' ];
                const categoryKeys = Object.keys(customers[customer]);
                const sortedCategories = categoryKeys.sort((a,b) => {
                    const idA = categoryNameToId[a]; 
                    const idB = categoryNameToId[b];
                    const indexOfA = organizedByCategoryIds.indexOf(idA);
                    const indexOfB = organizedByCategoryIds.indexOf(idB);
                    const aPriority = indexOfA != -1;
                    const bPriority = indexOfB != -1;
                    if (aPriority && bPriority) return indexOfA - indexOfB;
                    if(aPriority) return -1;
                    if(bPriority) return 1;
                    return a.localeCompare(b);
                })
                for (const category of sortedCategories) {
                    const categoryHeight = doc.heightOfString(category, {width: COLUMN_WIDTH - 4, lineGap: 2})
                    ensureSpace(categoryHeight + 4, zone, date);
                    doc.font("Roboto-Bold").fontSize(12);
                    doc.text(category, x + 4, y, { width: COLUMN_WIDTH });
                    y += categoryHeight + 4;
                    let rowIndex = 0;
                    for (const itemID in customers[customer][category]) {
                        const item = customers[customer][category][itemID];
                        const name = pdfkit_service.cleantText(item.name);
                        const qty = String(item.quantity);
                            const layout = pdfkit_service.calculateWrappedText({
                                doc,text: name,columnWidth: COLUMN_WIDTH,font: 'Roboto-normal',fontSize: 11,lineGap: 2,padding: 4, 
                            });
                    ensureSpace(layout.rowHeight, zone, date);
                    pdfkit_service.drawWrappedRow({ doc,lines: layout.lines, quantity: qty,x,y,columnWidth: COLUMN_WIDTH, lineHeight: layout.lineHeight, rowHeight: layout.rowHeight, rowIndex: rowIndex });
                    y += layout.rowHeight;
                        rowIndex ++;
                    }
                    y += 6;
                }
                y += 20;
            }
        }
    }
}
pdfkit_service.PDFFooter(doc);
return doc;


};
const generateCustomerStatementPDF = async (invoiceIDList) => {
    const Invoices = await SERVICE_INVOICE.fetchInvoices({_id: {$in: invoiceIDList}},
        ['sale_number', 'customer', 'invoice_date', 'ot_date', 'total_incl_vat', 'payments'],
        {invoice_date: 1, sale_number: 1}
    );
    const customerID = Invoices[0].customer;
    const Customers = await fetchData([
        SERVICE_CUSTOMER.fetchCustomers({_id: customerID}, ['customer_name', 'phone', 'address', 'city', 'postcode'])
    ]);

    const CUSTOMER = Customers[0][customerID];
    const DATE = new moment();

    const content = [];

    const customerStatementPage = [
        {text: "Customer Statement\n\n", alignment: 'center',fontSize:18, bold:true},
        {columns: [
                {width: "40%",stack: [
                     {
                        text: getLatestInvoiceConfig().addressLines.join("\n"),
                        },{text: "\n\n\n"},
                        [{text: CUSTOMER.customer_name}],
                        [{text: CUSTOMER.address}],
                        [{text: CUSTOMER.city}],
                        [{text: CUSTOMER.postcode}],
                        [{text: `Tel: ${CUSTOMER.phone}`}],                       
                    ]
                },
                {text: '', width: '*'},
                {width: "40%",stack: [
                    {image: currentConfig.logo, width: 120, height: 65},{text: "\n"},
                    [{text: `Date: ${DATE.format(momentFormat)}`,decoration:"underline", bold:true}],{text: "\n"},
                    [{text: "Our Bank Details",fontSize:12, bold:true,decoration:"underline"}],
                    [{text: "Account Name: Spice Direct Wholesale LTD"}],
                    [{text: "Account Number: 30845944"}],
                    [{text: "Sort Code: 04-00-03"}],
                    ]
                }
            ]
        },
        {text: "\n"}
    ];

    let invoicesTableRows = [];
    let invoicesTotal = 0;
    let invoicesAmountPaidTotal = 0;
    Invoices.forEach(invoice => {
        let invoiceDate = new moment(invoice.invoice_date);
        const currentInvoiceAmountPaid = Number(invoice.payments.reduce((accumulator, currentValue) => accumulator + currentValue.amount, 0).toFixed(2));
        invoicesTableRows.push([
            {text: invoice.sale_number, alignment: "center"},
            {text: invoiceDate.format(momentFormat), alignment: "center"},
            {text: `£${currentInvoiceAmountPaid.toFixed(2)}`, alignment: "right"},
            {text: `£${invoice.total_incl_vat.toFixed(2)}`, alignment: "right"}]);
        invoicesTotal += invoice.total_incl_vat;
        invoicesAmountPaidTotal += currentInvoiceAmountPaid;
    });

    const invoicesTable = {
        layout: {
            // defaultBorder: false,
            fillColor: (rowIndex, node, columnIndex) => (rowIndex === 0) ? HEX_CUSTOMER_STATEMENT_HEADER_ROW_SHADE : null,
        },
        table: {
            headerRows: 1,
            widths: ['20%', '50%', '15%', '15%'],
            body: [
                [{text: "Invoice No", alignment: "center"}, {text: "Order Date", alignment:"center"}, {text: "Amount Paid",alignment:"center"}, {text: "Amount Total", alignment:"center"}],
                ...invoicesTableRows
            ]
        }
    };

    const footerTimestampFormat = "DD-MMM-YYYY hh:mm A"

    const footerFunction = function(currentPage, pageCount) {
        const pageString = 'Page ' + currentPage.toString() + ' of ' + pageCount;
        return {
            columns: [
                {},
                {text: pageString},
                {text: `Printed on: ${DATE.format(footerTimestampFormat)}`}
            ]
        }
    };

    content.push(customerStatementPage);
    content.push(invoicesTable);
    content.push({text: `\nTotal remaining balance: £${(invoicesTotal - invoicesAmountPaidTotal).toFixed(2)}`, alignment: "right", bold:true});

    const docDefinition = {
        pageMargins: [30, 30, 30, 35],
        defaultStyle: {font: 'Roboto', fontSize: 10},
        style: {},
        content,
        footer: footerFunction
    };
    return pdfPrinter.createPdfKitDocument(docDefinition);
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
const sortInvoiceItemsDescending = items => {
    items.sort((itemA, itemB) => {
        const itemAWeightInGrams = Number((itemA.weight_grams + (itemA.weight_kg * 1000)).toFixed(2));
        const itemBWeightInGrams = Number((itemB.weight_grams + (itemB.weight_kg * 1000)).toFixed(2));

        if(itemAWeightInGrams > itemBWeightInGrams) {
            return 1;
        } else if(itemAWeightInGrams < itemBWeightInGrams) {
            return -1;
        }
        return 0;
    }).reverse();
}

module.exports = {
    generateInvoicePDF,
    generatePicklistPDF,
    generatePicklistShortagesPDF,
    generateZoneRunPDF,
    generateVanLoadShopwisePDF,
    generateCustomerStatementPDF,
};
