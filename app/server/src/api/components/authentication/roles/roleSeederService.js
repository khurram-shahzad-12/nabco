const Role = require('./model');
const Permission = require('../permissions/model');

const roles = [
  {
    name: 'admin',
    displayName: 'Administrator',
    description: 'Full system access with all permissions',
    isSystemRole: true
  },
  {
    name: 'manager',
    displayName: 'Manager',
    description: 'Management access with limited admin features',
    isSystemRole: true
  },
  {
    name: 'accountant',
    displayName: 'Accountant',
    description: 'Financial and invoice management',
    isSystemRole: true
  },
  {
    name: 'telesales',
    displayName: 'Telesales',
    description: 'Customer management and order creation',
    isSystemRole: true
  },
  {
    name: 'sales_rep',
    displayName: 'Sales Representative',
    description: 'Basic sales operations',
    isSystemRole: true
  },
  {
    name: 'driver',
    displayName: 'Driver',
    description: 'Delivery and route management',
    isSystemRole: true
  }
];

const seedRoles = async () => {
  try {
    await Role.deleteMany({});
    const allPermissions = await Permission.find({});    
    if (allPermissions.length === 0) {
      console.warn('No permissions found! Please run permission seeder first.');
      return;
    }
    const getPermissionIds = (filterFn) => { return allPermissions.filter(filterFn).map(p => p._id); };
    for (const roleData of roles) {
      let permissions = [];
      if (roleData.name === 'admin') {
        permissions = allPermissions.map(p => p._id);
      } else if (roleData.name === 'manager') {
        permissions = getPermissionIds(p => 
          p.module !== 'users' && 
          p.module !== 'settings' &&
          p.action !== 'delete' &&
          p.action !== 'approve'
        );
        
      } else if (roleData.name === 'accountant') {
        permissions = getPermissionIds(p => 
          ['invoices', 'payments', 'reports'].includes(p.module) ||
          (p.module === 'customers' && p.action === 'read') ||
          p.module === 'customer_statement' ||
          p.module === 'invoice_margins' ||
          p.module === 'invoice_payments_data' ||
          p.module === 'customer_print_outstanding_balances' ||
          p.module === 'supplier_invoice_payments_data'
        );
        
      } else if (roleData.name === 'telesales') {
        permissions = getPermissionIds(p => 
          (p.module === 'customers' && ['create', 'read', 'update'].includes(p.action)) ||
          (p.module === 'invoices' && ['create', 'read', 'update'].includes(p.action)) ||
          p.module === 'customer_groups' ||
          p.module === 'customer_zones' ||
          p.module === 'customer_tags' ||
          p.module === 'customer_sales_rep' ||
          p.module === 'customer_cancel_order_day' ||
          p.module === 'customer_hold_flag' ||
          p.module === 'customer_payment_term' ||
          p.module === 'in_person_invoices' ||
          p.module === 'invoices_limited' ||
          p.module === 'leads' ||
          p.module === 'opportunity' ||
          p.module === 'quotation' ||
          p.module === 'activity' ||
          (p.module === 'crm_management' && p.action === 'read') ||
          (p.module === 'crm_dashboard' && p.action === 'read') ||
          (p.module === 'telesales_dashboard' && p.action === 'read')
        );
        
      } else if (roleData.name === 'sales_rep') {
        permissions = getPermissionIds(p => 
          (p.module === 'customers' && ['create', 'read'].includes(p.action)) ||
          (p.module === 'invoices' && ['create', 'read'].includes(p.action)) ||
          p.module === 'customer_groups' ||
          p.module === 'customer_zones' ||
          p.module === 'customer_tags' ||
          p.module === 'leads' ||
          p.module === 'opportunity' ||
          p.module === 'quotation' ||
          (p.module === 'crm_dashboard' && p.action === 'read')
        );
        
      } else if (roleData.name === 'driver') {
        permissions = getPermissionIds(p => 
          p.module === 'drivers' ||
          p.module === 'driver_details' ||
          p.module === 'driver_totals' ||
          p.module === 'checked_driver_details' ||
          p.module === 'check_driver_details' ||
          (p.module === 'customers' && p.action === 'read') ||
          (p.module === 'invoices' && p.action === 'read') ||
          p.module === 'invoices_limited' ||
          p.module === 'customer_zones'
        );
      }
      const role = await Role.create({ ...roleData, permissions });
    }
    
    console.log('Roles seeded successfully!');
  } catch (error) {
    console.error('Error seeding roles:', error);
    throw error;
  }
};

module.exports = seedRoles;