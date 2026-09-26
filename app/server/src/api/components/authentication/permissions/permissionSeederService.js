const Permission = require('./model');

const modules = [
  'dashboard',
  'customers',
  'invoices',
  'inventory',
  'drivers',
  'reports',
  'users',
  'settings',
  'payments',
  'customer_groups',
  'customer_zones',
  'customer_tags',
  'zones',
  'sections',
  'vat',
  'inventory_tags',
  'inventory_categories',
  'inventory_suppliers',
  'customer_payment_term',
  'customer_hold_flag',
  'invoices_limited',
  'invoice_margins',
  'invoice_payments_data',
  'override_min_sale_price',
  'customer_statement',
  'customer_cancel_order_day',
  'customer_print_outstanding_balances',
  'reset_negative_inventory_items',
  'show_value_inventory_items',
  'manage_users',
  'driver_details',
  'driver_totals',
  'checked_driver_details',
  'customer_sales_rep',
  'inventory_alert_quantity',
  'payment_term',
  'customer_shop_keys',
  'customer_accounts_csv',
  'supplier_invoice_payments_data',
  'crm_tracker',
  'crm_management',
  'in_person_invoices',
  'activity',
  'leads',
  'opportunity',
  'quotation',
  'crm_dashboard',
  'telesales_dashboard',
  'check_driver_details',
  'inventory_delete_items'
];
const actions = ['create', 'read', 'update', 'delete', 'export', 'import', 'approve', 'write', 'edit'];

const permissionDescriptions = {
  'dashboard': {
    'read': 'View dashboard and analytics'
  },
  'customers': {
    'write': 'Update customers & customer specific product prices (update, Deleted)',
    'read': 'View customer details & Customer Specific product Prices',
    'update': 'Edit customer information',
    'delete': 'Delete customers',
    'export': 'Export customer data',
    'import': 'Import customer data'
  },
  'invoices': {
    'create': 'Create new invoices',
    'read': 'View invoices',
    'write': 'Create, Update, Delete Invoices',
    'update': 'Edit invoices',
    'delete': 'Delete invoices',
    'export': 'Export invoice data',
    'approve': 'Approve invoices',
    'edit': 'Edit invoices',
  },
  'inventory': {
    'create': 'Add inventory items',
    'write': 'Update, Delete Inventory',
    'read': 'View inventory',
    'update': 'Update inventory',
    'delete': 'Delete inventory items',
    'export': 'Export inventory data',
    'import': 'Import inventory data'
  },
  'drivers': {
    'create': 'Add drivers',
    'read': 'View driver details',
    'update': 'Edit driver information',
    'delete': 'Delete drivers'
  },
  'reports': {
    'create': 'Generate reports',
    'read': 'View reports',
    'export': 'Export reports'
  },
  'users': {
    'create': 'Create users',
    'read': 'View users',
    'update': 'Edit users',
    'delete': 'Delete users'
  },
  'settings': {
    'read': 'View settings',
    'update': 'Update settings'
  },
  'payments': {
    'create': 'Create payments',
    'read': 'View payments',
    'update': 'Update payments',
    'delete': 'Delete payments'
  },
  'customer_groups': {
    'create': 'Create customer groups',
    'write': 'Create, Update and Delete Customer Groups',
    'read': 'View customer groups',
    'update': 'Edit customer groups',
    'delete': 'Delete customer groups'
  },
  'customer_zones': {
    'create': 'Create customer zones',
    'write': 'Create, update, delete zonesV3',
    'read': 'View customer zones',
    'update': 'Edit customer zones',
    'delete': 'Delete customer zones'
  },
  'customer_tags': {
    'create': 'Create customer tags',
    'read': 'View customer tags',
    'update': 'Edit customer tags',
    'delete': 'Delete customer tags',
    'write': 'Cpdate delete customer tags'
  },
  'zones': {
    'read': 'View zones',
    'write': 'Write zones'
  },
  'sections': {
    'read': 'View sections',
    'write': 'Write sections'
  },
  'vat': {
    'read': 'View VAT',
    'write': 'Write VAT'
  },
  'inventory_tags': {
    'read': 'View inventory tags',
    'write': 'Write inventory tags'
  },
  'inventory_categories': {
    'read': 'View inventory categories',
    'write': 'Write inventory categories'
  },
  'inventory_suppliers': {
    'read': 'View inventory suppliers',
    'write': 'Write inventory suppliers'
  },
  'customer_payment_term': {
    'write': 'Write customer payment term'
  },
  'customer_hold_flag': {
    'write': 'Write customer hold flag'
  },
  'invoices_limited': {
    'read': 'View limited invoices'
  },
  'invoice_margins': {
    'read': 'View invoice margins'
  },
  'invoice_payments_data': {
    'write': 'Write invoice payments data'
  },
  'override_min_sale_price': {
    'write': 'Override minimum sale price'
  },
  'customer_statement': {
    'read': 'View customer statement'
  },
  'customer_cancel_order_day': {
    'write': 'Write customer cancel order day'
  },
  'customer_print_outstanding_balances': {
    'write': 'Write customer print outstanding balances'
  },
  'reset_negative_inventory_items': {
    'write': 'Reset negative inventory items'
  },
  'show_value_inventory_items': {
    'write': 'Show value inventory items'
  },
  'manage_users': {
    'write': 'Manage users'
  },
  'driver_details': {
    'write': 'Write driver details'
  },
  'driver_totals': {
    'write': 'Write driver totals'
  },
  'checked_driver_details': {
    'write': 'Write checked driver details'
  },
  'customer_sales_rep': {
    'write': 'Write customer sales rep'
  },
  'inventory_alert_quantity': {
    'write': 'Write inventory alert quantity'
  },
  'payment_term': {
    'read': 'Read payment terms',
    'write': 'Write payment terms'
  },
  'customer_shop_keys': {
    'write': 'Write customer shop keys'
  },
  'customer_accounts_csv': {
    'write': 'Write customer accounts CSV'
  },
  'supplier_invoice_payments_data': {
    'write': 'Write supplier invoice payments data'
  },
  'crm_tracker': {
    'read': 'View CRM tracker'
  },
  'crm_management': {
    'read': 'View CRM management'
  },
  'in_person_invoices': {
    'write': 'Write in-person invoices'
  },
  'activity': {
    'write': 'Write activity'
  },
  'leads': {
    'read': 'Read leads',
    'write': 'Write leads'
  },
  'opportunity': {
    'read': 'Read opportunity',
    'write': 'Write opportunity'
  },
  'quotation': {
    'read': 'Read quotation',
    'write': 'Write quotation'
  },
  'crm_dashboard': {
    'read': 'View CRM dashboard'
  },
  'telesales_dashboard': {
    'read': 'View Telesales dashboard'
  },
  'check_driver_details': {
    'write': 'Write check driver details'
  },
  'inventory_delete_items': {
    'write': 'Delete inventory items'
  }
};

const seedPermissions = async (force = false) => {
  try {
    const existingPermissions = await Permission.find({});
    if (existingPermissions.length > 0 && !force) {
      console.log(`Permissions already exist (${existingPermissions.length} found). Use force=true to re-seed.`);
      return existingPermissions;
    }
    if (force) { await Permission.deleteMany({}); }
    
    const permissions = [];
    for (const module of modules) {
      if (!permissionDescriptions[module]) {
        continue;
      }
      const modulePermissions = permissionDescriptions[module];
      for (const [action, description] of Object.entries(modulePermissions)) {
        permissions.push({
          module,
          action,
          description
        });
      }
    }
    if (permissions.length === 0) { throw new Error('No permissions to seed'); }
    const result = await Permission.insertMany(permissions);
    const grouped = result.reduce((acc, p) => {
      if (!acc[p.module]) acc[p.module] = [];
      acc[p.module].push(p.action);
      return acc;
    }, {});    
    return result;
    
  } catch (error) {
    console.error(' Error seeding permissions:', error);
    throw error;
  }
};

module.exports = seedPermissions;