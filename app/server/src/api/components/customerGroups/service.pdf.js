const createError = require('http-errors');
const SERVICE_CUSTOMER_GROUPS = require('./service');
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
const pdfPrinter = new PdfPrinter(fonts);

const printCustomerGroupItemsList = async (customerGroupID) =>  {
    const customerGroupData = await SERVICE_CUSTOMER_GROUPS.fetchOneCustomerGroup({_id: customerGroupID});
    let itemsByCategory = {};
    let categoriesMap = {};
    (await SERVICE_INVENTORY_CATEGORY.fetchInventoryCategories({})).forEach(category => categoriesMap[category._id] = category.name);
    for (const item of customerGroupData.items) {
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

    const customerGroupItemsStatementPage = [
        {text: "Group Price List\n\n", alignment: 'center'},
        {columns: [
                {width:'60%',stack: [
                        {table: {
                                body: [
                                    [{text: `Group: ${customerGroupData.name}`}]
                                ]
                            },
                            layout: {
                                hLineColor: function(i, node) {
                                    return (i === 0 || i === node.table.body.length) ? 'black' : 'white';
                                },
                                vLineColor: function(i, node) {
                                    return (i === 0 || i === node.table.widths.length) ? 'black' : 'white';
                                },
                            }
                        },
                        {text: "\n"}
                    ]
                },
                // {text: '', width: '*'},
                {width:'40%',stack: [
                        {image: 'public/nabco.jpg', width: 140, height: 75},
                    ]
                }
            ]
        },
        {text: "\n"}
    ];

    const generateTableForCategory = category => {
        let rows = itemsByCategory[category]
            .sort((a, b) => a.name > b.name ? 1 : b.name > a.name ? -1 : 0)
            .map(item => [item.name, {text: item.rate.toFixed(2), alignment: 'right'}]);

        return {
            layout: {
                defaultBorder: false,
                fillColor: (rowIndex, node, columnIndex) => (rowIndex % 2 === 0) ? HEX_ROW_SHADE : null,
            },
            table: {
                headerRows: 1,
                widths: ['85%', '15%'],
                body: [
                    [
                        {
                            text: category,
                            colSpan: 2,
                            alignment: 'center',
                            bold: true,
                            border: [false, false, false, true]
                        },
                        {}
                    ],
                    ...rows
                ]
            }
        }
    };

    let customerGroupItemsTable = Object.keys(itemsByCategory)
        .filter(category => itemsByCategory[category].length > 0)
        .sort()
        .map(category => [generateTableForCategory(category), '\n'])
        .flatMap(val => val);

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

    content.push(customerGroupItemsStatementPage);
    content.push(customerGroupItemsTable);

    const docDefinition = {
        pageMargins: [60, 20, 60, 35],
        defaultStyle: {font: 'Roboto', fontSize: 12},
        style: {},
        content,
        footer: footerFunction
    };
    return pdfPrinter.createPdfKitDocument(docDefinition);
};

module.exports = {
    printCustomerGroupItemsList
};
