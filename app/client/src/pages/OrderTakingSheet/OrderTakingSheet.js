import React, { useEffect, useState } from 'react';

import displaySnackState from "../../components/customisedSnackBar/DisplaySnackState";
import CustomisedSnackBar from "../../components/customisedSnackBar/CustomisedSnackBar";
import {
    defaultLoadedFieldData, defaultSnackState,
    fetchAllEntriesAndSetRowData, fetchDropdownField, getIDMappingForElement, momentFormat,
    currentUserHasPermissions, fetchEntries
} from "../../components/formFunctions/FormFunctions";

import {Button, Dialog, TextField, Stack} from "@mui/material";

import DataViewGrid from "../../components/DataViewGrid/DataViewGrid";
import axiosDefault from "../../components/axiosDefault/axiosDefault";
import AdapterDateFns from "@mui/lab/AdapterDateFns";
import DatePicker from "@mui/lab/DatePicker";
import LocalizationProvider from "@mui/lab/LocalizationProvider";
import DialogClosingTitleBar from "../../components/DialogClosingTitleBar/DialogClosingTitleBar";
import InvoiceForm from "../../components/InvoiceForm/InvoiceForm";
import PaymentsForm from "../../components/PaymentsForm/PaymentsForm";
import ListInvoicesModal from "../../components/ListInvoicesModal/ListInvoicesModal";
import OrderTakingCustomerNameCellRenderer from "../../components/cellRenderers/OrderTakingCustomerNameCellRenderer";
import moment from "moment";
import CustomerCallbackTimePicker from "../../components/CustomerCallbackTimePicker/CustomerCallbackTimePicker";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import Tooltip from "@mui/material/Tooltip";
import CustomerTemporaryOTPicker from "../../components/CustomerTemporaryOTPicker/CustomerTemporaryOTPicker";
import {useAuth0} from "@auth0/auth0-react";
import LinkedFieldCellValueGetterRenderer from "../../components/cellRenderers/LinkedFieldCellValueGetterRenderer";

const API_NAME = '/customer';

const gridProps = {
    gridOptions: {
        suppressScrollOnNewData: true
    }
};

export const OrderTakingSheet = () => {
    const {user} = useAuth0();
    const axios = axiosDefault();
    const [dialogState, setDialogState] = React.useState({open: false});
    const [callbackDialogState, setCallbackDialogState] = React.useState({open: false});
    const [customerTemporaryOTDialogState, setCustomerTemporaryOTDialogState] = React.useState({open: false});
    const [paymentsModalData, setPaymentsModalData] = useState({open: false});
    const [sendingData, setSendingData] = useState(false);
    const [selectedDate, setSelectedDate] = useState(moment(new Date()).format(momentFormat));
    const [snackState, setSnackState] = useState(defaultSnackState);
    const [rowData, setRowData] = useState([]);
    const [invoicesList, setInvoicesList] = useState([]);
    const [productsList, setProductsList] = useState(defaultLoadedFieldData);
    const [vatData, setVatData] = useState(defaultLoadedFieldData);
    const [salesRepData, setSalesRepData] = useState(defaultLoadedFieldData);
    const [cancelledInvoiceDayCustomers, setCancelledInvoiceDayCustomers] = useState({});
    const [temporaryOrderingCustomers, setTemporaryOrderingCustomers] = useState({});
    const [customersToCallback, setCustomersToCallback] = useState([]);
    const [callbackInterval, setCallbackInterval] = useState(null);
    const requiredWritePermissions = [process.env.REACT_APP_WRITE_INVOICES_CLAIM];
    const requiredCancelOrderingPermissions = [process.env.REACT_APP_WRITE_CUSTOMER_CANCEL_ORDER_DAY_CLAIM];

    const handleCloseDialog = () => setDialogState({open: false});
    const handleCloseCallbackDialog = () => setCallbackDialogState({open: false});
    const handleCloseCustomerTemporaryOTDialog = () => setCustomerTemporaryOTDialogState({open: false});
    const handleClosePaymentsForm = () => setPaymentsModalData({open: false});

    const callbackIntervalFunction = () => {
        const now = moment(new Date());
        const nowMinute = now.minute();
        const nowHour = now.hour();
        customersToCallback.forEach(currentCustomer => {
            const currentCustomerCallbackTime = moment(currentCustomer.time);
            if(currentCustomerCallbackTime.minute() === nowMinute && currentCustomerCallbackTime.hour() === nowHour) {
                alert(`Call back [${getCustomerNameFromID(currentCustomer.customer)}]\nNote(s): ${currentCustomer.comment}`);
            }
        });
    };

    const onDateChange = newDate => {
        setSelectedDate(moment(newDate).format(momentFormat));
    };

    const createInvoice = customer => {
        setDialogState({open: true, mode: "CREATE", canEdit: true, selectedCustomer: customer, selectedOTDate: selectedDate});
    };

    const addCustomerCallbackTimerToDB = data => {
        setSendingData(true);
        axios.post(`${process.env.REACT_APP_URL_ROOT}/api/customerCallbackTimers`, data)
            .then(response => {
                getCustomerCallbackTimers();
            })
            .catch(error => {
                console.error(error);
                displaySnackState(`Failed to save callback - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
            })
            .finally(() => {
                setSendingData(false);
            })
    };

    const deleteCustomerCallbackTimer = id => {
        setSendingData(true);
        axios.delete(`${process.env.REACT_APP_URL_ROOT}/api/customerCallbackTimers/${id}`)
            .then(response => {
                getCustomerCallbackTimers();
            })
            .catch(error => {
                console.error(error);
                displaySnackState(`Failed to delete callback - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
            })
            .finally(() => {
                setSendingData(false);
            })
    };

    const createCallback = customer => {
        const saveFunction = (time, comment) => {
            const newCallbackItem = {
                customer: customer._id,
                comment: comment,
                time: moment(time),
                user: user.name
            };
            addCustomerCallbackTimerToDB(newCallbackItem);
            setCallbackDialogState({open: false});
        }
        setCallbackDialogState({open: true, selectedCustomer: customer, saveFunction: saveFunction});
    };

    const handleAddTemporaryCustomer = () => {
        const remainingCustomers = rowData.filter(customer => customer.active && !(customer.order_taking_days.includes(moment(selectedDate).day())) && !isTemporaryCustomerForToday(customer));
        const addSelectedCustomer = id => {
            handleCloseCustomerTemporaryOTDialog();
            enableCustomerTemporaryOrderingDay(id);
        };
        setCustomerTemporaryOTDialogState({open: true, customers: remainingCustomers, add: addSelectedCustomer});
    };

    const postSubmitCallback = () => {
        setDialogState({open: false});
        getInvoicesList();
    };

    const getInvoicesList = () => {
        setSendingData(true);
        axios.get(`${process.env.REACT_APP_URL_ROOT}/api/invoice`, {params: {ot_day_start: selectedDate, ot_day_end: selectedDate}})
            .then(response => {
                setInvoicesList(response.data);
            })
            .catch(error => {
                console.error(error);
                displaySnackState(`Failed to load invoices list - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
            })
            .finally(() => {
                setSendingData(false);
            })
    };

    const cancelCustomerInvoiceDay = (data, reason) => {
        setSendingData(true);
        axios.post(`${process.env.REACT_APP_URL_ROOT}/api/customerCancelledInvoicesDay/`, {customer: data._id, reason: reason, ot_date: selectedDate})
            .then(response => {
                getCustomerCancelledInvoicesDay();
            })
            .catch(error => {
                console.error(error);
                displaySnackState(`Failed to cancel customers invoice day - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
            })
            .finally(() => {
                setSendingData(false);
            })
    };

    const enableCustomerInvoiceDay = data => {
        setSendingData(true);
        axios.delete(`${process.env.REACT_APP_URL_ROOT}/api/customerCancelledInvoicesDay/${cancelledInvoiceDayCustomers[data._id]._id}`,)
            .then(response => {
                getCustomerCancelledInvoicesDay();
            })
            .catch(error => {
                console.error(error);
                displaySnackState(`Failed to enable customers invoice day - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
            })
            .finally(() => {
                setSendingData(false);
            })
    };

    const enableCustomerTemporaryOrderingDay = customerID => {
        setSendingData(true);
        axios.post(`${process.env.REACT_APP_URL_ROOT}/api/customerTemporaryOrdersDay/`, {customer: customerID, ot_date: selectedDate})
            .then(response => {
                getTemporaryOrderingCustomers();
            })
            .catch(error => {
                console.error(error);
                displaySnackState(`Failed to temporarily enable customers order taking day - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
            })
            .finally(() => {
                setSendingData(false);
            })
    };

    const invoiceButtonRenderer = props => {
        const currentCustomerID = props.data._id;
        const isCurrentCustomerInvoicesCancelled = currentCustomerID in cancelledInvoiceDayCustomers;
        return <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={() => createInvoice(props.data)}
                    disabled={!props.data.active
                    || props.data.on_hold
                    || isCurrentCustomerInvoicesCancelled
                    || !currentUserHasPermissions(requiredWritePermissions)
                    }
            >Invoice</Button>
            <Button variant="contained" onClick={() => createCallback(props.data)}
                    disabled={!props.data.active
                    || props.data.on_hold
                    || isCurrentCustomerInvoicesCancelled
                    || !currentUserHasPermissions(requiredWritePermissions)
                    }
            >CALL BACK</Button>
            <Button variant="contained"
                    style={{
                        background: isCurrentCustomerInvoicesCancelled ? "red" : ""
                    }}
                    onClick={() => {
                        if(!isCurrentCustomerInvoicesCancelled) {
                            if (window.confirm("Are you sure you want to cancel invoicing today for this customer?")) {
                                let reason = prompt("Enter a reason for cancellation");
                                if(reason !== null) {
                                    cancelCustomerInvoiceDay(props.data, reason);
                                }
                            }
                        } else {
                            if (window.confirm("Are you sure you want to re-enable invoicing today for this customer?")) {
                                enableCustomerInvoiceDay(props.data);
                            }
                        }
                    }}
                    disabled={!props.data.active || props.data.on_hold || !currentUserHasPermissions(requiredCancelOrderingPermissions)}
            >
                {isCurrentCustomerInvoicesCancelled ? "UNCANCEL" : "CANCEL"}
            </Button>
            {
                isCurrentCustomerInvoicesCancelled &&
                <Button variant="contained" onClick={() => alert(cancelledInvoiceDayCustomers[currentCustomerID].reason)}
                >Reason</Button>
            }
        </Stack>
    };

    const removeCallbackCustomerCellRenderer = props => {
        const deleteCustomerCallbackRecord = () => {
            if(window.confirm(`Are you sure you want to remove customer [${getCustomerNameFromID(props.data.customer)}] from the callback list?`)) {
                deleteCustomerCallbackTimer(props.data._id);
            }
        };

        return <Tooltip title="Delete">
            <IconButton aria-label="delete" onClick={deleteCustomerCallbackRecord}>
                <DeleteIcon />
            </IconButton>
        </Tooltip>
    };

    const getCustomerNameFromID = id => {
        let customerEntryIndex = rowData.findIndex(entry => entry._id === id);
        return customerEntryIndex > -1 ? rowData[customerEntryIndex].customer_name : 'Missing Name';
    };

    const removeCallbackCustomerNameCellRenderer = props => {
        return getCustomerNameFromID(props.data.customer);
    };

    const getProductsList = () => {
        fetchDropdownField("/inventory", setProductsList, setSnackState, false);
    };

    const getVat = () => {
        fetchDropdownField("/vat", setVatData, setSnackState, false);
    };

    const getSalesRepData = () => {
        fetchDropdownField("/customerSalesRep", setSalesRepData, setSnackState, false);
    };

    const getCustomerCancelledInvoicesDay = () => {
        const onSuccess = response => {
            let customersList = {};
            response.data.forEach(item => customersList[item.customer] = item);
            setCancelledInvoiceDayCustomers(customersList);
            setSendingData(false);
        }
        const onFail = error => {
            console.error(error);
            setSendingData(false);
            displaySnackState(`Failed to retrieve customer cancelled invoices day data - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
        }
        setSendingData(true);
        fetchEntries(`/customerCancelledInvoicesDay/${selectedDate}`, onSuccess, onFail)
    };

    const getTemporaryOrderingCustomers = () => {
        const onSuccess = response => {
            let customersList = {};
            response.data.forEach(item => customersList[item.customer] = item);
            setTemporaryOrderingCustomers(customersList);
            setSendingData(false);
        }
        const onFail = error => {
            console.error(error);
            setSendingData(false);
            displaySnackState(`Failed to retrieve customers temporary order taking data - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
        }
        setSendingData(true);
        fetchEntries(`/customerTemporaryOrdersDay/${selectedDate}`, onSuccess, onFail)
    };

    const getCustomerCallbackTimers = () => {
        fetchAllEntriesAndSetRowData("/customerCallbackTimers", null, setSendingData, setCustomersToCallback, setSnackState);
        const onSuccess = response => {
            setCustomersToCallback(response.data.filter(item => item.user === user.name));
            setSendingData(false);
        }
        const onFail = error => {
            console.error(error);
            setSendingData(false);
            displaySnackState(`Failed to retrieve customer callback timers data - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
        }
        setSendingData(true);
        fetchEntries('/customerCallbackTimers', onSuccess, onFail)
    };

    const fetchAllItems = () => {
        fetchAllEntriesAndSetRowData(API_NAME, null, setSendingData, setRowData, setSnackState);
        getProductsList();
        getVat();
        getSalesRepData();
        getInvoicesList();
        getCustomerCancelledInvoicesDay();
        getTemporaryOrderingCustomers();
        getCustomerCallbackTimers();
    };

    const invoiceEditCB = (customer, invoiceData, canEdit) => {
        setDialogState({open: true, mode: "EDIT", canEdit: canEdit, invoiceData: invoiceData, selectedCustomer: customer, selectedOTDate: selectedDate});
    };

    const getInvoicesActionCell = props => {
        const customerID = props.value
        const customerInvoices = invoicesList.filter(invoice => invoice.customer === customerID);
        if(customerInvoices.length > 0) {
            return <ListInvoicesModal customer={props.data} invoices={customerInvoices} editInvoice={invoiceEditCB} reloadInvoicesTrigger={postSubmitCallback} />;
        } else {
            return "";
        }
    };

    useEffect(() => {
        fetchAllItems();
    }, []);

    useEffect(() => {
        getInvoicesList();
        getCustomerCancelledInvoicesDay();
        getTemporaryOrderingCustomers();
    }, [selectedDate]);

    useEffect(() => {
        if(callbackInterval) {
            clearInterval(callbackInterval);
        }
        if(customersToCallback.length > 0) {
            setCallbackInterval(setInterval(callbackIntervalFunction, 60000));
        }
    }, [customersToCallback]);

    const colDefs = [
        {
            field: "_id",
            headerName: "",
            floatingFilter: false,
            filter: false,
            cellRenderer: invoiceButtonRenderer
        },
        {
            field: "customer_name",
            headerName: "Customer",
            floatingFilter: true,
            filter: true,
            cellRenderer: OrderTakingCustomerNameCellRenderer,
            cellRendererParams: {
                invoicesList: invoicesList,
                cancelledInvoiceDayCustomers: cancelledInvoiceDayCustomers
            }
        },
        {
            field: "mobile",
            headerName: "Mobile",
            floatingFilter: false,
            filter: false,
        },
        {
            field: "phone",
            headerName: "Phone",
            floatingFilter: false,
            filter: false,
        },
        {
            field: "contact_name",
            headerName: "Contact Person",
            floatingFilter: false,
            filter: false,
        },
        {
            field: "tele_sales_rep",
            headerName: "Tele Sales Rep",
            floatingFilter: true,
            filter: true,
            valueGetter: props => LinkedFieldCellValueGetterRenderer({
                ...props,
                idMapping: salesRepData.map,
                mappedFieldName: "name",
                mappingDataLoaded: salesRepData.loaded
            })
        },
        {
            field: "_id",
            headerName: "Invoices",
            floatingFilter: false,
            filter: false,
            minWidth: 226,
            cellRenderer: getInvoicesActionCell
        },
        {
            field: "comments",
            headerName: "Comments",
            floatingFilter: false,
            filter: false,
        }
    ];

    const getTodaysPriceChangeItems = () => {
        let updatedItems = [];
        const todaysDate = moment().format(momentFormat);
        Object.keys(productsList.map).map(key => {
            if(productsList.map[key].prices_last_updated && moment(productsList.map[key].prices_last_updated).format(momentFormat) === todaysDate) {
                updatedItems.push(productsList.map[key]);
            }
        });
        return updatedItems;
    };

    const priceChangeColDefs = [
        {
            field: "name",
            headerName: "Name",
            floatingFilter: true,
            filter: true,
        },
        {
            field: "default_sale_price",
            headerName: "Sale Price",
            floatingFilter: false,
            filter: false,
        },
        {
            field: "min_sale_price",
            headerName: "Min Sale Price",
            floatingFilter: false,
            filter: false,
        }
    ];

    const customerCallbackColDefs = [
        {
            field: "",
            headerName: "",
            floatingFilter: false,
            filter: false,
            cellRenderer: removeCallbackCustomerCellRenderer
        },
        {
            field: "customer_name",
            headerName: "Customer",
            valueGetter: removeCallbackCustomerNameCellRenderer,
            floatingFilter: true,
            filter: true,
        },
        {
            field: "time",
            headerName: "Time",
            floatingFilter: false,
            filter: false,
            valueFormatter: params => moment(params.value).format("HH:mm")
        },
        {
            field: "comment",
            headerName: "Comment",
            floatingFilter: false,
            filter: false,
        }
    ];

    const isTemporaryCustomerForToday = customer => {
        const selectedDateMoment = moment(selectedDate);
        return customer._id in temporaryOrderingCustomers && moment(temporaryOrderingCustomers[customer._id].ot_date).day() === selectedDateMoment.day();
    };

    const getCustomersForDate = () => {
        let todaysCustomerList = rowData.filter(customer => customer.order_taking_days.includes(moment(selectedDate).day()) || isTemporaryCustomerForToday(customer)).map(customer => {return {...customer, rowHeight: 100}});
        todaysCustomerList.sort((a, b) => {
            if(a.active && b.active) {
                return 0;
            }
            if(a.active) {
                return -1;
            } else if(b.active) {
                return 1;
            }
        });
        return todaysCustomerList;
    };

    const topContainerStyle = {
        display: "inline-flex",
        height: "30%",
        width: "100%"
    };

    return <div style={{height: "90%"}}>
        <CustomisedSnackBar {...snackState} setClosed={setSnackState} />
        <Dialog open={dialogState.open} onClose={handleCloseDialog} fullScreen >
            <DialogClosingTitleBar title={`${dialogState.mode} INVOICE`} handleClose={handleCloseDialog} />
            {dialogState.open && <InvoiceForm dialogDetails={dialogState} customersList={{map: getIDMappingForElement(rowData)}} productsList={productsList} vatData={vatData} postSubmitCallback={postSubmitCallback} collection_invoice={false} />}
        </Dialog>
        <Dialog open={callbackDialogState.open} onClose={handleCloseCallbackDialog} >
            <DialogClosingTitleBar title={"Set time to call customer back"} handleClose={handleCloseCallbackDialog} />
            {callbackDialogState.open && <CustomerCallbackTimePicker customer={callbackDialogState.selectedCustomer} saveFunction={callbackDialogState.saveFunction} />}
        </Dialog>
        <Dialog open={customerTemporaryOTDialogState.open} onClose={handleCloseCustomerTemporaryOTDialog} >
            <DialogClosingTitleBar title={"Choose customer to add to today's OT sheet"} handleClose={handleCloseCustomerTemporaryOTDialog} />
            {customerTemporaryOTDialogState.open && <CustomerTemporaryOTPicker customers={customerTemporaryOTDialogState.customers} add={customerTemporaryOTDialogState.add} />}
        </Dialog>
        <PaymentsForm open={paymentsModalData.open} handleClose={handleClosePaymentsForm} data={paymentsModalData.data} postSubmitCallback={postSubmitCallback} />
        <div style={topContainerStyle}>
            <div style={{width: "40%"}}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                        label="Date"
                        value={selectedDate}
                        onChange={onDateChange}
                        inputFormat="dd/MM/yyyy"
                        renderInput={(params) => <TextField {...params} />}
                    />
                </LocalizationProvider>
                <Button variant="contained" onClick={fetchAllItems}>Reload</Button>
            </div>
            <div style={{width: "60%"}}>
                <div style={{height: "100%", width: "70%", float: "right"}}>
                    Customer callback list
                    <DataViewGrid
                        rowData={customersToCallback}
                        columnDefs={customerCallbackColDefs}
                        loading={sendingData || !productsList.loaded || !vatData.loaded}
                    />
                </div>
            </div>
            <div style={{width: "60%"}}>
                <div style={{height: "100%", width: "70%", float: "right"}}>
                    Today's price changes({moment().format("DD-MM-YYYY")})
                    <DataViewGrid
                        rowData={getTodaysPriceChangeItems()}
                        columnDefs={priceChangeColDefs}
                        loading={sendingData || !productsList.loaded || !vatData.loaded}
                    />
                </div>
            </div>
        </div>
        <div style={{height: "70%", marginTop: "2em"}}>
            <DataViewGrid
                rowData={getCustomersForDate()}
                columnDefs={colDefs}
                loading={sendingData || !productsList.loaded || !vatData.loaded}
                agGridProps={gridProps}
            />
        </div>
        { currentUserHasPermissions(requiredCancelOrderingPermissions) &&
        <Button variant="contained" onClick={handleAddTemporaryCustomer}>Add temporary customer</Button>
        }
    </div>
};