require('dotenv').config({override: true});
const fs = require('fs');
const moment = require('moment');
const APP_ENV = process.env.APP_ENV || 'production'

const parseBoolean = (value, defaultValue = false) => value ? ['1', 'true', 'yes'].includes(value.toString().trim().toLowerCase()) : defaultValue;
const configFile = APP_ENV === 'production' ? 'config/nabco_invoice_config.json' : 'config/invoice_config.json';
const invoice_config_data = JSON.parse(fs.readFileSync(configFile));

const getInvoiceConfigForDate = invoiceDate => {
    const data = invoice_config_data.filter(entry => {
        let momentInvoiceDate = moment(invoiceDate);
        let momentDataStartDate = moment(entry.startDate);
        return momentInvoiceDate.isSameOrAfter(momentDataStartDate, 'day') && (entry.endDate === null || momentInvoiceDate.isSameOrBefore(moment(entry.endDate), 'day'))
    });
    return data[0];
};

const getLatestInvoiceConfig = () => {
    return invoice_config_data.filter(entry => entry.endDate === null)[0];
}

// [TLS]
const useTLS = parseBoolean(process.env.TLS);
const TLS_KEY = process.env.TLS_KEY || 'tls/server.key';
const TLS_CERT = process.env.TLS_CERT || 'tls/server.crt';

// [Server]
const PORT = parseInt(process.env.PORT, 10) || 8000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const DOMAIN = process.env.DOMAIN || 'http://localhost';
const useCORS = parseBoolean(process.env.CORS, true);
const LOG_LEVEL = process.env.LOG_LEVEL || 'dev';

// [Auth0]
const useAUTH0 = parseBoolean(process.env.AUTH0);
const TOKEN_ISSUER = process.env.TOKEN_ISSUER || 'https://development-spice-direct.eu.auth0.com/';
const TOKEN_AUDIENCE = process.env.TOKEN_AUDIENCE || `${DOMAIN}:${PORT}/api/`;
const CLAIM_NAME = process.env.CLAIM_NAME || 'https://spicedirect/roles';
const READ_ZONES_CLAIM= process.env.READ_ZONES_CLAIM || 'read:zones';
const WRITE_ZONES_CLAIM= process.env.WRITE_ZONES_CLAIM || 'write:zones';
const READ_SECTIONS_CLAIM= process.env.READ_SECTIONS_CLAIM || 'read:sections';
const WRITE_SECTIONS_CLAIM= process.env.WRITE_SECTIONS_CLAIM || 'write:sections';
const READ_VAT_CLAIM= process.env.READ_VAT_CLAIM || 'read:vat';
const WRITE_VAT_CLAIM= process.env.WRITE_VAT_CLAIM || 'write:vat';
const READ_INVENTORY_CLAIM= process.env.READ_INVENTORY_CLAIM || 'read:inventory';
const WRITE_INVENTORY_CLAIM= process.env.WRITE_INVENTORY_CLAIM || 'write:inventory';
const DELETE_INVENTORY_ITEMS_CLAIM= process.env.DELETE_INVENTORY_ITEMS_CLAIM || 'write:inventory_delete_items';
const READ_INVENTORY_TAGS_CLAIM= process.env.READ_INVENTORY_TAGS_CLAIM || 'read:inventory_tags';
const WRITE_INVENTORY_TAGS_CLAIM= process.env.WRITE_INVENTORY_TAGS_CLAIM || 'write:inventory_tags';
const READ_INVENTORY_CATEGORIES_CLAIM= process.env.READ_INVENTORY_CATEGORIES_CLAIM || 'read:inventory_categories';
const WRITE_INVENTORY_CATEGORIES_CLAIM= process.env.WRITE_INVENTORY_CATEGORIES_CLAIM || 'write:inventory_categories';
const READ_INVENTORY_SUPPLIERS_CLAIM= process.env.READ_INVENTORY_CATEGORIES_CLAIM || 'read:inventory_suppliers';
const WRITE_INVENTORY_SUPPLIERS_CLAIM= process.env.WRITE_INVENTORY_SUPPLIERS_CLAIM || 'write:inventory_suppliers';
const READ_CUSTOMERS_CLAIM= process.env.READ_CUSTOMERS_CLAIM || 'read:customers';
const WRITE_CUSTOMERS_CLAIM= process.env.WRITE_CUSTOMERS_CLAIM || 'write:customers';
const READ_CUSTOMER_TAGS_CLAIM= process.env.READ_CUSTOMER_TAGS_CLAIM || 'read:customer_tags';
const WRITE_CUSTOMER_TAGS_CLAIM= process.env.WRITE_CUSTOMER_TAGS_CLAIM || 'write:customer_tags';
const READ_CUSTOMER_ZONES_CLAIM= process.env.READ_CUSTOMER_ZONES_CLAIM || 'read:customer_zones';
const WRITE_CUSTOMER_ZONES_CLAIM= process.env.WRITE_CUSTOMER_ZONES_CLAIM || 'write:customer_zones';
const WRITE_CUSTOMER_PAYMENT_TERM= process.env.WRITE_CUSTOMER_PAYMENT_TERM || 'write:customer_payment_term';
const WRITE_CUSTOMER_HOLD_FLAG= process.env.WRITE_CUSTOMER_HOLD_FLAG || 'write:customer_hold_flag';
const READ_INVOICES_CLAIM= process.env.READ_INVOICES_CLAIM || 'read:invoices';
const WRITE_INVOICES_CLAIM= process.env.WRITE_INVOICES_CLAIM || 'write:invoices';
const EDIT_INVOICES_CLAIM= process.env.EDIT_INVOICES_CLAIM || 'edit:invoices';
const WRITE_IN_PERSON_INVOICES_CLAIM= process.env.WRITE_IN_PERSON_INVOICES_CLAIM || 'write:in_person_invoices';
const READ_INVOICE_MARGINS_CLAIM= process.env.READ_INVOICE_MARGINS_CLAIM || 'read:invoice_margins';
const WRITE_INVOICE_PAYMENTS_DATA_CLAIM= process.env.WRITE_INVOICE_PAYMENTS_DATA_CLAIM || 'write:invoice_payments_data';
const WRITE_OVERRIDE_MIN_SALE_PRICE_CLAIM= process.env.WRITE_OVERRIDE_MIN_SALE_PRICE_CLAIM || 'write:override_min_sale_price';
const READ_CUSTOMER_STATEMENT_CLAIM= process.env.READ_CUSTOMER_STATEMENT_CLAIM || 'read:customer_statement';
const WRITE_CUSTOMER_CANCEL_ORDER_DAY_CLAIM= process.env.WRITE_CUSTOMER_CANCEL_ORDER_DAY_CLAIM || 'write:customer_cancel_order_day';
const WRITE_CUSTOMER_PRINT_OUTSTANDING_BALANCES= process.env.WRITE_CUSTOMER_PRINT_OUTSTANDING_BALANCES || 'write:customer_print_outstanding_balances';
const RESET_NEGATIVE_INVENTORY_ITEMS= process.env.RESET_NEGATIVE_INVENTORY_ITEMS || 'write:reset_negative_inventory_items';
const MANAGE_USERS_PERMISSION= process.env.MANAGE_USERS_PERMISSION || 'write:manage_users';
const WRITE_DRIVER_DETAILS_PERMISSION= process.env.WRITE_DRIVER_DETAILS_PERMISSION || 'write:driver_details';
const WRITE_DRIVER_TOTALS_PERMISSION= process.env.WRITE_DRIVER_TOTALS_PERMISSION || 'write:driver_totals';
const WRITE_CHECK_DRIVER_DETAILS_PERMISSION= process.env.WRITE_CHECK_DRIVER_DETAILS_PERMISSION || 'write:check_driver_details';
const WRITE_CUSTOMER_SALES_REP_PERMISSION= process.env.WRITE_CUSTOMER_SALES_REP_PERMISSION || 'write:customer_sales_rep';
const WRITE_INVENTORY_ALERT_QUANTITY= process.env.WRITE_INVENTORY_ALERT_QUANTITY || 'write:inventory_alert_quantity';
const READ_PAYMENT_TERM_CLAIM= process.env.READ_PAYMENT_TERM_CLAIM || 'read:payment_term';
const WRITE_PAYMENT_TERM_CLAIM= process.env.WRITE_PAYMENT_TERM_CLAIM || 'write:payment_term';
const READ_CUSTOMER_GROUPS_CLAIM= process.env.READ_CUSTOMER_GROUPS || 'read:customer_groups';
const WRITE_CUSTOMER_GROUPS_CLAIM= process.env.WRITE_CUSTOMER_GROUPS || 'write:customer_groups';
const WRITE_SUPPLIER_INVOICE_PAYMENTS_DATA= process.env.WRITE_SUPPLIER_INVOICE_PAYMENTS_DATA  ||'write:supplier_invoice_payments_data';
const READ_DASHBOARD= process.env.READ_DASHBOARD  ||'read:dashboard';
const WRITE_ACTIVITY=process.env.WRITE_ACTIVITY ||'write:activity';
const READ_LEADS=process.env.READ_LEADS ||'read:leads';
const WRITE_LEADS=process.env.WRITE_LEADS || 'write:leads';
const READ_OPPORTUNITY=process.env_READ_OPPORTUNITY || 'read:opportunity';
const WRITE_OPPORTUNITY=process.env.WRITE_OPPORTUNITY || 'write:opportunity';
const READ_QUOTATION=process.env.READ_QUOTATION || 'read:quotation';
const WRITE_QUOTATION=process.env.WRITE_QUOTATION || 'write:quotation';
const READ_CRM_DASHBOARD=process.env.READ_CRM_DASHBOARD || 'read:crm_dashboard';
const READ_TELESALES_DASHBOARD=process.env.READ_TELESALES_DASHBOARD || 'read:telesales_dashboard';

// [Helmet]
const useHELMET = parseBoolean(process.env.HELMET);
const CSP_DEFAULT_SRC = [TOKEN_ISSUER];
const CSP_IMG_SRC = ['https://s.gravatar.com/', 'https://i1.wp.com/'];

// [MongoDB]
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/spice_direct';
const MONGO_AUTH_DB = process.env.MONGO_AUTH_DB || 'admin';
const {MONGO_USER, MONGO_PASS} = process.env;

// [API]
const INVOICE_ID_OFFSET = parseInt(process.env.INVOICE_ID_OFFSET, 10) || 0;
const ITEM_ID_OFFSET = parseInt(process.env.ITEM_ID_OFFSET, 10) || 0;
const INVOICES_EDIT_DURATION_LIMIT = parseInt(process.env.INVOICES_EDIT_DURATION_LIMIT, 10) || 7;
const INVOICES_EDIT_DURATION_SALES_HOURS = parseInt(process.env.INVOICES_EDIT_DURATION_SALES_HOURS, 10) || 36;

// [EMAIL]
const EMAIL_ADDRESS = process.env.EMAIL_ADDRESS;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_ENABLED = parseBoolean(process.env.EMAIL_ENABLED, false);

//spicedirectapp 
const SDW_APP_API = process.env.SDW_APP_API;
const SYNC_SECRET_TOKEN = process.env.SYNC_SECRET_TOKEN;

//content-src
const CONTENT_SRC_ALLOWED = process.env.content_src_allowed?.split(",\n") || [];

module.exports = {
    getInvoiceConfigForDate,
    getLatestInvoiceConfig,

    useTLS,
    TLS_KEY,
    TLS_CERT,

    PORT,
    NODE_ENV,
    DOMAIN,
    useCORS,
    LOG_LEVEL,

    useAUTH0,
    TOKEN_ISSUER,
    TOKEN_AUDIENCE,
    CLAIM_NAME,
    READ_ZONES_CLAIM,
    WRITE_ZONES_CLAIM,
    READ_SECTIONS_CLAIM,
    WRITE_SECTIONS_CLAIM,
    READ_VAT_CLAIM,
    WRITE_VAT_CLAIM,
    READ_INVENTORY_CLAIM,
    WRITE_INVENTORY_CLAIM,
    DELETE_INVENTORY_ITEMS_CLAIM,
    READ_INVENTORY_TAGS_CLAIM,
    WRITE_INVENTORY_TAGS_CLAIM,
    READ_INVENTORY_CATEGORIES_CLAIM,
    WRITE_INVENTORY_CATEGORIES_CLAIM,
    READ_INVENTORY_SUPPLIERS_CLAIM,
    WRITE_INVENTORY_SUPPLIERS_CLAIM,
    READ_CUSTOMERS_CLAIM,
    WRITE_CUSTOMERS_CLAIM,
    READ_CUSTOMER_TAGS_CLAIM,
    WRITE_CUSTOMER_TAGS_CLAIM,
    READ_CUSTOMER_ZONES_CLAIM,
    WRITE_CUSTOMER_ZONES_CLAIM,
    WRITE_CUSTOMER_PAYMENT_TERM,
    WRITE_CUSTOMER_HOLD_FLAG,
    READ_INVOICES_CLAIM,
    WRITE_INVOICES_CLAIM,
    EDIT_INVOICES_CLAIM,
    WRITE_IN_PERSON_INVOICES_CLAIM,
    READ_INVOICE_MARGINS_CLAIM,
    WRITE_INVOICE_PAYMENTS_DATA_CLAIM,
    WRITE_OVERRIDE_MIN_SALE_PRICE_CLAIM,
    READ_CUSTOMER_STATEMENT_CLAIM,
    WRITE_CUSTOMER_CANCEL_ORDER_DAY_CLAIM,
    WRITE_CUSTOMER_PRINT_OUTSTANDING_BALANCES,
    RESET_NEGATIVE_INVENTORY_ITEMS,
    MANAGE_USERS_PERMISSION,
    WRITE_DRIVER_DETAILS_PERMISSION,
    WRITE_DRIVER_TOTALS_PERMISSION,
    WRITE_CHECK_DRIVER_DETAILS_PERMISSION,
    WRITE_CUSTOMER_SALES_REP_PERMISSION,
    WRITE_INVENTORY_ALERT_QUANTITY,
    READ_PAYMENT_TERM_CLAIM,
    WRITE_PAYMENT_TERM_CLAIM,
    READ_CUSTOMER_GROUPS_CLAIM,
    WRITE_CUSTOMER_GROUPS_CLAIM,
    WRITE_SUPPLIER_INVOICE_PAYMENTS_DATA,
    READ_DASHBOARD,

    useHELMET,
    CSP_DEFAULT_SRC,
    CSP_IMG_SRC,

    MONGO_URL,
    MONGO_AUTH_DB,
    MONGO_USER,
    MONGO_PASS,

    INVOICE_ID_OFFSET,
    ITEM_ID_OFFSET,
    INVOICES_EDIT_DURATION_LIMIT,
    INVOICES_EDIT_DURATION_SALES_HOURS,

    EMAIL_ADDRESS,
    EMAIL_PASSWORD,
    EMAIL_ENABLED,

    SYNC_SECRET_TOKEN,
    SDW_APP_API,

    CONTENT_SRC_ALLOWED,

    WRITE_ACTIVITY,
    READ_LEADS,
    WRITE_LEADS,
    READ_OPPORTUNITY,
    WRITE_OPPORTUNITY,
    READ_QUOTATION,
    WRITE_QUOTATION,
    READ_CRM_DASHBOARD,
    READ_TELESALES_DASHBOARD,
    APP_ENV,
};
