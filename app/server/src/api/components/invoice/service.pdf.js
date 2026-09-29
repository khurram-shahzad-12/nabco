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

const renderTableHeader = ({ doc, x, y, columnWidth }) => {
    const rowHeight = 20;
    const col1 = columnWidth * 0.60;
    const col2 = columnWidth * 0.15;
    const col3 = columnWidth * 0.15;
    const col4 = columnWidth * 0.10;
    doc.save().rect(x, y, columnWidth, rowHeight).fill('#bfc3cc').restore();
    doc.font('Roboto-Bold').fontSize(11).fillColor('black');
    doc.text('Products', x + 5, y + 5, { width: col1 - 10 });
    doc.text('Aisle', x + col1, y + 5, { width: col2, align: 'center' });
    doc.text('Location', x + col1 + col2, y + 5, { width: col3, align: 'center' });
    doc.text('Unit', x + col1 + col2 + col3, y + 5, { width: col4 - 5, align: 'right' });
    return rowHeight + 10;
};
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
        SERVICE_INVENTORY.fetchInventory({_id: {$in: [...neededData.items]}}, ['name', 'barcode', 'tax',]),
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
    const ORDER_CONFIRMATION_TEXT = [
    "Please check the details on the attached order confirmation thoroughly.",
    "",
    "We will assume that all details are correct unless we hear otherwise from you before the equipment is despatched. Regrettably, we are unable to consider any discrepancy after this time and any cost of rectifying the discrepancy will be at your own expense.",
    "",
    "Please note that all delivery services provided by Nabco Direct Ltd are outsourced to transport companies. All clients of Nabco Direct who use this service do so with the understanding that no claim can be entertained for late delivery, which may result in increased expenditure by the purchaser. The driver will wait up to 20 minutes on site, if there is no response or obvious parking they will move on and attempt redelivery the following day. Re-delivery charges will apply.",
    "",
    "Any claims for damages must be reported to Nabco Direct within 7 days of receipt of all goods, any claims after the 7 days cannot be submitted for claim approval. All customers and third-party recipients are required to sign for all deliveries as Unchecked or Damaged, failure to do so will jeopardize any subsequent claim. Failure to agree to this point reverts the agreement.",
    "",
    "Returns must be made within 28 days of the goods being received. Any products that are being returned must be itemized using the returns column which can be found on the delivery note. Any returns received without a completed returns form will not be accepted. It is the responsibility of the client to ensure when packaging, that the goods are protected. Returns must be received in a saleable condition, which is the condition you received the goods. There will be a restocking fee of 20% of the value of goods, to cover checking in, processing credits and the restocking of our warehouse.",
    "",
    "",
    "",
    "Please find attached a copy of our full terms and conditions for your reference.",
].join("\n");

const getOrderConfirmationPage = (logo) => ({
    pageMargins: [60, 100, 60, 80],
    defaultStyle: {font: "Roboto", fontSize: 12},

    header: {
        margin: [10, 40, 20, 10],
        text: "ORDER CONFIRMATION",
        bold: true,
        alignment: "center",
        fontSize: 20,
    },

    content: [
        {text: ORDER_CONFIRMATION_TEXT, alignment: "justify", lineHeight: 1.3},
    ],

    footer: function(currentPage, pageCount) {
    return {
        table: {
            widths: ["40%", "35%", "25%"],
            body: [
                [
                    {
                        fillColor: "#1F4E78",
                        color: "white",
                        margin: [8, 8, 8, 8],
                        text: [
                            {
                                text: "Head Office,\n\n",
                                bold: true,
                                fontSize: 11
                            },
                            {
                                text: "Nabco, Unit 5a, Brick Knoll Park,\n"
                            },
                            {
                                text: "Ashley Road, St Albans, Herts, AL1 5UG"
                            }
                        ],
                        fontSize: 9,
                        alignment: "left",
                    },
                    {
                        fillColor: "#1F4E78",
                        color: "white",
                        margin: [8, 8, 8, 8],
                        text: [
                            {
                                text: "Contact:\n\n",
                                bold: true,
                                fontSize: 11
                            },
                            {
                                text: "+44 (0)1727 841828\n"
                            },
                            {
                                text: "info@nabcouk.com"
                            }
                        ],
                        fontSize: 9,
                        alignment: "center",
                    },
                    {
                        fillColor: "#1F4E78",
                        alignment: "right",
                        image: logo,
                        fit: [100, 50],
                        margin: [0, 5, 5, 5],
                    }
                ]
            ]
        },
        layout: {
            hLineWidth: function() {
                return 0;
            },
            vLineWidth: function() {
                return 0;
            },
            paddingLeft: function() {
                return 0;
            },
            paddingRight: function() {
                return 0;
            },
            paddingTop: function() {
                return 0;
            },
            paddingBottom: function() {
                return 0;
            }
        },
        margin: [40, 0, 40, 15]
    };
},
});
const TERMS_AND_CONDITIONS_SECTIONS = [
    { type: "heading", text: "1. DEFINITIONS" },
    { type: "body", text: "In this document the following words shall have the following meanings:" },
    { type: "body", text: "1.1 \"Agreement\" means these Terms and Conditions together with the terms of any applicable Order Acknowledgement." },
    { type: "body", text: "1.2 \"Customer\" means the organisation or person who purchases goods and services from the Supplier." },
    { type: "body", text: "1.3 \"Intellectual Property Rights\" means all patents, registered and unregistered designs, copyright, trademarks, know-how and all other forms of intellectual property wherever in the world enforceable." },
    { type: "body", text: "1.4 \"Order Acknowledgement\" means a statement of work, quotation or other similar document describing the goods and services to be provided by the Supplier." },
    { type: "body", text: "1.5 \"Supplier\" means Nabco Direct Ltd of Unit 5A, Brick Knoll Park, Ashley Road, St. Albans, Herts, AL1 5UG." },
    { type: "heading", text: "2. GENERAL" },
    { type: "body", text: "2.1 These Terms and Conditions shall apply to all contracts for the supply of goods and services by the Supplier to the Customer." },
    { type: "body", text: "2.2 Before the commencement of the supply of goods the Supplier shall submit to the Customer an Order Acknowledgement which shall specify the goods and services to be supplied and the price payable. The Customer shall notify the Supplier immediately if the Customer does not agree with the contents of the Order Acknowledgement. All Order Acknowledgements shall be subject to these Terms and Conditions." },
    { type: "body", text: "2.3 The Supplier shall use all reasonable endeavours to complete the services within estimated time frames but time shall not be of the essence in the performance of any services." },
    { type: "heading", text: "3. PRICE AND PAYMENT" },
    { type: "body", text: "3.1 The price for the supply of goods and services are as set out in the Order Acknowledgement. Payment terms are as set out in the Additional Terms of this Agreement." },
    { type: "body", text: "3.2 Invoiced amounts shall be due and payable in compliance with the terms enclosed in the Order Acknowledgement. The Supplier shall be entitled to charge interest on overdue invoices from the date when payment becomes due from day to day until the date of payment at a rate of 4.00% per annum above the base rate of the Bank of England. In the event that the Customer's procedures require that an invoice be submitted against a purchase order to payment, the Customer shall be responsible for issuing such purchase order before the goods and services are supplied." },
    { type: "body", text: "3.3 Should Debit Collection Services be necessary to retrieve amounts outstanding, the Customer will be liable for any costs incurred." },
    { type: "heading", text: "4. SPECIFICATION OF THE GOODS" },
    { type: "body", text: "All goods shall be required only to conform to the specification in the Order Acknowledgement. For the avoidance of doubt no description, specification or illustration contained in any product pamphlet or other sales or marketing literature of the Supplier and no representation written or oral, correspondence or statement shall form part of the contract." },
    { type: "heading", text: "5. DELIVERY" },
    { type: "body", text: "5.1 The date of delivery specified by the Supplier is an estimate only. Time for delivery shall not be of the essence of the contract and the Supplier shall not be liable for any loss, costs, damages, charges or expenses caused directly or indirectly by any delay in the delivery of the goods." },
    { type: "body", text: "5.2 All risks in the goods shall pass to the Customer upon delivery." },
    { type: "heading", text: "6. TITLE" },
    { type: "body", text: "Title in the Goods shall not pass to the Customer until the Supplier has been paid in full for the Goods." },
    { type: "heading", text: "7. CUSTOMER'S OBLIGATIONS" },
    { type: "body", text: "7.1 To enable the Supplier to perform its obligations under this Agreement the Customer shall:" },
    { type: "body", text: "7.1.1 co-operate with the Supplier;" },
    { type: "body", text: "7.1.2 provide the Supplier with any information reasonably required by the Supplier;" },
    { type: "body", text: "7.1.3 obtain all necessary permissions and consents which may be required before the commencement of the services; and" },
    { type: "body", text: "7.1.4 comply with such other requirements as may be set out in the Order Acknowledgement or otherwise agreed between the parties." },
    { type: "body", text: "7.2 The Customer shall be liable to compensate the Supplier for any expenses incurred by the Supplier as a result of the Customer's failure to comply with Clause 7.1." },
    { type: "body", text: "7.3 Without prejudice to any other rights to which the Supplier may be entitled, in the event that the Customer unlawfully terminates or cancels the goods and services agreed to in the Order Acknowledgement, the Customer shall be required to pay to the Supplier as agreed damages and not as a penalty the full amount of any third-party costs to which the Supplier has committed." },
    { type: "body", text: "7.4 In the event that the Customer or any third party, not being a sub-contractor of the Supplier, shall omit or commit anything which prevents or delays the Supplier from undertaking or complying with any of its obligations under this Agreement, then the Supplier shall notify the Customer as soon as possible and:" },
    { type: "body", text: "7.4.1 the Supplier shall have no liability in respect of any delay to the completion of any project;" },
    { type: "body", text: "7.4.2 if applicable, the timetable for the project will be modified accordingly;" },
    { type: "body", text: "7.4.3 the Supplier shall notify the Customer at the same time if it intends to make any claim for additional costs." },
    { type: "heading", text: "8. ALTERATIONS TO THE ORDER ACKNOWLEDGEMENT" },
    { type: "body", text: "8.1 The parties may at any time mutually agree upon and execute new Order Acknowledgements. Any alterations in the scope of goods and/or services to be provided under this Agreement shall be set out in the Order Acknowledgement, which shall reflect the changed goods and/or services and price and any other terms agreed between the parties." },
    { type: "body", text: "8.2 The Customer may at any time request alterations to the Order Acknowledgement by appealing directly to the Supplier. On request for alterations, the Supplier shall supply and submit to the customer an amended Order Acknowledgement, showing altered goods and services and the effect of such alterations, if any, on the price and any other terms already agreed between the parties." },
    { type: "heading", text: "9. WARRANTY" },
    { type: "body", text: "9.1 The Supplier warrants that as from the date of delivery for a period of 1 year the goods and all their component parts, where applicable, are free from any defects in design, workmanship, construction or materials." },
    { type: "body", text: "9.2 The Supplier warrants that the services performed under this Agreement shall be performed using reasonable skill and care, and of a quality conforming to generally accepted industry standards and practices." },
    { type: "body", text: "9.3 Except as expressly stated in this Agreement, all warranties whether express or implied, by operation of law or otherwise, are hereby excluded in relation to the goods and services to be provided by the Supplier." },
    { type: "heading", text: "10. INDEMNIFICATION" },
    { type: "body", text: "The Customer shall indemnify the Supplier against all claims, costs and expenses which the Supplier may incur and which arise, directly or indirectly, from the Customer's breach of any of its obligations under this Agreement, including any claims brought against the Supplier alleging that any goods and/or services provided by the Supplier in accordance with the Order Acknowledgement infringes a patent, copyright or trade secret or other similar right of a third party." },
    { type: "heading", text: "11. LIMITATION OF LIABILITY" },
    { type: "body", text: "11.1 Except in respect of death or personal injury due to negligence for which no limit applies, the entire liability of the Supplier to the Customer in respect of any claim whatsoever or breach of this Agreement, whether or not arising out of negligence, shall be limited to the price paid by the Customer to which the claim relates." },
    { type: "body", text: "11.2 In no event shall the Supplier be liable to the Customer for any loss of business, loss of opportunity or loss of profits or for any other indirect or consequential loss or damage whatsoever. This shall apply even where such a loss was reasonably foreseeable or the Supplier had been made aware of the possibility of the Customer incurring such a loss." },
    { type: "body", text: "11.3 Nothing in these Terms and Conditions shall exclude or limit the Supplier's liability for death or personal injury resulting from the Supplier's negligence or that of its employees, agents or sub-contractors." },
    { type: "heading", text: "12. TERMINATION" },
    { type: "body", text: "Either party may terminate this Agreement forthwith by notice in writing to the other if:" },
    { type: "body", text: "12.1 the other party commits a material breach of this Agreement and, in the case of a breach capable of being remedied, fails to remedy it within 30 calendar days of being given written notice from the other party to do so;" },
    { type: "body", text: "12.2 the other party commits a material breach of this Agreement which cannot be remedied under any circumstances;" },
    { type: "body", text: "12.3 the other party passes a resolution for winding up (other than for the purpose of solvent amalgamation or reconstruction), or a court of competent jurisdiction makes an order to that effect;" },
    { type: "body", text: "12.4 the other party ceases to carry on its business or substantially the whole of its business; or" },
    { type: "body", text: "12.5 the other party is declared insolvent, or convenes a meeting of or makes or proposes to make any arrangement or composition with its creditors; or a liquidator, receiver, administrative receiver, manager, trustee or similar officer is appointed over any of its assets." },
    { type: "heading", text: "13. INTELLECTUAL PROPERTY RIGHTS" },
    { type: "body", text: "All Intellectual Property Rights produced from or arising as a result of the performance of this Agreement shall, so far as not already vested, become the absolute property of the Supplier, and the Customer shall do all that is reasonably necessary to ensure that such rights vest in the Supplier by the execution of appropriate instruments or the making of agreements with third parties." },
    { type: "heading", text: "14. FORCE MAJEURE" },
    { type: "body", text: "Neither party shall be liable for any delay or failure to perform any of its obligations if the delay or failure results from events or circumstances outside its reasonable control, including but not limited to acts of God, strikes, lockouts, accidents, war, fire, the act or omission of government, highway authorities or any telecommunications carrier, operator or administration or other competent authority, or the delay or failure in manufacture, production, or supply by third parties of equipment or services, and the party shall be entitled to a reasonable extension of its obligations after notifying the other party of the nature and extent of such events." },
    { type: "heading", text: "15. INDEPENDENT CONTRACTORS" },
    { type: "body", text: "The Supplier and the Customer are contractors independent of each other, and neither has the authority to bind the other to any third party or act in any way as the representative of the other, unless otherwise expressly agreed to in writing by both parties. The Supplier may, in addition to its own employees, engage sub-contractors to provide all or part of the services being provided to the Customer and such engagement shall not relieve the Supplier of its obligations under this Agreement or any applicable Order Acknowledgement." },
    { type: "heading", text: "16. ASSIGNMENT" },
    { type: "body", text: "The Customer shall not be entitled to assign its rights or obligations or delegate its duties under this Agreement without the prior written consent of the Supplier." },
    { type: "heading", text: "17. SEVERABILITY" },
    { type: "body", text: "If any provision of this Agreement is held invalid, illegal or unenforceable for any reason by any Court of competent jurisdiction such provision shall be severed and the remainder of the provisions herein shall continue in full force and effect as if this Agreement had been agreed with the invalid illegal or unenforceable provision eliminated." },
    { type: "heading", text: "18. WAIVER" },
    { type: "body", text: "The failure by either party to enforce at any time or for any period any one or more of the Terms and Conditions herein shall not be a waiver of them or of the right at any time subsequently to enforce all Terms and Conditions of this Agreement." },
    { type: "heading", text: "19. NOTICES" },
    { type: "body", text: "Any notice to be given by either party to the other may be served by email, fax, personal service or by post to the address of the other party given in the here signed Terms and Conditions or such other address as such party may from time to time have communicated to the other in writing, and if sent by email shall unless the contrary is proved be deemed to be received on the day it was sent, if sent by fax shall be deemed to be served on receipt of an error-free transmission report, if given by letter shall be deemed to have been served at the time at which the letter was delivered personally or if sent by post shall be deemed to have been delivered in the ordinary course of post." },
    { type: "heading", text: "20. ENTIRE AGREEMENT" },
    { type: "body", text: "This Agreement contains the entire agreement between the parties relating to the subject matter and supersedes any previous agreements, arrangements, undertakings or proposals, oral or written. Unless expressly provided elsewhere in this Agreement, this Agreement may be varied only by a document signed by both parties." },
    { type: "heading", text: "21. NO THIRD PARTIES" },
    { type: "body", text: "Nothing in this Agreement is intended to, nor shall it confer any rights on a third party." },
    { type: "heading", text: "22. GOVERNING LAW AND JURISDICTION" },
    { type: "body", text: "This Agreement shall be governed by and construed in accordance with the law of England & Wales and the parties hereby submit to the exclusive jurisdiction of the courts." },
    { type: "heading", text: "23. RETURN POLICY" },
    { type: "body", text: "Following this review, we have updated our returns policy, and the following measures must be followed to ensure you get credit for the products you have returned." },
    { type: "body", text: "Any products that are being returned must be itemised using the returns column which can be found on the delivery note. This will allow us to check the stock being returned quickly leading to you receiving your credit quicker. Any returns received without a completed returns form will not be accepted." },
    { type: "body", text: "Returns must take place within 28 days of the goods being received." },
    { type: "body", text: "Returns must be received in a saleable condition which is the condition you received the goods. Please ensure when packaging returns there is adequate packaging to protect the product. This packaging and transit are the responsibility of the customer to ensure it arrives at Nabco Warehouse in the condition it left your site. Any returns received which are damaged in any way on receipt by Nabco will not be credited." },
    { type: "body", text: "When returns are received there is a cost to check the returns list, process any credit and place products back into our warehouse. To cover this cost, there will be a restocking fee of 20% of the value of the goods." },
    { type: "body", text: "Please check our standard terms and conditions for the supply of goods and services which can be found on our website for full details." },
];
const getTermsAndConditionsPage = () => {
    const splitHeading = "11. LIMITATION OF LIABILITY";
    const splitIndex = TERMS_AND_CONDITIONS_SECTIONS.findIndex(
        s => s.type === "heading" && s.text === splitHeading
    );

    const leftSections  = splitIndex > 0
        ? TERMS_AND_CONDITIONS_SECTIONS.slice(0, splitIndex)
        : TERMS_AND_CONDITIONS_SECTIONS.slice(0, Math.ceil(TERMS_AND_CONDITIONS_SECTIONS.length / 2));
    const rightSections = splitIndex > 0
        ? TERMS_AND_CONDITIONS_SECTIONS.slice(splitIndex)
        : TERMS_AND_CONDITIONS_SECTIONS.slice(Math.ceil(TERMS_AND_CONDITIONS_SECTIONS.length / 2));

    const buildNodes = (sections) =>
        sections.map(s => s.type === "heading"
            ? {
                  text: s.text,
                  bold: true,
                  fontSize: 8,   
                  margin: [0, 0, 0, 0],
              }
            : {
                  text: s.text,
                  fontSize: 6,       
                  lineHeight: 1.15,
                  margin: [0, 0, 0, 0],
              }
        );

    return {
        pageMargins: [20, 30, 20, 20],
        defaultStyle: { font: "Roboto", fontSize: 7, lineHeight: 1.15 },
        header: {
            margin: [20, 10, 20, 10],
            text: "TERMS & CONDITIONS - Nabco",
            bold: true,
            alignment: "center",
            fontSize: 12,
        },
        content: [
            {
                columns: [
                    { width: "50%", stack: buildNodes(leftSections),  alignment: "justify" },
                    { width: "50%", stack: buildNodes(rightSections), alignment: "justify" },
                ],
                columnGap: 12,
            },
        ],
    };
};
    const UNDERSCORE = "_________________________________";
    const SIGNATURE_CELL_MARGIN = [1, 10, 1, 1];
    const getInvoiceDefinition = invoice => {
        const currentInvoiceConfigData = getInvoiceConfigForDate(invoice.invoice_date);
        return {
            pageMargins: [20, 50, 20, 50],
            defaultStyle: {font: 'Roboto', fontSize: 10},
            // header: {
            //     style: 'header',
            //     columns: [
            //         {image: currentConfig.logo, width: 140, height: 75},
            //         {text: invoice.in_person ? "COLLECTION" : "DELIVERY", width: '*', bold: true, alignment: 'center'},
            //         {
            //             text: currentInvoiceConfigData.addressLines.join("\n"), width: '40%',
            //         },
            //     ],
            // },
             header: {margin: [20, 10, 20, 10], text: invoice.in_person ? "COLLECTION" : "DELIVERY", width: '*', bold: true, alignment: 'center', fontSize:16 },
            footer: (currentPage, pageCount) => footerFunction(currentPage, pageCount, invoice.customer, invoice.cash_invoice, currentInvoiceConfigData.footer),
            content: [
                {
                    margin: [0, 0, 0, 15],
                    columns:[{image: currentConfig.logo, fit: [140, 75], width: "70%", margin: [20, 0, 0, 0]},{text: currentInvoiceConfigData.addressLines.join("\n"), width: '30%'}]
                },
                {text: Customers[invoice.customer].payment_term ? `Payment Term: ${PaymentTerms[Customers[invoice.customer].payment_term]?.name}\n` : "Payment Term: PAYMENT ON DELIVERY", fontSize: 12, bold: true, width: "*", alignment:'center', decoration: "underline"},
                { margin: [20, 15, 0, 0], 
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
                            width: '70%',
                        },
                        // {text: Customers[invoice.customer].payment_term ? `Payment Term: ${PaymentTerms[Customers[invoice.customer].payment_term]?.name}\n` : "Payment Term: PAYMENT ON DELIVERY", fontSize: 12, bold: true, width: "35%"},
                        {
                            text: [
                                {text: invoice.cash_invoice ? `CASH INVOICE${reprint ? " - REPRINT" : ""}\n` : `INVOICE${reprint ? " - REPRINT" : ""}\n`, fontSize: 12, bold: true},
                                `Number: ${invoice.sale_number}\n`,
                                `Date: ${moment(invoice.invoice_date).format(momentFormat)}\n`,
                                `${invoice.created_by === 'OrderLion App' ? 'Order By: OrderLion App': ''}\n`
                            ],
                            width: '30%',
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
                        widths: ['12%', '32%', '9%', '9%', '9%', '9%', '9%', '11%'],
                        headerRows: 1,
                        body: invoice.items.reduce((a, item) => {
                            const inv = Inventory[item._id];
                            a.push([
                                {text: Inventory[item._id]?.barcode ?? (item.barcode ? item.barcode : ''), noWrap: true},
                                {text: Inventory[item._id]?.name ?? (item.name ? item.name : LABEL_MISSING_ITEM_NAME)},
                                { text: item.quantity, alignment: 'right', noWrap: true },
                                { text: VAT[item.vat.toString()]?.name ?? item.tax, alignment: 'right', noWrap: true },
                                {
                                    text: (item.list_price != null ? +item.list_price : (inv?.list_price != null ? +inv.list_price : null)) != null
                                        ? (+(item.list_price ?? inv.list_price)).toFixed(2)
                                        : '', alignment: 'right', noWrap: true
                                },
                                {
                                    text: (item.discount_percent != null ? +item.discount_percent : (inv?.discount_percent != null ? +inv.discount_percent : null)) != null
                                        ? (+(item.discount_percent ?? inv.discount_percent)).toFixed(2) + '%'
                                        : '', alignment: 'right', noWrap: true
                                },
                                { text: item.rate.toFixed(2), alignment: 'right', noWrap: true },
                                { text: item.price.toFixed(2), alignment: 'right', noWrap: true },
                            ]);
                            return a;
                        }, [
                            [
                                {text: 'Item#', style: 'tableHeader'},
                                {text: 'Item Name', style: 'tableHeader'},
                                {text: 'Quantity', style: 'tableHeader', alignment: 'right'},
                                {text: 'VAT Code', style: 'tableHeader', alignment: 'right'},
                                {text: 'List Price', style: 'tableHeader', alignment: 'right'},
                                {text: 'Disc %', style: 'tableHeader', alignment: 'right'},
                                {text: 'Nett Price', style: 'tableHeader', alignment: 'right'},
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
        const invoiceDateConfig = getInvoiceConfigForDate(invoice.invoice_date);
        invoicePDFDocuments.push(pdfPrinter.createPdfKitDocument(getOrderConfirmationPage(currentConfig.logo)));
        invoicePDFDocuments.push(pdfPrinter.createPdfKitDocument(getInvoiceDefinition(invoice)));
        invoicePDFDocuments.push(pdfPrinter.createPdfKitDocument(getTermsAndConditionsPage()));
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
        SERVICE_INVENTORY.fetchInventory({}, ['name', 'category','location', 'aisle']),
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
                    quantity: item.quantity,
                    aisle: Inventory[item._id]?.aisle ?? '',
                    location: Inventory[item._id]?.location ?? '',
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
    pdfkit_service.renderSingleColumnList({
        doc, categories: categoryBlocks,
        fonts: { header: 'Roboto-Bold' },
        renderHeader: ({doc,x,y,columnWidth})=>{return renderTableHeader({doc, x, y, columnWidth})},
        renderRow: ({ doc, item, x, y, columnWidth, idx }) => { 
       const rowHeight = 18;
            const col1 = columnWidth * 0.60; const col2 = columnWidth * 0.15; const col3 = columnWidth * 0.15; const col4 = columnWidth * 0.10;
            if (idx % 2 === 0) {
                doc.save()
                    .rect(x, y, columnWidth, rowHeight)
                    .fill('#dadae1')
                    .restore();
            }
            const name = pdfkit_service.cleantText(item.name) || "Unknown";
            doc.font('Roboto-normal').fontSize(10.5).fillColor('black').text(name, x + 5, y + 4, { width: col1 - 10, ellipsis: true });
            doc.text(item.aisle || '', x + col1, y + 4, { width: col2, align: 'center' })
            doc.text(item.location || '', x + col1 + col2, y + 4, { width: col3, align: 'center' });
            doc.font('Roboto-Bold').text(item.quantity.toString(), x + col1 + col2 + col3, y + 4, { width: col4 - 5, align: 'right' })
            return rowHeight;
        }
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
        SERVICE_INVENTORY.fetchInventory({}, ['name', 'category','aisle', 'location']),
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
                aisle: ITEM?.aisle ?? '',
                location: ITEM?.location ?? '',
            };
            node[CATEGORY][item._id].quantity += item.quantity;
        });
    }
    const categoryNameToId = {};
    for(const id in Categories){categoryNameToId[Categories[id].name] = id};
const doc = pdfkit_service.createPDFDoc();
pdfkit_service.registerFont(doc);
const PAGE_WIDTH = doc.page.width - doc.page.margins.left - doc.page.margins.right;
const COLUMN_WIDTH = PAGE_WIDTH;
const FOOTER_HEIGHT = 40;
const HEADER_HEIGHT = 55;
const TABLE_HEADER_HEIGHT = 18;
const PAGE_BOTTOM = doc.page.height - doc.page.margins.bottom - FOOTER_HEIGHT;
let x = doc.page.margins.left;
let y = doc.page.margins.top + HEADER_HEIGHT;
const renderHeader = (zone, date) => {
    doc.font('Roboto-Bold').fontSize(14).text(`Wearhouses Picking Slip - Zone: ${zone}`, {
            align: 'center'
        });
    doc.moveDown(0.2);
    doc.font('Roboto-normal').fontSize(10).text(`Date: ${date}`, {
            align: 'center'
        });
};
const newPage = (zone, date) => {doc.addPage(); x = doc.page.margins.left; y = doc.page.margins.top + HEADER_HEIGHT; renderHeader(zone, date); y+= renderTableHeader({doc, x, y, columnWidth: COLUMN_WIDTH})}
const ensureSpace = (height, zone, date) => {
    if (y + height > PAGE_BOTTOM) {
        newPage(zone, date);
        return true;
    }
    return false;
};
let firstPage = true;
for (const date of Object.keys(VANLOADSHOPWISE)) {
    const zones = Object.keys(VANLOADSHOPWISE[date]).sort((a, b) => VANLOADSHOPWISE[date][a].order - VANLOADSHOPWISE[date][b].order);
    for (const zone of zones) {
        if (!firstPage) {
             newPage(zone, date)
        }else{
            firstPage = false; y = doc.page.margins.top + HEADER_HEIGHT; renderHeader(zone, date) ; y += renderTableHeader({doc, x ,y, columnWidth: COLUMN_WIDTH})
        }    
        const sections = Object.keys(VANLOADSHOPWISE[date][zone]).filter(k => k !== 'order').sort((a, b) =>
                VANLOADSHOPWISE[date][zone][a].order - VANLOADSHOPWISE[date][zone][b].order
            );
             for (const section of sections) {
                const customers = VANLOADSHOPWISE[date][zone][section];
                for (const customer of Object.keys(customers)) {
                    doc.font("Roboto-Bold").fontSize(12);
                   const customerHeaderText = `[ ${section} ] - ${customer}`;
                    const customerHeaderHeight = doc.heightOfString(customerHeaderText, { width: COLUMN_WIDTH, lineGap: 2 })
                    ensureSpace(customerHeaderHeight, zone, date);
                    doc.text(customerHeaderText, x, y, { width: COLUMN_WIDTH });
                    y += customerHeaderHeight + 4;
                    const organizedByCategoryIds = ['628a6c3bb6b05596c6bf77a3', '628a6c3bb6b05596c6bf779d', '643a8d3f497e0fe000979505'];
                    const categoryKeys = Object.keys(customers[customer]);
                    const sortedCategories = categoryKeys.sort((a, b) => {
                        const idA = categoryNameToId[a];
                        const idB = categoryNameToId[b];
                        const indexOfA = organizedByCategoryIds.indexOf(idA);
                        const indexOfB = organizedByCategoryIds.indexOf(idB);
                        const aPriority = indexOfA != -1;
                        const bPriority = indexOfB != -1;
                        if (aPriority && bPriority) return indexOfA - indexOfB;
                        if (aPriority) return -1;
                        if (bPriority) return 1;
                        return a.localeCompare(b);
                    })
                    for (const category of sortedCategories) {
                        const categoryHeight = doc.heightOfString(category, { width: COLUMN_WIDTH - 4, lineGap: 2 })
                        ensureSpace(categoryHeight + 4, zone, date);
                        doc.font("Roboto-Bold").fontSize(12);
                        doc.text(category, x + 4, y, { width: COLUMN_WIDTH });
                        y += categoryHeight + 4;
                        let rowIndex = 0;
                        for (const itemID in customers[customer][category]) {
                            const item = customers[customer][category][itemID];
                            const name = pdfkit_service.cleantText(item.name);
                            const qty = String(item.quantity);
                            const aisle = item.aisle || '';
                            const location = item.location || '';
                            const nameColWidth = COLUMN_WIDTH * 0.60;
                            const aisleColWidth = COLUMN_WIDTH * 0.15;
                            const locationColWidth = COLUMN_WIDTH * 0.15;
                            const qtyColWidth = COLUMN_WIDTH * 0.10;
                            const nameX = x;
                            const aisleX = x + nameColWidth;
                            const locationX = aisleX + aisleColWidth;
                            const qtyX = locationX + locationColWidth;
                            const layout = pdfkit_service.calculateWrappedText({ doc, text: name, columnWidth: nameColWidth, font: 'Roboto-normal', fontSize: 11, lineGap: 2, padding: 6 });
                            const { lines, lineHeight, rowHeight } = layout;
                            ensureSpace(rowHeight, zone, date);
                            if (rowIndex % 2 === 0) { doc.save().rect(x, y, COLUMN_WIDTH, rowHeight).fill('#dadae1').restore(); }
                            doc.font('Roboto-normal').fontSize(11).fillColor('black');
                            lines.forEach((line, idx) => {
                                doc.text(line, nameX + 4, y + 1 + idx * lineHeight, {
                                    width: nameColWidth - 8,
                                    lineGap: 2
                                }); 
                            });
                            doc.text(aisle, aisleX, y + 2, { width: aisleColWidth, align: 'center' });
                            doc.text(location, locationX, y + 2, { width: locationColWidth, align: 'center' });
                            doc.font('Roboto-Bold').text(qty, qtyX, y + 2, { width: qtyColWidth - 5, align: 'right' });
                            y += rowHeight;
                            rowIndex++;
                        }
                        y += 6;
                    }
                    y += 20;
                }
                y += 20;
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
                {text: '', width: '*'},
                {width: "70%",stack: [
                    {image: currentConfig.logo, width: 120, height: 65},{text: "\n"},
             
                    [{text: `Date: ${DATE.format(momentFormat)}`,decoration:"underline", bold:true, margin: [20, 0, 0, 0]}],{text: "\n"},
                    [{ text: CUSTOMER.customer_name, margin: [20, 0, 0, 0]}],
                    [{ text: CUSTOMER.address, margin: [20, 0, 0, 0]}],
                    [{ text: CUSTOMER.city, margin: [20, 0, 0, 0]}],
                    [{ text: CUSTOMER.postcode,margin: [20, 0, 0, 0] }],
                    [{ text: `Tel: ${CUSTOMER.phone}`,margin: [20, 0, 0, 0] }],
                    ]
                },
            {
                width: "30%", stack: [
                    {
                        text: getLatestInvoiceConfig().addressLines.join("\n"),
                    }, { text: "\n" },
                  
                   
                    [{text: "Our Bank Details",fontSize:12, bold:true,decoration:"underline"}],
                    [{text: "Account Name: XXX"}],
                    [{text: "Account Number: 000"}],
                    [{text: "Sort Code: 000"}],
                ]
            },
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
const generateDeliveryNotePDF = async (invoiceIDList) => {
    const neededData = { customers: new Set(), items: new Set() };
    const Invoices = await SERVICE_INVOICE.fetchInvoices(
        { _id: { $in: invoiceIDList } },
        ['invoice_date', 'sale_number', 'customer', 'items']
    );
    for (const invoice of Invoices) {
        neededData.customers.add(invoice.customer.toString());
        for (const item of invoice.items) neededData.items.add(item._id.toString());
    }

    const [Customers, Inventory] = await fetchData([
        SERVICE_CUSTOMER.fetchCustomers(
            { _id: { $in: [...neededData.customers] } },
            ['customer_name', 'address', 'city', 'mobile']
        ),
        SERVICE_INVENTORY.fetchInventory(
            { _id: { $in: [...neededData.items] } },
            ['name', 'barcode']
        )
    ]);
    const UNDERSCORE = "______________________________________________________________";
    const content = [];
    Invoices.forEach((invoice, invoiceIndex) => {
        const isLastInvoice = invoiceIndex === Invoices.length - 1;
        content.push(
            {
                columns: [
                    {
                        image: currentConfig.logo,
                        width: 70,
                        margin: [0, 0, 0, 10]
                    },
                    {
                        text: 'DELIVERY NOTE',
                        alignment: 'center',
                        fontSize: 20,
                        bold: true,
                        margin: [0, 10, 40, 30]
                    }
                ]
            },
            {
                columns: [
                    {
                        width: '60%',
                        text: [
                            `Customer: ${Customers[invoice.customer]?.customer_name || ''}\n`,
                            `Address: ${Customers[invoice.customer]?.address || ''}\n`,
                            `City: ${Customers[invoice.customer]?.city || ''}\n`,
                            `Mobile: ${Customers[invoice.customer]?.mobile || ''}\n`,
                        ]
                    },
                    {
                        width: '40%',
                        text: [
                            `Date: ${moment(invoice.invoice_date).format(momentFormat)}\n`,
                        ],
                        alignment: 'right'
                    }
                ]
            },
            '\n\n',
            {
                layout: 'headerLineOnly',
                table: {
                    widths: ['20%', '60%', '20%'],
                    headerRows: 1,
                    body: invoice.items.reduce((a, item, index) => {
                        const fill = index % 2 === 0 ? '#FFFFFF' : '#F2F2F2';

                        a.push([
                            { text: Inventory[item._id]?.barcode || '', fillColor: fill },
                            { text: Inventory[item._id]?.name || item.name || '', fillColor: fill },
                            { text: item.quantity, alignment: 'right', fillColor: fill }
                        ]);

                        return a;
                    }, [
                        [
                            { text: 'Item#', style: 'tableHeader' },
                            { text: 'Item Name', style: 'tableHeader' },
                            { text: 'Quantity', style: 'tableHeader', alignment: 'right' },
                        ]
                    ])
                }
            },
            !isLastInvoice ? { text: '', pageBreak: 'after' } : {}
        );
    });

    const docDefinition = {
        pageMargins: [40, 50, 40, 220],
        defaultStyle: { font: 'Roboto', fontSize: 10 },
        content,
        footer: (currentPage, pageCount) => ({
            margin: [40, 0, 30, 20],
            stack: [
                {
                    table: {
                        widths: ['100%'],
                        body: [
                            [{ text: `Name: ${UNDERSCORE}`, alignment: 'left', border: [false, false, false, false], margin: [0, 20, 0, 0] }],
                            [{ text: `Date: ${UNDERSCORE}`, alignment: 'left', border: [false, false, false, false], margin: [0, 10, 0, 0] }],
                            [{ text: `Sign: ${UNDERSCORE}`, alignment: 'left', border: [false, false, false, false], margin: [0, 10, 0, 0] }]
                        ]
                    },
                    layout: 'noBorders'
                },
                {
                    text: `Page ${currentPage} of ${pageCount}`,
                    alignment: 'center',
                    fontSize: 8,
                    margin: [0, 100, 0, 0]
                }
            ]
        }),
        styles: { tableHeader: { bold: true, fontSize: 10 } }
    };

    const pdfDoc = pdfPrinter.createPdfKitDocument(docDefinition);
    const chunks = [];
    pdfDoc.on('data', chunk => chunks.push(chunk));
    const pdfBuffer = await new Promise((resolve, reject) => {
        pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
        pdfDoc.on('error', reject);
        pdfDoc.end();
    });

    return pdfBuffer;
};

module.exports = {
    generateInvoicePDF,
    generatePicklistPDF,
    generatePicklistShortagesPDF,
    generateZoneRunPDF,
    generateVanLoadShopwisePDF,
    generateCustomerStatementPDF,
    generateDeliveryNotePDF,
};
