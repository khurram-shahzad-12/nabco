import PinDropIcon from '@mui/icons-material/PinDrop';
import MapIcon from '@mui/icons-material/Map';
import PercentIcon from '@mui/icons-material/Percent';
import CategoryIcon from '@mui/icons-material/Category';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ContactPageIcon from '@mui/icons-material/ContactPage';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import ReceiptIcon from '@mui/icons-material/Receipt';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import PersonIcon from '@mui/icons-material/Person';
import PaymentsIcon from '@mui/icons-material/Payments';
import AltRouteIcon from '@mui/icons-material/AltRoute';
// import SupervisedUserCircleIcon from '@mui/icons-material/SupervisedUserCircle';
// import GroupAddIcon from '@mui/icons-material/GroupAdd';
// import BackupIcon from '@mui/icons-material/Backup';
import SettingsIcon from '@mui/icons-material/Settings';
import GroupsIcon from '@mui/icons-material/Groups';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import SummarizeIcon from '@mui/icons-material/Summarize';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';

export const menuItems = [
	{
		name: "Setup",
		icon: <SettingsIcon />,
		requiredPermissions: [
			process.env.REACT_APP_READ_ZONES_CLAIM,
			process.env.REACT_APP_READ_VAT_CLAIM,
			process.env.REACT_APP_WRITE_CUSTOMER_SALES_REP_PERMISSION,
			process.env.REACT_APP_WRITE_PAYMENT_TERM_CLAIM,
			process.env.REACT_APP_WRITE_INVENTORY_SUPPLIERS_CLAIM
		],
		subItems: [
			{ name: "Zone", label: 'Zone', icon: <PinDropIcon />, requiredPermissions: [process.env.REACT_APP_READ_ZONES_CLAIM] },
			{ name: "VAT", label: 'VAT',  icon: <PercentIcon />, requiredPermissions: [process.env.REACT_APP_READ_VAT_CLAIM] },
			{ name: "CustomerSalesRep", label: 'Sales Rep', icon: <ContactPageIcon />, requiredPermissions: [process.env.REACT_APP_WRITE_CUSTOMER_SALES_REP_PERMISSION] },
			{ name: "Paymentterm", label: 'Payment Terms', icon: <PaymentsIcon />, requiredPermissions: [process.env.REACT_APP_WRITE_PAYMENT_TERM_CLAIM] },
			{ name: "ItemSuppliers", label: 'Suppliers List', icon: <LocalShippingIcon />, requiredPermissions: [process.env.REACT_APP_WRITE_INVENTORY_SUPPLIERS_CLAIM] },
		]
	},
	{
		name: "Inventory",
		icon: <CategoryIcon />,
		requiredPermissions: [
			process.env.REACT_APP_READ_INVENTORY_CLAIM,
			process.env.REACT_APP_READ_INVENTORY_TAGS_CLAIM,
			process.env.REACT_APP_READ_INVENTORY_CATEGORIES_CLAIM
		],
		subItems: [
			{ name: "ItemList", label: 'Inventory List', icon: <MapIcon />, requiredPermissions: [process.env.REACT_APP_READ_INVENTORY_CLAIM] },
			{ name: "ItemTags", label: 'Inventory Tags', icon: <LocalOfferIcon />, requiredPermissions: [process.env.REACT_APP_READ_INVENTORY_TAGS_CLAIM] },
			{ name: "ItemCategories", label: 'Inventory Category', icon: <CategoryIcon />, requiredPermissions: [process.env.REACT_APP_READ_INVENTORY_CATEGORIES_CLAIM] },
		]
	},
	{
		name: "Customer",
		icon: <ContactPageIcon />,
		requiredPermissions: [
			process.env.REACT_APP_READ_CUSTOMERS_CLAIM,
			process.env.REACT_APP_READ_CUSTOMER_GROUPS,
			process.env.REACT_APP_READ_CUSTOMER_TAGS_CLAIM,
			process.env.REACT_APP_READ_CRM_MANAGEMENT,
		],
		subItems: [
			{ name: "Customer", label: 'Customer Profile', icon: <ContactPhoneIcon />, requiredPermissions: [process.env.REACT_APP_READ_CUSTOMERS_CLAIM] },
			{ name: "CustomerGroups", label: 'Customer Groups', icon: <GroupsIcon />, requiredPermissions: [process.env.REACT_APP_READ_CUSTOMER_GROUPS] },
			{ name: "GroupPricing", label: 'Group Pricing', icon: <GroupsIcon />, requiredPermissions: [process.env.REACT_APP_READ_CUSTOMER_GROUPS] },
			{ name: "CustomerTags", label: 'Customer Tags',icon: <LocalOfferIcon />, requiredPermissions: [process.env.REACT_APP_READ_CUSTOMER_TAGS_CLAIM] },
			{ name: "CRMManagement", label: 'CRM',icon: <PersonAddAlt1Icon />, requiredPermissions: [process.env.REACT_APP_READ_CRM_MANAGEMENT] },
		]
	},
	{
		name: "Driver",
		icon: <LocalShippingIcon />,
		requiredPermissions: [
			process.env.REACT_APP_WRITE_DRIVER_DETAILS_PERMISSION,
			process.env.REACT_APP_WRITE_CUSTOMER_ZONES_CLAIM
		],
		subItems: [
			{ name: "Name", label: 'Driver Name', icon: <ContactPhoneIcon />, requiredPermissions: [process.env.REACT_APP_WRITE_DRIVER_DETAILS_PERMISSION] },
			{ name: "Vehicle", label: 'Vehicle', icon: <LocalShippingIcon />, requiredPermissions: [process.env.REACT_APP_WRITE_DRIVER_DETAILS_PERMISSION] },
			{ name: "SetCustomerZoneV3", label: 'Zone V3', icon: <PinDropIcon />, requiredPermissions: [process.env.REACT_APP_WRITE_CUSTOMER_ZONES_CLAIM] },
			{ name: "OrderMap", label: 'Order Map', icon: <AltRouteIcon />, requiredPermissions: [process.env.REACT_APP_WRITE_DRIVER_DETAILS_PERMISSION] },
		]
	},
	{
		name: "Invoice",
		icon: <ReceiptIcon />,
		requiredPermissions: [
			process.env.REACT_APP_READ_INVOICES_CLAIM,
			process.env.REACT_APP_WRITE_INVOICES_CLAIM,
			process.env.REACT_APP_READ_INVOICES_LIMITED_CLAIM,
			process.env.REACT_APP_WRITE_IN_PERSON_INVOICES_CLAIM
		],
		subItems: [
			{ name: "OrderTakingSheet", label: 'Order Taking', icon: <ReceiptIcon />, requiredPermissions: [process.env.REACT_APP_WRITE_INVOICES_CLAIM] },
			{ name: "ManageInvoices", label: 'Management Invoices',icon: <ReceiptIcon />, requiredPermissions: [process.env.REACT_APP_READ_INVOICES_CLAIM] },
			{ name: "Invoices(limited)",label: 'Delivery Invoices', icon: <ReceiptIcon />, requiredPermissions: [process.env.REACT_APP_READ_INVOICES_LIMITED_CLAIM] },
			{ name: "Collections", label: 'Collections Invoices', icon: <ReceiptIcon />, requiredPermissions: [process.env.REACT_APP_WRITE_IN_PERSON_INVOICES_CLAIM] },
		]
	},
	{
		name: "Accounts",
		icon: <AccountBalanceIcon />,
		requiredPermissions: [
			process.env.REACT_APP_WRITE_INVOICE_PAYMENTS_DATA_CLAIM,
			process.env.REACT_APP_WRITE_DRIVER_TOTALS_PERMISSION,
			process.env.REACT_APP_WRITE_INVENTORY_SUPPLIERS_CLAIM
		],
		subItems: [
			{ name: "Receivable", label: 'Receivable', icon: <RequestQuoteIcon />, requiredPermissions: [process.env.REACT_APP_WRITE_INVOICE_PAYMENTS_DATA_CLAIM] },
			{ name: "Totals", label: 'Driver Totals', icon: <SummarizeIcon />, requiredPermissions: [process.env.REACT_APP_WRITE_DRIVER_TOTALS_PERMISSION] },
			{ name: "SupplierInvoices", label: 'Supplier Invoices', icon: <ReceiptIcon />, requiredPermissions: [process.env.REACT_APP_WRITE_INVENTORY_SUPPLIERS_CLAIM] }
		]
	},
	{
		name: "Reporting",
		icon: <ReceiptIcon />,
		requiredPermissions: [
			process.env.REACT_APP_READ_DASHBOARD,
			process.env.REACT_APP_READ_CRM_TRACKER,
		],
		subItems: [
			{ name: "CRMTracker", label: 'CRM Tracker', icon: <TrackChangesIcon />, requiredPermissions: [process.env.REACT_APP_READ_CRM_TRACKER] },
			{ name: "SalesTracker", label: 'Sales Tracker', icon: <PointOfSaleIcon />, requiredPermissions: [process.env.REACT_APP_READ_DASHBOARD] },
		]
	},
	{
		name: "Admin",
		icon: <ManageAccountsIcon />,
		requiredPermissions: [process.env.REACT_APP_MANAGE_USERS_PERMISSION],
		subItems: [
			{ name: "ManageUsers", label:'Manage Users', icon: <PersonIcon />, requiredPermissions: [process.env.REACT_APP_MANAGE_USERS_PERMISSION] },
			// { name: "Manage Users", icon: <GroupAddIcon /> },
			// { name: "Manage User Roles", icon: <SupervisedUserCircleIcon /> },
			// { name: "Backup", icon: <BackupIcon /> }
		]
	}
];