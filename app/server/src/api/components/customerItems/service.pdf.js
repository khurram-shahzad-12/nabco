const createError = require('http-errors');
const {getLatestInvoiceConfig} = require("../../../config.env");
const SERVICE_CUSTOMER_ITEMS = require('./service');
const SERVICE_CUSTOMER = require('./../customer/service');
const SERVICE_INVENTORY = require('./../inventory/service');
const SERVICE_INVENTORY_CATEGORY = require('./../inventory_category/service');

const PdfPrinter = require('pdfmake');
const moment = require('moment');

const fonts = {
    Roboto: {
        normal: 'fonts/Roboto-Regular.ttf',
        bold: 'fonts/Roboto-Medium.ttf',
        italics: 'fonts/Roboto-Italic.ttf',
        bolditalics: 'fonts/Roboto-MediumItalic.ttf',
    },
};
const HEX_ROW_SHADE = '#e1e1e1';
const HEADER_BG_COLOR = '#2c3e50';
const HEADER_TEXT_COLOR = "#ffffff";
const pdfPrinter = new PdfPrinter(fonts);

const printCustomerItemsList = async (customerID, reprint, query) =>  {
    const {type} = query || "prices";    
    const customerData = await SERVICE_CUSTOMER.fetchOneCustomer({_id: customerID});
    const customerItemsData = await SERVICE_CUSTOMER_ITEMS.fetchCustomerItems({customer: customerID});
    let itemsByCategory = {};
    let categoriesMap = {};
    (await SERVICE_INVENTORY_CATEGORY.fetchInventoryCategories({})).forEach(category => categoriesMap[category._id] = category.name);
    for (const item of customerItemsData.items) {
        let inventoryItem = await SERVICE_INVENTORY.fetchOneItemFromInventory({_id: item._id}, ['name', 'category']);
        item.name = inventoryItem.name;
        let categoryName = categoriesMap[inventoryItem.category];
        if(itemsByCategory[categoryName]) {
            itemsByCategory[categoryName].push(item);
        } else {
            itemsByCategory[categoryName] = [item];
        }
    }
    const content = [];
    const DATE = new moment();
    const isPriceList = type === "prices";

    const headerSection = {
        columns: [
            {
                width: "60%",
                stack: [{
                    table:{
                        body:[
                            [{text:customerData.customer_name, bold: true, margin:[0,1]}],
                            [{text: customerData.address, margin: [0,1], bold:true}],
                            [{text: `${customerData.city} ${customerData.postcode}`, margin: [0,1], bold:true}],
                            [{text: `Tel: ${customerData.phone}`, margin:[0,1], bold:true}]
                        ]
                    },
                    layout: 'noBorders',
                }]
            },{
                width: '40%',
                stack: [
                    {image: 'public/nabco.jpg', width: 140, height: 75, alignment: 'right'},
                    {
                        text: getLatestInvoiceConfig().addressLines.join("\n"),
                        alignment: 'right',
                        margin: [0,5]
                    }
                ]
            }
        ],margin: [0,0,0,20]
    };
    const titleSection = {
        text: isPriceList?"PRICE LIST":"STOCK LIST",
        style: 'header',
        margin: [0,0,0,10]
    };
    if(!isPriceList){
        titleSection.text = [
            {text: 'STOCK LIST\n', style: 'header'},
            {text: "Please complete your stock count and order requirements", style: 'subheader'}
        ]
    }
    content.push(titleSection);
    content.push(headerSection)
    const generateTableForCategory = category => {
        const sortedItems = itemsByCategory[category].sort((a,b)=>a.name.localeCompare(b.name));
        const bodyRows = sortedItems.map((item,index)=>{
            if(isPriceList){
                return[
                    {text: item.name, border: [false,false,false, index === sortedItems.length - 1 ]},
                    {text: item.rate.toFixed(2), alignment: 'right', border: [false,false,false, index === sortedItems.length - 1]}
                ]
            }else{
                return[
                    {text: item.name, border: [false,false,false, index === sortedItems.length - 1 ]},
                    {text: "", alignment: 'center', border: [false, false, false, index === sortedItems.length - 1]},
                    {text: "", alignment: 'center', border: [false, false, false, index === sortedItems.length - 1]}
                ]
            }
        });
        const tableWidths = isPriceList ? ["75%", "25%"] : ["60%", "20%", "20%"];
        const headerColumns  = isPriceList ? [{text: category.toUpperCase(), style: "categoryHeader", colSpan: 2},{}]:[
            {text: category.toUpperCase(), style:"categoryHeader"},
            {text: "CURRENT STOCK", style: "categoryHeader"},
            {text: "TO ORDER", style: "categoryHeader"}
        ];
        return {
            table: {
                headerRows: 1,
                widths: tableWidths,
                body: [headerColumns, ...bodyRows]
            },
            layout: {
                fillColor: (rowIndex) => (rowIndex % 2 === 0) ? HEX_ROW_SHADE : null,
                hLineWidth: () => 0.5,
                vLineWidth: () => 0.5,
                hLineColor: () => '#cccccc',
                vLineColor: () => '#cccccc',
            },
            margin: [0,0,0,15]
        }
    }
    const categories = Object.keys(itemsByCategory).filter(category =>itemsByCategory[category].length > 0).sort();
    categories.forEach(category => {content.push(generateTableForCategory(category))})
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
    const docDefinition = {
        pageMargins: [40, 40, 40, 65],
        defaultStyle: {font: 'Roboto', fontSize: 10, lineHeight: 1.5},
        styles: {
            header: {fontSize: 18, bold: true, alignment: 'center', color: HEADER_BG_COLOR},
            subheader: {fontSize: 11, italics: true, alignment: 'center', margin : [0,5]},
            categoryHeader:{bold: true, fillColor: HEADER_BG_COLOR, color: HEADER_TEXT_COLOR,alignment:'center',valign: 'middle', margin: [0,3]}
        },
        content,
        footer: footerFunction
    };
    return pdfPrinter.createPdfKitDocument(docDefinition);
};

module.exports = {
    printCustomerItemsList
};
