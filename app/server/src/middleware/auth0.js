const env = require('./../config.env');
const PERMISSIONS = 'permissions'

const {
    auth,
    claimIncludes,
} = require('express-oauth2-jwt-bearer');

const jwtAuth = auth({
    issuerBaseURL: env.TOKEN_ISSUER,
    audience: env.TOKEN_AUDIENCE,
});

const readZonesCheck = claimIncludes(PERMISSIONS, env.READ_ZONES_CLAIM);
const writeZonesCheck = claimIncludes(PERMISSIONS, env.WRITE_ZONES_CLAIM);
const readSectionsCheck = claimIncludes(PERMISSIONS, env.READ_SECTIONS_CLAIM);
const writeSectionsCheck = claimIncludes(PERMISSIONS, env.WRITE_SECTIONS_CLAIM);
const readVatCheck = claimIncludes(PERMISSIONS, env.READ_VAT_CLAIM);
const writeVatCheck = claimIncludes(PERMISSIONS, env.WRITE_VAT_CLAIM);
const readInventoryCheck = claimIncludes(PERMISSIONS, env.READ_INVENTORY_CLAIM);
const writeInventoryCheck = claimIncludes(PERMISSIONS, env.WRITE_INVENTORY_CLAIM);
const deleteInventoryCheck = claimIncludes(PERMISSIONS, env.DELETE_INVENTORY_ITEMS_CLAIM);
const readInventoryTagsCheck = claimIncludes(PERMISSIONS, env.READ_INVENTORY_TAGS_CLAIM);
const writeInventoryTagsCheck = claimIncludes(PERMISSIONS, env.WRITE_INVENTORY_TAGS_CLAIM);
const readInventoryCategoriesCheck = claimIncludes(PERMISSIONS, env.READ_INVENTORY_CATEGORIES_CLAIM);
const writeInventoryCategoriesCheck = claimIncludes(PERMISSIONS, env.WRITE_INVENTORY_CATEGORIES_CLAIM);
const readInventorySuppliersCheck = claimIncludes(PERMISSIONS, env.READ_INVENTORY_SUPPLIERS_CLAIM);
const writeInventorySuppliersCheck = claimIncludes(PERMISSIONS, env.WRITE_INVENTORY_SUPPLIERS_CLAIM);
const readCustomersCheck = claimIncludes(PERMISSIONS, env.READ_CUSTOMERS_CLAIM);
const writeCustomersCheck = claimIncludes(PERMISSIONS, env.WRITE_CUSTOMERS_CLAIM);
const readCustomerTagsCheck = claimIncludes(PERMISSIONS, env.READ_CUSTOMER_TAGS_CLAIM);
const writeCustomerTagsCheck = claimIncludes(PERMISSIONS, env.WRITE_CUSTOMER_TAGS_CLAIM);
const readCustomerZonesCheck = claimIncludes(PERMISSIONS, env.READ_CUSTOMER_ZONES_CLAIM);
const writeCustomerZonesCheck = claimIncludes(PERMISSIONS, env.WRITE_CUSTOMER_ZONES_CLAIM);
const readInvoicesCheck = claimIncludes(PERMISSIONS, env.READ_INVOICES_CLAIM);
const writeInvoicesCheck = claimIncludes(PERMISSIONS, env.WRITE_INVOICES_CLAIM);
const editInvoicesCheck = claimIncludes(PERMISSIONS, env.EDIT_INVOICES_CLAIM);
const inPersonInvoicesCheck = claimIncludes(PERMISSIONS, env.WRITE_IN_PERSON_INVOICES_CLAIM);
const readInvoiceMarginsCheck = claimIncludes(PERMISSIONS, env.READ_INVOICE_MARGINS_CLAIM);
const writeInvoicePaymentsDataCheck = claimIncludes(PERMISSIONS, env.WRITE_INVOICE_PAYMENTS_DATA_CLAIM);
const readCustomerStatementsCheck = claimIncludes(PERMISSIONS, env.READ_CUSTOMER_STATEMENT_CLAIM);
const writeCustomerCancelOrderDayCheck = claimIncludes(PERMISSIONS, env.WRITE_CUSTOMER_CANCEL_ORDER_DAY_CLAIM);
const resetInventoryNegativesPermissions = claimIncludes(PERMISSIONS, env.RESET_NEGATIVE_INVENTORY_ITEMS);
const manageUsersPermission = claimIncludes(PERMISSIONS, env.MANAGE_USERS_PERMISSION);
const writeDriverDetailsPermission = claimIncludes(PERMISSIONS, env.WRITE_DRIVER_DETAILS_PERMISSION);
const writeDriverTotalsPermission = claimIncludes(PERMISSIONS, env.WRITE_DRIVER_TOTALS_PERMISSION);
const writeCheckDriverDetailsPermission = claimIncludes(PERMISSIONS, env.WRITE_CHECK_DRIVER_DETAILS_PERMISSION);
const writeCustomerSalesRepPermission = claimIncludes(PERMISSIONS, env.WRITE_CUSTOMER_SALES_REP_PERMISSION);
const readPaymentTermCheck = claimIncludes(PERMISSIONS, env.READ_PAYMENT_TERM_CLAIM);
const writePaymentTermCheck = claimIncludes(PERMISSIONS, env.WRITE_PAYMENT_TERM_CLAIM);
const readCustomerGroupsCheck = claimIncludes(PERMISSIONS, env.READ_CUSTOMER_GROUPS_CLAIM);
const writeCustomerGroupsCheck = claimIncludes(PERMISSIONS, env.WRITE_CUSTOMER_GROUPS_CLAIM);
const writeSupplierInvoicePaymentsCheck = claimIncludes(PERMISSIONS, env.WRITE_SUPPLIER_INVOICE_PAYMENTS_DATA);
const allReadInvoicesCheck = claims => {
    return claims.permissions.includes(env.READ_INVOICES_CLAIM) || claims.permissions.includes(env.WRITE_IN_PERSON_INVOICES_CLAIM);
};
const allWriteInvoicesCheck = claims => {
    return claims.permissions.includes(env.WRITE_INVOICES_CLAIM) || claims.permissions.includes(env.WRITE_IN_PERSON_INVOICES_CLAIM);
};
const allUpdateCustomerZonesCheck = claims => {
    return claims.permissions.includes(env.WRITE_CUSTOMER_ZONES_CLAIM) && claims.permissions.includes(env.WRITE_CUSTOMERS_CLAIM);
};
const readSalesTrackerCheck = claimIncludes(PERMISSIONS, env.READ_DASHBOARD);
const writeActivityCheck = claimIncludes(PERMISSIONS, env.WRITE_ACTIVITY);
const readLeadsCheck = claimIncludes(PERMISSIONS, env.READ_LEADS);
const writeLeadsCheck = claimIncludes(PERMISSIONS, env.WRITE_LEADS);
const readOpportunityCheck = claimIncludes(PERMISSIONS, env.READ_OPPORTUNITY);
const writeOpportunityCheck = claimIncludes(PERMISSIONS, env.WRITE_OPPORTUNITY);
const readQuotationCheck = claimIncludes(PERMISSIONS, env.READ_QUOTATION);
const writeQuotationCheck = claimIncludes(PERMISSIONS, env.WRITE_QUOTATION);
const crmDashboardCheck = claimIncludes(PERMISSIONS, env.READ_CRM_DASHBOARD);
const readTelesalesDashboardCheck = claimIncludes(PERMISSIONS, env.READ_TELESALES_DASHBOARD);

module.exports = {
    jwtAuth,
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
};
