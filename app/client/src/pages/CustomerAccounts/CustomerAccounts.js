import React, { useEffect, useState } from 'react';
import CustomisedSnackBar from "../../components/customisedSnackBar/CustomisedSnackBar";

import DataViewGrid from "../../components/DataViewGrid/DataViewGrid";
import AdapterDateFns from "@mui/lab/AdapterDateFns";
import DatePicker from "@mui/lab/DatePicker";
import LocalizationProvider from "@mui/lab/LocalizationProvider";
import {
    currentUserHasPermissions,
    daysMap,
    defaultLoadedFieldData,
    defaultSnackState,
    fetchAllEntriesAndSetRowData, fetchDropdownField,
    momentFormat
} from "../../components/formFunctions/FormFunctions";
import {Button, TextField} from "@mui/material";
import moment from "moment";
import ListInvoicesModal from "../../components/ListInvoicesModal/ListInvoicesModal";
import AccountsTotalModal from "../../components/AccountsTotalsModal/AccountsTotalModal";

const API_NAME = '/invoice/getCustomerAccountData';

export const CustomerAccounts = () => {
    const requiredCSVPermission = [process.env.REACT_APP_CUSTOMER_ACCOUNTS_CSV_PERMISSION];
    const [accountTotalsAlertModalOpen, setAccountTotalsAlertModalOpen] = useState(false);
    const [snackState, setSnackState] = useState(defaultSnackState);
    const [sendingData, setSendingData] = useState(false);
    const [rowData, setRowData] = useState([]);
    const [paymentTermsData, setPaymentTermsData] = useState(defaultLoadedFieldData);
    const [startDate, setStartDate] = useState(moment(new Date()).subtract(7, "days").format(momentFormat));
    const [endDate, setEndDate] = useState(moment(new Date()).format(momentFormat));
    const [gridApi, setGridApi] = useState(null);

    const handleSearchDateChange = (newDate, dateType) => {
        const momentDate = moment(newDate).format(momentFormat);
        if(dateType === "start") {
            setStartDate(momentDate);
        } else {
            setEndDate(momentDate);
        }
    };

    const fetchCustomerAccountsData = () => {
        fetchAllEntriesAndSetRowData(API_NAME, {params: {start: startDate, end: endDate}}, setSendingData, setRowData, setSnackState);
    }

    const fetchPaymentTermsData = () => {
        fetchDropdownField("/payment-term", setPaymentTermsData, setSnackState, false);
    };

    const fetchAllItems = () => {
        fetchCustomerAccountsData();
        fetchPaymentTermsData();
    }

    useEffect(() => {
        fetchAllItems();
    }, [startDate, endDate]);

    const getInvoicesActionCell = props => {
        let invoiceEditCB = () => alert("Can't edit invoices from this screen");
        if(props.data.invoices.length > 0) {
            return <ListInvoicesModal customer={props.data} invoices={props.data.invoices} editInvoice={invoiceEditCB} reloadInvoicesTrigger={fetchCustomerAccountsData} />;
        } else {
            return "";
        }
    };

    const getBalanceToPayCell = props => {
        const totalInvoicesAmount = Number(props.data.invoices.reduce(
            (accumulator, currentValue) => accumulator + currentValue.total_incl_vat,
            0,
        ));

        const totalAmountsPaid = Number(props.data.invoices.reduce(
            (accumulator, currentValue) => accumulator + currentValue.payments.reduce((paymentAccumulator, currentPayment) => paymentAccumulator + currentPayment.amount, 0),
            0,
        ));

        return  Number(totalInvoicesAmount - totalAmountsPaid).toFixed(2);
    };

    const doNotCallCellRenderer = props => {
        return props.value? "NO" : "YES";
    }

    const OTDaysValueGetter = props => {
        return props.data.payment_taking_days.map((item) => daysMap[item].toUpperCase().substring(0, 3));
    };

    const colDefs = [
        {
            field: "customer_name",
            headerName: "Customer Name"
        },
        {
            field: "payment_term",
            headerName: "Payment Term",
            valueGetter: props => paymentTermsData.loaded && paymentTermsData.map[props.data.payment_term]?.name
        },
        {
            field: "payment_method",
            headerName: "Payment Method"
        },
        {
            field: "_id",
            headerName: "#Invoices To Pay",
            type: "rightAligned",
            valueGetter: props => props.data.invoices.length
        },
        {
            field: "_id",
            headerName: "Total Balance To Pay(£)",
            type: "rightAligned",
            valueGetter: getBalanceToPayCell
        },
        {
            field: "payment_contact_name",
            headerName: "Payment Contact Name"
        },
        {
            field: "do_not_call_for_payments",
            headerName: "CALL",
            valueGetter: doNotCallCellRenderer
        },
        {
            field: "payment_contact_method",
            headerName: "Payment Contact Method"
        },
        {
            field: "payment_contact_detail",
            headerName: "Payment Contact Detail"
        },
        {
            field: "payment_comments",
            headerName: "Comments"
        },
        {
            field: "payment_taking_days",
            headerName: "Payment Taking Days",
            // cellRenderer: OTWeekdaysCellRenderer,
            // filter: OrderTaking_dayOfWeekFilter,
            valueGetter: OTDaysValueGetter,
            filterParams: {
                columnName: "order_taking_days"
            }
        },
        {
            field: "_id",
            headerName: "Invoices",
            floatingFilter: false,
            filter: false,
            minWidth: 226,
            cellRenderer: getInvoicesActionCell
        }
    ];

    const topContainerStyle = {
        display: "inline-flex",
        height: "20%",
        width: "100%"
    };

    const csvAction = event => {
        if(!gridApi) {
            alert("Grid API not ready, please wait before trying again");
        } else {
            const resCSV = gridApi.api.exportDataAsCsv();
        }
    };

    const totalsAction = event => {
        const getInvoicesBalance = invoices => {
            const totalInvoicesAmount = Number(invoices.reduce(
                (accumulator, currentValue) => accumulator + currentValue.total_incl_vat,
                0,
            ));

            const totalAmountsPaid = Number(invoices.reduce(
                (accumulator, currentValue) => accumulator + currentValue.payments.reduce((paymentAccumulator, currentPayment) => paymentAccumulator + currentPayment.amount, 0),
                0,
            ));

            return Number(totalInvoicesAmount - totalAmountsPaid).toFixed(2);
        }

        if(!gridApi) {
            alert("Grid API not ready, please wait before trying again");
        } else {
            const totals = {};
            Object.keys(paymentTermsData.map).forEach(id => {
                totals[paymentTermsData.map[id].name] = 0;
            });
            totals["NO PAYMENT TERM ASSIGNED"] = 0;
            rowData.forEach(entry => {
                if(!entry.payment_term) {
                    totals["NO PAYMENT TERM ASSIGNED"] += Number(getInvoicesBalance(entry.invoices));
                } else {
                    totals[paymentTermsData.map[entry.payment_term].name] += Number(getInvoicesBalance(entry.invoices));
                }
            })
            return totals;
        }
    };

    return <div style={{height: "90%"}}>
        <CustomisedSnackBar {...snackState} setClosed={setSnackState} />
        {accountTotalsAlertModalOpen && <AccountsTotalModal totals={totalsAction()} startDate={startDate} endDate={endDate} handleClose={() => setAccountTotalsAlertModalOpen(false)}/>}
        <div style={topContainerStyle}>
            <div>
                <span>From</span>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                        label="Start Date"
                        value={startDate}
                        onChange={newDate => handleSearchDateChange(newDate, "start")}
                        inputFormat="dd/MM/yyyy"
                        renderInput={(params) => <TextField {...params} />}
                    />
                </LocalizationProvider>
                <span>To</span>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                        label="End Date"
                        value={endDate}
                        onChange={newDate => handleSearchDateChange(newDate, "end")}
                        inputFormat="dd/MM/yyyy"
                        renderInput={(params) => <TextField {...params} />}
                    />
                </LocalizationProvider>
                <Button variant="contained" onClick={fetchAllItems}>Reload</Button>
            </div>
        </div>
        {currentUserHasPermissions(requiredCSVPermission) && <Button variant="contained" onClick={csvAction} disabled={sendingData}>CSV</Button>}
        {currentUserHasPermissions(requiredCSVPermission) && <Button variant="contained" onClick={() => setAccountTotalsAlertModalOpen(true)} disabled={sendingData}>Totals</Button>}
        <div style={{height: "80%", marginTop: "2em"}}>
            <DataViewGrid
                rowData={rowData}
                columnDefs={colDefs}
                loading={sendingData}
                getGridApi={setGridApi}
            />
        </div>
    </div>;
};