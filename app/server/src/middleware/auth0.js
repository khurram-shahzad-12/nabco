const env = require('./../config.env');
const {createPermissionCheck, createAllPermissionCheck, createAnyPermissionCheck} = require('../middleware/permission')

const readZonesCheck = createPermissionCheck(env.READ_ZONES_CLAIM);
const writeZonesCheck = createPermissionCheck(env.WRITE_ZONES_CLAIM);
const readSectionsCheck = createPermissionCheck(env.READ_SECTIONS_CLAIM);
const writeSectionsCheck = createPermissionCheck(env.WRITE_SECTIONS_CLAIM);
const readVatCheck = createPermissionCheck(env.READ_VAT_CLAIM);
const writeVatCheck = createPermissionCheck(env.WRITE_VAT_CLAIM);
const readInventoryCheck = createPermissionCheck(env.READ_INVENTORY_CLAIM);
const writeInventoryCheck = createPermissionCheck(env.WRITE_INVENTORY_CLAIM);
const deleteInventoryCheck = createPermissionCheck(env.DELETE_INVENTORY_ITEMS_CLAIM);
const readInventoryTagsCheck = createPermissionCheck(env.READ_INVENTORY_TAGS_CLAIM);
const writeInventoryTagsCheck = createPermissionCheck(env.WRITE_INVENTORY_TAGS_CLAIM);
const readInventoryCategoriesCheck = createPermissionCheck(env.READ_INVENTORY_CATEGORIES_CLAIM);
const writeInventoryCategoriesCheck = createPermissionCheck(env.WRITE_INVENTORY_CATEGORIES_CLAIM);
const readInventorySuppliersCheck = createPermissionCheck(env.READ_INVENTORY_SUPPLIERS_CLAIM);
const writeInventorySuppliersCheck = createPermissionCheck(env.WRITE_INVENTORY_SUPPLIERS_CLAIM);
const readCustomersCheck = createPermissionCheck(env.READ_CUSTOMERS_CLAIM);
const writeCustomersCheck = createPermissionCheck(env.WRITE_CUSTOMERS_CLAIM);
const readCustomerTagsCheck = createPermissionCheck(env.READ_CUSTOMER_TAGS_CLAIM);
const writeCustomerTagsCheck = createPermissionCheck(env.WRITE_CUSTOMER_TAGS_CLAIM);
const readCustomerZonesCheck = createPermissionCheck(env.READ_CUSTOMER_ZONES_CLAIM);
const writeCustomerZonesCheck = createPermissionCheck(env.WRITE_CUSTOMER_ZONES_CLAIM);
const readInvoicesCheck = createPermissionCheck(env.READ_INVOICES_CLAIM);
const writeInvoicesCheck = createPermissionCheck(env.WRITE_INVOICES_CLAIM);
const editInvoicesCheck = createPermissionCheck(env.EDIT_INVOICES_CLAIM);
const inPersonInvoicesCheck = createPermissionCheck(env.WRITE_IN_PERSON_INVOICES_CLAIM);
const readInvoiceMarginsCheck = createPermissionCheck(env.READ_INVOICE_MARGINS_CLAIM);
const writeInvoicePaymentsDataCheck = createPermissionCheck(env.WRITE_INVOICE_PAYMENTS_DATA_CLAIM);
const readCustomerStatementsCheck = createPermissionCheck(env.READ_CUSTOMER_STATEMENT_CLAIM);
const writeCustomerCancelOrderDayCheck = createPermissionCheck(env.WRITE_CUSTOMER_CANCEL_ORDER_DAY_CLAIM);
const resetInventoryNegativesPermissions = createPermissionCheck(env.RESET_NEGATIVE_INVENTORY_ITEMS);
const manageUsersPermission = createPermissionCheck(env.MANAGE_USERS_PERMISSION);
const writeDriverDetailsPermission = createPermissionCheck(env.WRITE_DRIVER_DETAILS_PERMISSION);
const writeDriverTotalsPermission = createPermissionCheck(env.WRITE_DRIVER_TOTALS_PERMISSION);
const writeCheckDriverDetailsPermission = createPermissionCheck(env.WRITE_CHECK_DRIVER_DETAILS_PERMISSION);
const readCustomerSalesRepPermission = createPermissionCheck(env.READ_CUSTOMER_SALES_REP_PERMISSION);
const writeCustomerSalesRepPermission = createPermissionCheck(env.WRITE_CUSTOMER_SALES_REP_PERMISSION);
const readPaymentTermCheck = createPermissionCheck(env.READ_PAYMENT_TERM_CLAIM);
const writePaymentTermCheck = createPermissionCheck(env.WRITE_PAYMENT_TERM_CLAIM);
const readCustomerGroupsCheck = createPermissionCheck(env.READ_CUSTOMER_GROUPS_CLAIM);
const writeCustomerGroupsCheck = createPermissionCheck(env.WRITE_CUSTOMER_GROUPS_CLAIM);
const writeSupplierInvoicePaymentsCheck = createPermissionCheck(env.WRITE_SUPPLIER_INVOICE_PAYMENTS_DATA);
const allReadInvoicesCheck = createAnyPermissionCheck([env.READ_INVOICES_CLAIM, env.WRITE_IN_PERSON_INVOICES_CLAIM]);
const allWriteInvoicesCheck = createAnyPermissionCheck([env.WRITE_INVOICES_CLAIM, env.WRITE_IN_PERSON_INVOICES_CLAIM]);
const allUpdateCustomerZonesCheck = createAllPermissionCheck([env.WRITE_CUSTOMER_ZONES_CLAIM, env.WRITE_CUSTOMERS_CLAIM]);
const readSalesTrackerCheck = createPermissionCheck(env.READ_DASHBOARD);
const writeActivityCheck = createPermissionCheck(env.WRITE_ACTIVITY);
const readLeadsCheck = createPermissionCheck(env.READ_LEADS);
const writeLeadsCheck = createPermissionCheck(env.WRITE_LEADS);
const readOpportunityCheck = createPermissionCheck(env.READ_OPPORTUNITY);
const writeOpportunityCheck = createPermissionCheck(env.WRITE_OPPORTUNITY);
const readQuotationCheck = createPermissionCheck(env.READ_QUOTATION);
const writeQuotationCheck = createPermissionCheck(env.WRITE_QUOTATION);
const crmDashboardCheck = createPermissionCheck(env.READ_CRM_DASHBOARD);
const readTelesalesDashboardCheck = createPermissionCheck(env.READ_TELESALES_DASHBOARD);
const readUsersCheck = createPermissionCheck(env.READ_USERS);
const writeUserCheck = createPermissionCheck(env.WRITE_USERS);
const readUserRoleCheck = createPermissionCheck(env.READ_USER_ROLES);
const writeUserRoleCheck = createPermissionCheck(env.WRITE_USER_ROLES);
const readUserPermissionCheck = createPermissionCheck(env.READ_USER_PERMISSION);
const writeUserPermissionCheck = createPermissionCheck(env.WRITE_USER_PERMISSION);
const readSalesLedger = createPermissionCheck(env.READ_SALES_LEDGER);
const readPurchaseLedger = createPermissionCheck(env.READ_PURCHASE_LEDGER);
const writeSalesLedgerCheck = createPermissionCheck(env.WRITE_SALES_LEDGER);
const writePurchaseLedgerCheck = createPermissionCheck(env.WRITE_PURCHASE_LEDGER);
const readDailyOrderReport=createPermissionCheck(env.READ_DAILY_ORDER_REPORT);
const readOrderHistory=createPermissionCheck(env.READ_ORDER_HISTORY);
const createCreditNotescheck = createPermissionCheck(env.REACT_APP_CREATE_CREDIT_NOTES_CLAIM);
const editCreditNotesCheck = createPermissionCheck(env.REACT_APP_EDIT_CREDIT_NOTES_CLAIM);
const creditNoteApplyCheck = createPermissionCheck(env.REACT_APP_CREDIT_NOTES_APPLY_CLAIM);
const readCreditNoteCheck = createPermissionCheck(env.REACT_APP_READ_CREDIT_NOTES_CLAIM);

module.exports = {
    readZonesCheck,
    writeZonesCheck,
    readSectionsCheck,
    writeSectionsCheck,
    readVatCheck,
    writeVatCheck,
    readInventoryCheck,
    writeInventoryCheck,
    deleteInventoryCheck,
    readInventoryTagsCheck,
    writeInventoryTagsCheck,
    readInventoryCategoriesCheck,
    writeInventoryCategoriesCheck,
    readInventorySuppliersCheck,
    writeInventorySuppliersCheck,
    readCustomersCheck,
    writeCustomersCheck,
    readCustomerTagsCheck,
    writeCustomerTagsCheck,
    readCustomerZonesCheck,
    writeCustomerZonesCheck,
    readInvoicesCheck,
    writeInvoicesCheck,
    editInvoicesCheck,
    inPersonInvoicesCheck,
    readInvoiceMarginsCheck,
    writeInvoicePaymentsDataCheck,
    readCustomerStatementsCheck,
    writeCustomerCancelOrderDayCheck,
    resetInventoryNegativesPermissions,
    manageUsersPermission,
    writeDriverDetailsPermission,
    writeDriverTotalsPermission,
    writeCheckDriverDetailsPermission,
    readCustomerSalesRepPermission,
    writeCustomerSalesRepPermission,
    readPaymentTermCheck,
    writePaymentTermCheck,
    readCustomerGroupsCheck,
    writeCustomerGroupsCheck,
    writeSupplierInvoicePaymentsCheck,
    allReadInvoicesCheck,
    allWriteInvoicesCheck,
    allUpdateCustomerZonesCheck,
    readSalesTrackerCheck,
    writeActivityCheck,
    readLeadsCheck,
    writeLeadsCheck,
    readOpportunityCheck,
    writeOpportunityCheck,
    readQuotationCheck,
    writeQuotationCheck,
    crmDashboardCheck,
    readTelesalesDashboardCheck,
    readUsersCheck,
    writeUserCheck,
    readUserRoleCheck,
    writeUserRoleCheck,
    readUserPermissionCheck,
    writeUserPermissionCheck,
    readSalesLedger,
    readPurchaseLedger,
    writeSalesLedgerCheck,
    writePurchaseLedgerCheck,
    readDailyOrderReport,
    readOrderHistory,
    createCreditNotescheck,
    editCreditNotesCheck,
    creditNoteApplyCheck,
    readCreditNoteCheck,
};
