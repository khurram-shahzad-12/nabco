const createError = require('http-errors');
const SERVICE_INVENTORY_SUPPLIER = require('../inventory_supplier/service');
const SERVICE_SUPPLIER_INVOICES = require('./service');
const moment = require('moment');
const {getLatestInvoiceConfig} = require("../../../config.env");
const ExcelJS = require("exceljs");
const fs = require('fs');
const currentConfig = require("../../../utils/appConfig");

const PdfPrinter = require('pdfmake');

const momentFormat = 'DD/MM/YYYY';

const fonts = {
    Roboto: {
        normal: 'fonts/Roboto-Regular.ttf',
        bold: 'fonts/Roboto-Medium.ttf',
        italics: 'fonts/Roboto-Italic.ttf',
        bolditalics: 'fonts/Roboto-MediumItalic.ttf',
    },
};
const HEX_CUSTOMER_STATEMENT_HEADER_ROW_SHADE = '#009d52';
const pdfPrinter = new PdfPrinter(fonts);

const printSupplierInvoicesList = async (invoiceIdList) =>  {
    const suppliersDataMap = {};
    (await SERVICE_INVENTORY_SUPPLIER.fetchInventorySuppliers()).forEach(supplier => suppliersDataMap[supplier._id] = supplier);
    const supplierInvoices = await SERVICE_SUPPLIER_INVOICES.fetchSupplierInvoices({_id: {$in: invoiceIdList}});


    const content = [];
    const DATE = new moment();

    const supplierInvoicesStatementPage = [
        {text: "Supplier Invoices\n\n", alignment: 'center'},
        {columns: [
                // {stack: [{text: ""}]},
                {text: '', width: '*'},
                {text: '', width: '*'},
                {stack: [
                        {image: currentConfig.logo, width: 140, height: 75},
                        {
                            text: getLatestInvoiceConfig().addressLines.join("\n")
                        },
                    ]
                }
            ]
        },
        {text: "\n"}
    ];

    const invoicesTableRows = [];
    let selectedInvoicesTotalPaid = 0;
    let selectedInvoicesTotalAmount = 0;
    supplierInvoices.forEach(invoice => {
        let totalPaid = invoice.payments.map(item => item.amount).reduce((a, b) => a + b, 0).toFixed(2);
        if(invoice.total > 0){
            selectedInvoicesTotalAmount += Math.abs(invoice.total)
        }else{
            selectedInvoicesTotalAmount -= Math.abs(invoice.total)
        }
        invoicesTableRows.push([
            suppliersDataMap[invoice.supplier].name,
            moment(invoice.invoice_date).format(momentFormat),
            invoice.invoice_number,
            {text: invoice.total.toFixed(2), alignment: 'right'},
            {text: invoice.vat.toFixed(2), alignment: 'right'},
            {text: invoice.standard_rate.toFixed(2), alignment: 'right'},
            {text: invoice.zero_rate.toFixed(2), alignment: 'right'},
            invoice.invoice_type,
            Math.abs(invoice.total).toFixed(2) === totalPaid ? "Paid" : "Unpaid",
            invoice.delivery_status
        ]);
        const paymentsData = {
            payments: [],
            types: [],
            dates: []
        };
        if(invoice.invoice_type === 'Credit Note'){
            invoice.payments.forEach(payment => {
                paymentsData.payments.push(payment.amount.toFixed(2));
                paymentsData.types.push(payment.type);
                paymentsData.dates.push(moment(payment.date).format(momentFormat));
                selectedInvoicesTotalPaid -= payment.amount;
            });
        }else{
            invoice.payments.forEach(payment => {
                paymentsData.payments.push(payment.amount.toFixed(2));
                paymentsData.types.push(payment.type);
                paymentsData.dates.push(moment(payment.date).format(momentFormat));
                selectedInvoicesTotalPaid += payment.amount;
            });
        }
       
        invoicesTableRows.push([
            {text: "Payments", alignment: 'right', colSpan: 3},
            {},{},
            {text: paymentsData.payments.join("\n"), alignment: 'right'},
            {text: paymentsData.types.join("\n")},
            {text: paymentsData.dates.join("\n")},
            {text:"", colSpan: 4},{},{},{}
        ]);
    });

    invoicesTableRows.push([
        {text: "Total Remaining Balance", alignment: 'right', colSpan: 3, bold: true},
        {},{},
        {text: `£${(selectedInvoicesTotalAmount - selectedInvoicesTotalPaid).toFixed(2)}`, alignment: 'center', colSpan: 3, bold: true},
        {text:"", colSpan: 2},{},{},{}, {}, {}
    ]);

    let supplierInvoicesTable = {
        layout: {
            // defaultBorder: false,
            fillColor: (rowIndex, node, columnIndex) => (rowIndex === 0) ? HEX_CUSTOMER_STATEMENT_HEADER_ROW_SHADE : null,
        },
        table: {
            headerRows: 1,
            widths: ['21%', '10%', '10%', '6%', '5%', '8%', '7%', '8%', "6%", "10%"],
            body: [
                [{text: "Supplier"}, {text: "Invoice Date"}, {text: "Invoice No"}, {text: "Total"}, {text: "VAT"}, {text: "Standard Rate"}, {text: "Zero Rate"},  {text: "Invoice Type"}, {text: "Paid Status"}, {text: "Delivery Status"}],
                ...invoicesTableRows
            ]
        }
    };

    const footerTimestampFormat = "DD-MMM-YYYY hh:mm A";

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

    content.push(supplierInvoicesStatementPage);
    content.push(supplierInvoicesTable);

    const docDefinition = {
        pageMargins: [20, 20, 20, 35],
        pageOrientation: 'landscape',
        defaultStyle: {font: 'Roboto', fontSize: 10},
        style: {},
        content,
        footer: footerFunction
    };
    return pdfPrinter.createPdfKitDocument(docDefinition);
};

const printSupplierInvoicesVATList = async (invoiceIdList) =>  {
    const suppliersDataMap = {};
    (await SERVICE_INVENTORY_SUPPLIER.fetchInventorySuppliers()).forEach(supplier => suppliersDataMap[supplier._id] = supplier);
    const supplierInvoices = await SERVICE_SUPPLIER_INVOICES.fetchSupplierInvoices({_id: {$in: invoiceIdList}});


    const content = [];
    const DATE = new moment();

    const supplierInvoicesStatementPage = [
        {text: "Supplier Invoices VAT\n\n", alignment: 'center'},
        {columns: [
                {text: '', width: '*'},
                {text: '', width: '*'},
                {stack: [
                        {image: currentConfig.logo, width: 140, height: 75},
                        {
                            text: getLatestInvoiceConfig().addressLines.join("\n")
                        },
                    ]
                }
            ]
        },
        {text: "\n"}
    ];

    const invoicesTableRows = [];
    let selectedInvoicesTotalVAT = 0;
    let selectedInvoicesTotalStandardRate = 0;
    let selectedInvoicesTotalZeroRate = 0;
    supplierInvoices.forEach(invoice => {
        selectedInvoicesTotalVAT += Math.abs(invoice.vat);
        selectedInvoicesTotalStandardRate += Math.abs(invoice.standard_rate);
        selectedInvoicesTotalZeroRate += Math.abs(invoice.zero_rate);
        invoicesTableRows.push([
            suppliersDataMap[invoice.supplier].name,
            moment(invoice.invoice_date).format(momentFormat),
            invoice.invoice_number,
            {text: invoice.total.toFixed(2), alignment: 'right'},
            {text: invoice.vat.toFixed(2), alignment: 'right'},
            {text: invoice.standard_rate.toFixed(2), alignment: 'right'},
            {text: invoice.zero_rate.toFixed(2), alignment: 'right'},
            invoice.invoice_type
        ]);
        const paymentsData = {
            payments: [],
            types: [],
            dates: []
        };
        if(invoice.invoice_type === 'Credit Note'){
            invoice.payments.forEach(payment => {
                paymentsData.payments.push(payment.amount.toFixed(2));
                paymentsData.types.push(payment.type);
                paymentsData.dates.push(moment(payment.date).format(momentFormat));
            });
        }else{
            invoice.payments.forEach(payment => {
                paymentsData.payments.push(payment.amount.toFixed(2));
                paymentsData.types.push(payment.type);
                paymentsData.dates.push(moment(payment.date).format(momentFormat));
            });
        }

        invoicesTableRows.push([
            {text: "Payments", alignment: 'right', colSpan: 3},
            {},{},
            {text: paymentsData.payments.join("\n"), alignment: 'right'},
            {text: paymentsData.types.join("\n")},
            {text: paymentsData.dates.join("\n")},
            {text:"", colSpan: 2},{}
        ]);
    });

    invoicesTableRows.push([
        {text: "Totals - VAT|Standard Rate|Zero Rate", alignment: 'right', colSpan: 4, bold: true},
        {},{},{},
        {text: `£${(selectedInvoicesTotalVAT).toFixed(2)}`, alignment: 'center', bold: true},
        {text: `£${(selectedInvoicesTotalStandardRate).toFixed(2)}`, alignment: 'center', bold: true},
        {text: `£${(selectedInvoicesTotalZeroRate).toFixed(2)}`, alignment: 'center', bold: true},
        {}
    ]);

    let supplierInvoicesTable = {
        layout: {
            fillColor: (rowIndex, node, columnIndex) => (rowIndex === 0) ? HEX_CUSTOMER_STATEMENT_HEADER_ROW_SHADE : null,
        },
        table: {
            headerRows: 1,
            widths: ['21%', '10%', '10%', '11%', '11%', '11%', '11%', '8%'],
            body: [
                [{text: "Supplier"}, {text: "Invoice Date"}, {text: "Invoice No"}, {text: "Total"}, {text: "VAT"}, {text: "Standard Rate"}, {text: "Zero Rate"},  {text: "Invoice Type"}],
                ...invoicesTableRows
            ]
        }
    };

    const footerTimestampFormat = "DD-MMM-YYYY hh:mm A";

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

    content.push(supplierInvoicesStatementPage);
    content.push(supplierInvoicesTable);

    const docDefinition = {
        pageMargins: [20, 20, 20, 35],
        pageOrientation: 'landscape',
        defaultStyle: {font: 'Roboto', fontSize: 10},
        style: {},
        content,
        footer: footerFunction
    };
    return pdfPrinter.createPdfKitDocument(docDefinition);
};

const printSupplierInvoicesVATListExcel = async(invoiceIdList) => {
     const suppliersDataMap = {};
    (await SERVICE_INVENTORY_SUPPLIER.fetchInventorySuppliers()).forEach(supplier => suppliersDataMap[supplier._id] = supplier);
    const supplierInvoices = await SERVICE_SUPPLIER_INVOICES.fetchSupplierInvoices({_id: {$in: invoiceIdList}});
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Supplier Invoices VAT");
    const DATE = moment();
    const addressConfig = getLatestInvoiceConfig();
    const address_depot = addressConfig.addressLines.join("\n");
    const logo = workbook.addImage({
        buffer:fs.readFileSync(currentConfig.logo), extension:'png'
    });  
    const title_row = sheet.addRow(['Suppliers Invoices VAT']);
    title_row.font={size:16, bold:true};
    title_row.height=60;
    sheet.mergeCells(`A${title_row.number}:H${title_row.number}`);
    title_row.alignment={vertical:'middle', horizontal:'center'};    
    let logo_row = sheet.addRow([]);
    logo_row.height = 120;
    sheet.addImage(logo,{tl: { col: 6, row: logo_row.number - 1},ext:{width:140,height:80}});
    sheet.mergeCells(`G${logo_row.number}:H${logo_row.number}`)

    const address_row = sheet.addRow(['','','','','','', address_depot]);
    address_row.height = 180;
    address_row.getCell(7).alignment={wrapText:true,vertical:'middle'};
    sheet.mergeCells(`G${address_row.number}:H${address_row.number}`);
    sheet.columns = [
        {key: 'supplier', width: 40},
        {key: 'invoice_date', width: 15},
        {key: 'invoice_no', width: 20},
        {key: 'total', width: 20},
        {key: 'vat', width: 20},
        {key: 'standard_rate', width: 20},
        {key: 'zero_rate', width: 15},
        {key: 'invoice_type', width: 15},
    ];
    const headerLabels = [
    'Supplier',
    'Invoice Date',
    'Invoice No',
    'Total',
    'VAT',
    'Standard Rate',
    'Zero Rate',
    'Invoice Type'
    ];
    const headerRow = sheet.addRow(headerLabels);
    headerRow.font = { bold: true, size:12 };
    headerRow.alignment={vertical: 'middle', horizontal: 'center', wrapText: true}
    headerRow.height = 60
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: HEX_CUSTOMER_STATEMENT_HEADER_ROW_SHADE.replace('#', '') }
    };
    let selectedInvoicesTotalVAT = 0;
    let selectedInvoicesTotalStandardRate = 0;
    let selectedInvoicesTotalZeroRate = 0;
    let currentRow=5;
    supplierInvoices.forEach(invoice => {
        selectedInvoicesTotalVAT += Math.abs(invoice.vat);
        selectedInvoicesTotalStandardRate += Math.abs(invoice.standard_rate);
        selectedInvoicesTotalZeroRate += Math.abs(invoice.zero_rate);
        const dataRow = sheet.addRow({
            supplier: suppliersDataMap[invoice.supplier]?.name || '',
            invoice_date: moment(invoice.invoice_date).format("DD-MM-YYYY"),
            invoice_no: invoice.invoice_number,
            total: invoice.total.toFixed(2),
            vat: invoice.vat.toFixed(2),
            standard_rate: invoice.standard_rate.toFixed(2),
            zero_rate: invoice.zero_rate.toFixed(2),
            invoice_type: invoice.invoice_type
        });
        currentRow++
        dataRow.height=40;
        dataRow.getCell('A').font = { bold: true };
        dataRow.eachCell((cell) => {
            cell.border = {top: { style: 'thin' },left: { style: 'thin' },bottom: { style: 'thin' },right: { style: 'thin' }};
        });
        dataRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' }; 
        dataRow.getCell(8).alignment = { vertical: 'middle', horizontal: 'center' }; 

        if (invoice.payments && invoice.payments.length > 0) {
            const startRow = sheet.rowCount + 1;
            invoice.payments.forEach((payment,index)=>{
                const isLast = index === invoice.payments.length - 1;
                const rowValues =[];
                rowValues[0]='';
                rowValues[1]='';
                rowValues[2]='';
                rowValues[3]=payment.amount.toFixed(2);
                rowValues[4]=payment.type;
                rowValues[5]=moment(payment.date).format("DD-MM-YYYY");
                rowValues[6]='';
                rowValues[7]='';
                const paymentRow = sheet.addRow(rowValues);
                paymentRow.height=40;
                paymentRow.fill={type: 'pattern',pattern: 'solid',fgColor: { argb: 'FFF7F7F7' }};
                sheet.getCell(`D${paymentRow.number}`).alignment = { horizontal: 'center', vertical: 'middle' };
                sheet.getCell(`E${paymentRow.number}`).alignment = { horizontal: 'center', vertical: 'middle' };
                sheet.getCell(`F${paymentRow.number}`).alignment = { horizontal: 'center', vertical: 'middle' };
                paymentRow.eachCell((cell, colNumber) => {
                cell.border = {
                left: { style: 'thin' },
                right: { style: 'thin' },
                top: index === 0 ? { style: 'thin' } : undefined,
                bottom: isLast ? { style: 'thin' } : undefined,
            };
            });
        });
        const endRow = sheet.rowCount;
        sheet.mergeCells(`A${startRow}:C${endRow}`);
        sheet.getCell(`A${startRow}`).value = 'Payments';
        sheet.getCell(`A${startRow}`).alignment={horizontal:'right',vertical:'middle'}
        sheet.getCell(`A${startRow}`).fill = {type: 'pattern',pattern: 'solid',fgColor: { argb: 'FFF7F7F7' }};
        for (let row = startRow; row <= endRow; row++) {
        ['A', 'B', 'C'].forEach((col) => {
        const cell = sheet.getCell(`${col}${row}`);
        cell.border = {
        top: row === startRow ? { style: 'thin' } : undefined,
        bottom: row === endRow ? { style: 'thin' } : undefined,
        left: col = { style: 'thin' },
        right: col = { style: 'thin' },
    };
  });
}
        }
    });
    sheet.addRow([]);
    const totalsRow = sheet.addRow([
        'Totals - VAT|Standard Rate|Zero Rate','','','',
        `£${selectedInvoicesTotalVAT.toFixed(2)}`,
        `£${selectedInvoicesTotalStandardRate.toFixed(2)}`,
        `£${selectedInvoicesTotalZeroRate.toFixed(2)}`,'',
    ]);
     totalsRow.eachCell((cell) => {
            cell.border = {top: { style: 'thin' },left: { style: 'thin' },bottom: { style: 'thin' },right: { style: 'thin' }};
        });
    totalsRow.height=60;
    totalsRow.font={size:12, bold:true}
    sheet.mergeCells(`A${totalsRow.number}:D${totalsRow.number}`);
    sheet.getCell(`A${totalsRow.number}`).alignment = { horizontal: 'right', vertical: 'middle' };

    ['E', 'F', 'G'].forEach(col => {
      sheet.getCell(`${col}${totalsRow.number}`).alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getCell(`${col}${totalsRow.number}`).font = { bold: true };
    });
    sheet.headerFooter.oddFooter = '&CPrinted on: ' + moment().format("DD-MMM-YYYY hh:mm A") + '  |  Page &P of &N';
    sheet.pageSetup = {
        paperSize: 9,
        orientation: 'landscape',
        fitToHeight: 0,
        fitToWidth: 1,
        fitToPage:true,
        horizontalCentered:true,
    };
    sheet.pageSetup.printTitlesRow = '4:1';
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
}

module.exports = {
    printSupplierInvoicesList,
    printSupplierInvoicesVATList,
    printSupplierInvoicesVATListExcel,
};