import React, {useEffect, useState} from "react";
import {
	HashRouter,
	Routes, // instead of "Switch"
	Route,
	Navigate
} from "react-router-dom";
import {useAuth0} from "@auth0/auth0-react";
import { v4 as uuidv4 } from 'uuid';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Paper } from "@mui/material";
import NavBar from "./components/NavBar/NavBar";
import Invoices from "./pages/Invoice/Invoices"
import {Zone} from "./pages/Zone/Zone";
import {VAT} from "./pages/VAT/VAT";
import {Inventory} from "./pages/Inventory/Inventory";
import {InventoryTag} from "./pages/Inventory_Tag/InventoryTag";
import {InventoryCategory} from "./pages/Inventory_Category/InventoryCategory";
import {InventorySupplier} from "./pages/Inventory_Supplier/InventorySupplier";
import {CustomerTag} from "./pages/Customer_Tag/CustomerTag";
import {Customer} from "./pages/Customer/Customer";
import Dashboard from "./components/Dashboard/Dashboard";
import {OrderTakingSheet} from "./pages/OrderTakingSheet/OrderTakingSheet";
import {Users} from "./pages/Users/Users";
import {SupplierInvoices} from "./pages/Supplier_Invoices/SupplierInvoices";
import {CustomerAccounts} from "./pages/CustomerAccounts/CustomerAccounts";
import {DriverName} from "./pages/Driver/DriverName";
import {DriverTotals} from "./pages/Driver/DriverTotals";
import {VehicleName} from "./pages/Driver/VehicleName";
import {CustomerSalesRep} from "./pages/CustomerSalesRep/CustomerSalesRep";
import {SetCustomerZonesV3} from "./pages/Customer/SetCustomerZonesV3";
import {PaymentTerm} from "./pages/Payment_Term/PaymentTerm";
import CollectionInvoices from "./pages/Collections/CollectionInvoices";
import {CustomerGroups} from "./pages/Customer/CustomerGroups";
import {GroupPricing} from "./pages/Group Pricing/GroupPricing";
import OrderMap from "./pages/Order_Map/OrderMap";
import SalesTracker from "./pages/Sales_Tracker/SalesTracker";
import CRMTracker from "./pages/CRMTracker/CRMTracker";
import CRMManagement from "./pages/CRM/CRMManagement";

let initialPreferences = JSON.parse(localStorage.getItem("preferences"));

if(!initialPreferences) {
	const defaultPreferences = {
		theme: "dark"
	};
	localStorage.setItem("preferences", JSON.stringify(defaultPreferences));
	initialPreferences = defaultPreferences;
} else {
	initialPreferences.fontSize = Number(initialPreferences.fontSize);
}

export default function App() {
	const {isAuthenticated} = useAuth0();
	const [userPreferences, setUserPreferences] = useState(initialPreferences);
	const theme = React.useMemo(
		() =>
			createTheme({
				palette: {
					mode: userPreferences.theme,
				},
				// typography: {
				// 	fontSize: 15
				// }
			}),
		[userPreferences],
	);

	useEffect(() => {
		localStorage.setItem("preferences", JSON.stringify(userPreferences));
	}, [userPreferences]);

	const getNavBarComponent = component => {
		return <NavBar theme={theme} userPreferences={userPreferences} updateUserPreferences={setUserPreferences} renderComponent={component} />
	};

	const getConfigMappings = () => {
		return [
			<Route key={Math.random()} path={`/Setup/Zone`} element={getNavBarComponent(<Zone />)} />,
			<Route key={Math.random()} path={`/Setup/VAT`} element={getNavBarComponent(<VAT />)} />,
			<Route key={Math.random()} path={`/Setup/CustomerSalesRep`} element={getNavBarComponent(<CustomerSalesRep />)} />,
			<Route key={Math.random()} path={`/Setup/PaymentTerm`} element={getNavBarComponent(<PaymentTerm />)} />,
			<Route key={Math.random()} path={`/Setup/ItemSuppliers`} element={getNavBarComponent(<InventorySupplier />)} />,
			<Route key={Math.random()} path={`/Inventory/ItemList`} element={getNavBarComponent(<Inventory />)} />,
			<Route key={Math.random()} path={`/Inventory/ItemTags`} element={getNavBarComponent(<InventoryTag />)} />,
			<Route key={Math.random()} path={`/Inventory/ItemCategories`} element={getNavBarComponent(<InventoryCategory />)} />,
			<Route key={Math.random()} path={`/Customer/CustomerTags`} element={getNavBarComponent(<CustomerTag />)} />,
			<Route key={Math.random()} path={`/Customer/${encodeURIComponent("Customer")}`} element={getNavBarComponent(<Customer />)} />,
			<Route key={Math.random()} path={`/Customer/CustomerGroups`} element={getNavBarComponent(<CustomerGroups />)} />,
			<Route key={Math.random()} path={`/Customer/${encodeURIComponent("GroupPricing")}`} element={getNavBarComponent(<GroupPricing />)} />,
			<Route key={Math.random()} path={`/Customer/CRMManagement`} element={getNavBarComponent(<CRMManagement/>)} />,
			<Route key={Math.random()} path={`/Driver/${encodeURIComponent("Name")}`} element={getNavBarComponent(<DriverName />)} />,
			<Route key={Math.random()} path={`/Driver/${encodeURIComponent("Vehicle")}`} element={getNavBarComponent(<VehicleName />)} />,
			<Route key={Math.random()} path={`/Driver/SetCustomerZonev3`} element={getNavBarComponent(<SetCustomerZonesV3 />)} />,
			<Route key={Math.random()} path={`/Driver/${encodeURIComponent("OrderMap")}`} element={getNavBarComponent(<OrderMap/>)} />,
			<Route key={Math.random()} path={`/Invoice/ManageInvoices`} element={getNavBarComponent(<Invoices reduced={false} in_person={false} key={uuidv4()} />)} />,
			<Route key={Math.random()} path={`/Invoice/${encodeURIComponent("Invoices(limited)")}`} element={getNavBarComponent(<Invoices reduced={true} in_person={false} key={uuidv4()}/>)} />,
			<Route key={Math.random()} path={`/Invoice/${encodeURIComponent("Collections")}`} element={getNavBarComponent(<CollectionInvoices reduced={false} in_person={true} key={uuidv4()}/>)} />,
			<Route key={Math.random()} path={`/Invoice/${encodeURIComponent("OrderTakingSheet")}`} element={getNavBarComponent(<OrderTakingSheet />)} />,
			<Route key={Math.random()} path={`/Accounts/${encodeURIComponent("Receivable")}`} element={getNavBarComponent(<CustomerAccounts />)} />,
			<Route key={Math.random()} path={`/Accounts/${encodeURIComponent("Totals")}`} element={getNavBarComponent(<DriverTotals />)} />,
			<Route key={Math.random()} path={`/Accounts/SupplierInvoices`} element={getNavBarComponent(<SupplierInvoices />)} />,
			<Route key={Math.random()} path={`/Reporting/SalesTracker`} element={getNavBarComponent(<SalesTracker />)} />,
			<Route key={Math.random()} path={`/Reporting/CRMTracker`} element={getNavBarComponent(<CRMTracker />)} />,
			<Route key={Math.random()} path={`/Admin/${encodeURIComponent("ManageUsers")}`} element={getNavBarComponent(<Users />)} />,
		];
	};

	return (
		<ThemeProvider theme={theme}>
				<HashRouter>
					<Paper variant="outlined" elevation={0} style={{ width: "100%", height: "100%" }}>
						<Routes>
							<Route exact path="/" element={getNavBarComponent(<Dashboard />)} />
							{
								isAuthenticated ?
									getConfigMappings()
									:
									<Route
										path="*"
										element={<Navigate to="/" />}
										key={Math.random()}
									/>
							}
						</Routes>
					</Paper>
				</HashRouter>
		</ThemeProvider>
	);
}
