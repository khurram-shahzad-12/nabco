import React, {useEffect, useState} from "react";
import axiosDefault from "../../components/axiosDefault/axiosDefault";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import {Button, Dialog, TextField} from '@mui/material';
import {invoiceActionCellRenderer} from "../../components/cellRenderers/InvoicesActionCellRenderer";
import InvoiceForm from "../../components/InvoiceForm/InvoiceForm";
import {
    defaultLoadedFieldData,
    defaultSnackState,
    fetchDropdownField,
    getInvoiceReportsInNewTab,
    momentFormat,
    currentUserHasPermissions,
    stringValueToNumberComparator,
    getTotalItemsWeightInGrams,
    formatWeightToString,
    dateStringComparator, fetchEntries
} from "../../components/formFunctions/FormFunctions";
import DataViewGrid from "../../components/DataViewGrid/DataViewGrid";
import CustomisedSnackBar from "../../components/customisedSnackBar/CustomisedSnackBar";
import displaySnackState from "../../components/customisedSnackBar/DisplaySnackState";
import PaymentsForm from "../../components/PaymentsForm/PaymentsForm";
import {BalanceCellRenderer} from "../../components/cellRenderers/BalanceCellRenderer";
import styles from "./buttonStyles.module.css";
import DialogClosingTitleBar from "../../components/DialogClosingTitleBar/DialogClosingTitleBar";
import DatePicker from "@mui/lab/DatePicker";
import {PriceCellRenderer} from "../../components/cellRenderers/PriceCellRenderer";
import moment from "moment";
import {BalancePaidUnpaidCellRenderer} from "../../components/cellRenderers/BalancePaidUnpaidCellRenderer";
import {WeightCellRenderer} from "../../components/cellRenderers/WeightCellRenderer";
import {InvoiceZoneOrderRenderer} from "../../components/cellRenderers/InvoiceZoneOrderRenderer";

const Invoices = props => {
    const axios = axiosDefault();
    const requiredEditPermissions = [process.env.REACT_APP_EDIT_INVOICES_CLAIM];
    const requiredProfitPermissions = [process.env.REACT_APP_READ_INVOICE_MARGINS_CLAIM];
    const requiredCustomerStatementPermissions = [process.env.REACT_APP_READ_CUSTOMER_STATEMENT_CLAIM];
    const [dialogState, setDialogState] = React.useState({open: false});
    const [sendingData, setSendingData] = useState(false);
    const [selectedInvoices, setSelectedInvoices] = useState([]);
    const [invoicesList, setInvoicesList] = useState([]);
    const [customersList, setCustomersList] = useState(defaultLoadedFieldData);
    const [productsList, setProductsList] = useState(defaultLoadedFieldData);
    const [vatData, setVatData] = useState(defaultLoadedFieldData);
    const [zonesData, setZonesData] = useState(defaultLoadedFieldData);
    const [startDate, setStartDate] = useState(moment(new Date()).format(momentFormat));
    const [endDate, setEndDate] = useState(moment(new Date()).format(momentFormat));
    const [snackState, setSnackState] = useState(defaultSnackState);
    const [paymentsModalData, setPaymentsModalData] = useState({open: false});
    const handleCloseDialog = () => setDialogState({open: false});
    const reduced = props.reduced;
    const inPersonInvoicesOnly = false;

    const handleOpenPaymentsForm = (data) => setPaymentsModalData({open: true, data: data});
    const handleClosePaymentsForm = () => setPaymentsModalData({open: false});

    const invoiceEditCB = (invoiceData, canEdit) => {
        setDialogState({open: true, mode: "EDIT", canEdit: canEdit, invoiceData: invoiceData, selectedCustomer: customersList.map[invoiceData.customer]});
    };

    const postSubmitCallback = () => {
        getInvoicesList();
        setDialogState({open: false});
    };

    const rowSelectionChanged = event => {
        setSelectedInvoices(event.api.getSelectedNodes().map(node => node.data._id));
    };

    const filterChangedHandler = event => {
        if(event.api.getSelectedNodes().length > 0) {
            event.api.deselectAll();
        }
    };

    const handleDateChange = (newDate, dateType) => {
        const momentDate = moment(newDate).format(momentFormat);
        if(dateType === "start") {
            setStartDate(momentDate);
        } else {
            setEndDate(momentDate);
        }
    };

    const getInvoicesList = () => {
        setSendingData(true);
        axios.get(`${process.env.REACT_APP_URL_ROOT}/api/invoice`, {params: {delivery_day_start: startDate, delivery_day_end: endDate, in_person: inPersonInvoicesOnly}})
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

    const getCustomersData = () => {
        fetchDropdownField("/customer", setCustomersList, setSnackState, false);
    };

    const getProductsList = () => {
        fetchDropdownField("/inventory", setProductsList, setSnackState, false);
    };

    const fetchVat = () => {
        fetchDropdownField("/vat", setVatData, setSnackState, false);
    };

    const fetchZones = () => {
        fetchDropdownField("/zone", setZonesData, setSnackState, false);
    };

    const openInvoice = invoiceNo => {
        getInvoiceReportsInNewTab([invoiceNo], "invoice.pdf", setSnackState);
    };

    const emailInvoice = invoiceNo => {
        const emailAPI = `/invoice/emailInvoice/${invoiceNo}`;
        const success = (res) => {
            displaySnackState("Email successfully sent", "success", setSnackState);
        };
        const fail = (error) => {
            console.error(error);
            displaySnackState(`Failed to send email - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
        };
        fetchEntries(emailAPI, success, fail);
    };

    const reprintInvoice = invoiceNo => {
        getInvoiceReportsInNewTab([invoiceNo], "invoiceReprint.pdf", setSnackState);
    };

    const openMultipleReports = (api) => {
        getInvoiceReportsInNewTab(selectedInvoices, api, setSnackState);
    };

    const openMultipleInvoiceReprintReports = (api) => {
        getInvoiceReportsInNewTab(selectedInvoices, api, setSnackState);
    };

    const fetchAllItems = () => {
        getCustomersData();
        getInvoicesList();
        getProductsList();
        fetchVat();
        fetchZones();
    };

    useEffect(() => {
        fetchAllItems();
    }, []);

    // useEffect(() => {
    //     console.log(localGridApi);
    //     if(localGridApi) {
    //         localGridApi.columnApi.applyColumnState({
    //             state: [
    //                 { colId: 'Section(Zone)', sort: 'desc', sortIndex: 0 },
    //                 { colId: 'Invoice Date', sort: 'desc', sortIndex: 1 },
    //             ],
    //             defaultState: { sort: null },
    //         });
    //     }
    // }, [localGridApi]);

    useEffect(() => {
        getInvoicesList();
        setSelectedInvoices([]);
    }, [startDate, endDate]);

    const functionButtonsStyle = {
        display: "flex",
        justifyContent: "center"
    };

    const getCustomerNameFromID = props => {
        if(!customersList.loaded) {
            return "Loading...";
        }
        try {
            return customersList.map[props.data.customer].customer_name;
        } catch (err) {
            return `Mapping missing for ${props.data.customer}`;
        }
    };

    const getSelectedInvoicesProfitTotal = () => {
        const selectedInvoiceData = invoicesList.filter(invoice => selectedInvoices.includes(invoice._id));
        let totalProfit = 0;
        selectedInvoiceData.forEach(invoice => totalProfit += invoice.profit);
        return totalProfit.toFixed(2);
    };

    const getSelectedInvoicesTotalAmount = () => {
        const selectedInvoiceData = invoicesList.filter(invoice => selectedInvoices.includes(invoice._id));
        let totalAmount = 0;
        selectedInvoiceData.forEach(invoice => totalAmount += invoice.total_incl_vat);
        return totalAmount;
    };

    const getSelectedInvoicesTotalWeight = () => {
        const selectedInvoiceData = invoicesList.filter(invoice => selectedInvoices.includes(invoice._id));
        let totalWeightInGrams = 0;
        selectedInvoiceData.forEach(invoice => {
            totalWeightInGrams += getTotalItemsWeightInGrams(invoice.items);
        });
        return formatWeightToString(totalWeightInGrams);
    };

    const sameCustomerInvoicesSelected = () => {
        if(selectedInvoices.length > 0) {
            const selectedInvoiceData = invoicesList.filter(invoice => selectedInvoices.includes(invoice._id));
            const selectedCustomer = selectedInvoiceData[0].customer;
            let sameCustomer = true;
            selectedInvoiceData.forEach(invoice => {
                if(invoice.customer !== selectedCustomer) {
                    sameCustomer = false;
                }
            });
            return sameCustomer;
        }
        return false;
    };

    const getZoneFromName = zoneName => {
        for(const id in zonesData.map) {
            if(zonesData.map[id].name === zoneName) {
                return zonesData.map[id];
            }
        }
        return {
            order: 10000
        }
    };

    const sendInvoicePrintedStatus = (invoiceId, printedStatus) => {
        if(!printedStatus && !window.confirm("Are you sure you want to unmark invoice printed")) {
            return;
        }
        const printedStatusAPI = `/invoice/printed/${invoiceId}/${printedStatus}`;
        const success = (res) => {
            getInvoicesList();
        };
        const fail = (error) => {
            console.error(error);
            displaySnackState(`Failed to updated printed status - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
        };
        fetchEntries(printedStatusAPI, success, fail);
    };
    const sendInvoicePickedStatus = (invoiceId, pickedStatus) => {
        if(!pickedStatus && !window.confirm("Are you sure you want to unmark invoice picked")) {
            return;
        }
        const pickedStatusAPI = `/invoice/picked/${invoiceId}/${pickedStatus}`;
        const success = (res) => {
            getInvoicesList();
        };
        const fail = (error) => {
            console.error(error);
            displaySnackState(`Failed to updated picked status - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
        };
        fetchEntries(pickedStatusAPI, success, fail);
    };

    const invoicesColDef = [
        ...reduced ? [] : [{ headerName: "#", width: 10, resizable: false, filter: false, floatingFilter: false, valueGetter: props => props.node.rowIndex + 1 }],
        { headerName: "Inv No", width: 100, resizable: false, field: "sale_number" },
        { headerName: "Customer", field: "customer", valueGetter: getCustomerNameFromID, cellStyle: params => {
                return {color: params.data.printed ? params.data.picked ? 'green' : 'yellow' : 'red'};
            }
        },
        { headerName: "Invoice Date", width: 120, field: "invoice_date", valueGetter: props => moment(props.data.invoice_date).format("DD/MM/YYYY"), comparator: dateStringComparator, filter: false, floatingFilter: false },
        { headerName: "Zone(Order)", width: 135, resizable: false, field: "customer",
            valueGetter: props => InvoiceZoneOrderRenderer({...props, customers: customersList, zones: zonesData}),
            comparator: (valueA, valueB) => {
                if(valueA === valueB)
                    return 0;

                const zoneA = getZoneFromName(valueA.substring(0, valueA.indexOf("(")));
                const zoneB = getZoneFromName(valueB.substring(0, valueB.indexOf("(")));

                if(zoneA.order === zoneB.order) {
                    const parsedZoneAOrder = valueA.substring(valueA.indexOf("(") + 1, valueA.indexOf(")"));
                    const parsedZoneBOrder = valueB.substring(valueB.indexOf("(") + 1, valueB.indexOf(")"));
                    if (parsedZoneAOrder === parsedZoneBOrder) return 0;
                    return (Number(parsedZoneAOrder) < Number(parsedZoneBOrder)) ? -1 : 1;
                }

                return zoneA.order < zoneB.order ? -1 : 1;
            }
        },
        //  { headerName: "Zone(Map)", width: 130, resizable: false, field: "zone",valueGetter:(params)=>{return params.data?.zone||"Not Assigned"}},
        { headerName: "Inv Weight", width: 110, resizable: false, field: "items", type: "rightAligned", valueGetter: WeightCellRenderer, comparator: stringValueToNumberComparator, filter: false, floatingFilter: false },
        { headerName: "Inv Value", width: 110, resizable: false, field: "total_incl_vat", type: "rightAligned", valueGetter: PriceCellRenderer, comparator: stringValueToNumberComparator },
        ...currentUserHasPermissions(requiredProfitPermissions) && !reduced ? [{ headerName: "Profit", field: "profit", type: "rightAligned", valueGetter: PriceCellRenderer, comparator: stringValueToNumberComparator }]: [],
        // { headerName: "Balance(Paid/Total)", field: "total_incl_vat", type: "rightAligned", cellRenderer: BalanceCellRenderer },
        { headerName: "Paid/Unpaid", field: "total_incl_vat", valueGetter: BalancePaidUnpaidCellRenderer,
            width: 130,
            cellStyle: params => {
                let styles;
                switch (params.value) {
                    case "PAID":
                        styles = {color: 'green'};
                        break;
                    case "UNPAID":
                        styles = {color: 'red'};
                        break;
                    case "PART PAID":
                        styles = {color: 'orange'};
                        break;
                }
                return styles;
            },
            comparator: (valueA, valueB) => {
                return valueA < valueB ? 1 : -1;
            }
        },
        { headerName: "Actions", field: "_id",
            filter: false,
            cellRenderer: invoiceActionCellRenderer,
            cellRendererParams:
                {
                    editCB: invoiceEditCB,
                    openPayments: handleOpenPaymentsForm,
                    openInvoice: openInvoice,
                    emailInvoice: emailInvoice,
                    updatePrintedStatus: sendInvoicePrintedStatus,
                    updatePickedStatus: sendInvoicePickedStatus,
                    // openInvoiceReprint: reprintInvoice,
                    requiredEditPermissions: requiredEditPermissions,
                    reduced: reduced
                }
        },
        { headerName: "", checkboxSelection: true, headerCheckboxSelection: true, headerCheckboxSelectionFilteredOnly:true, filter: false, minWidth: 90, maxWidth: 90 }
    ];

    const getSelectedInvoicesCount = () => {
        return selectedInvoices.length > 0 ? `(${selectedInvoices.length})`: ""
    };

    return (
        <div style={{width: "100%", height: "90%"}}>
            <CustomisedSnackBar {...snackState} setClosed={setSnackState} />
            <Card sx={{width: "70%", marginLeft: "15%"}}>
                <CardContent>
                    <div>
                        <Dialog open={dialogState.open} onClose={handleCloseDialog} fullScreen >
                            <DialogClosingTitleBar title={`${dialogState.mode} INVOICE`} handleClose={handleCloseDialog} />
                            {dialogState.open && <InvoiceForm dialogDetails={dialogState} customersList={customersList} productsList={productsList} vatData={vatData} postSubmitCallback={postSubmitCallback} collection_invoice={false} />}
                        </Dialog>
                        <PaymentsForm open={paymentsModalData.open} handleClose={handleClosePaymentsForm} data={paymentsModalData.data} postSubmitCallback={postSubmitCallback} />
                        <span>From</span>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="Start Date"
                                value={startDate}
                                onChange={newDate => handleDateChange(newDate, "start")}
                                inputFormat="dd/MM/yyyy"
                                renderInput={(params) => <TextField {...params} />}
                            />
                        </LocalizationProvider>
                        <span>To</span>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="End Date"
                                value={endDate}
                                onChange={newDate => handleDateChange(newDate, "end")}
                                inputFormat="dd/MM/yyyy"
                                renderInput={(params) => <TextField {...params} />}
                            />
                        </LocalizationProvider>
                        <Button variant="contained" onClick={fetchAllItems}>Reload</Button>
                    </div>
                </CardContent>
            </Card>
            <div style={functionButtonsStyle}>
                <Button variant="contained" disabled={selectedInvoices.length === 0} onClick={() => openMultipleReports("invoice.pdf")}>View Invoice(s){getSelectedInvoicesCount()}</Button>
                {/* <Button variant="contained" disabled={selectedInvoices.length === 0} onClick={() => openMultipleInvoiceReprintReports("invoiceReprint.pdf")}>Reprint Invoice(s){getSelectedInvoicesCount()}</Button> */}
                <Button variant="contained" disabled={selectedInvoices.length === 0} onClick={() => openMultipleReports("invoiceByZone.pdf")}>Invoice(s) by Zone{getSelectedInvoicesCount()}</Button>
                {/* <Button variant="contained" disabled={selectedInvoices.length === 0} onClick={() => openMultipleReports("invoiceByZoneMap.pdf")}>Invoice(s) by Zone(Map){getSelectedInvoicesCount()}</Button> */}
                <Button variant="contained" className={styles.btnPickList} disabled={selectedInvoices.length === 0} onClick={() => openMultipleReports("picklist.pdf")}>Picklist{getSelectedInvoicesCount()}</Button>
                {/* <Button variant="contained" className={styles.btnPickListShortages} disabled={selectedInvoices.length === 0} onClick={() => openMultipleReports("picklistshortages.pdf")}>Picklist-Shortages{getSelectedInvoicesCount()}</Button> */}
                <Button variant="contained" className={styles.btnZoneRun} disabled={selectedInvoices.length === 0} onClick={() => openMultipleReports("zonerun.pdf")}>Zone Run List{getSelectedInvoicesCount()}</Button>
                {/* <Button variant="contained" className={styles.btnZoneRun} disabled={selectedInvoices.length === 0} onClick={() => openMultipleReports("zonerunMap.pdf")}>Zone Run List(Map){getSelectedInvoicesCount()}</Button> */}
                <Button variant="contained" className={styles.btnVanLoadShopwise} disabled={selectedInvoices.length === 0} onClick={() => openMultipleReports("vanloadshopwise.pdf")}>Van Load Shopwise{getSelectedInvoicesCount()}</Button>
                {/* <Button variant="contained" className={styles.btnVanLoadShopwise} disabled={selectedInvoices.length === 0} onClick={() => openMultipleReports("vanloadshopwiseMap.pdf")}>Van Load Shopwise(Map){getSelectedInvoicesCount()}</Button> */}
                {(currentUserHasPermissions(requiredCustomerStatementPermissions) && selectedInvoices.length > 0 && sameCustomerInvoicesSelected()) &&
                <Button variant="contained" className={styles.btnCustomerStatement} disabled={selectedInvoices.length === 0} onClick={() => openMultipleReports("customerstatement.pdf")}>Customer Statement{getSelectedInvoicesCount()}</Button>
                }
                {(currentUserHasPermissions(requiredProfitPermissions) && selectedInvoices.length > 0) && <Button variant="contained" disabled>Total Profit: {getSelectedInvoicesProfitTotal()}</Button>}
            </div>
            <div style={{height: "90%"}}>
                <DataViewGrid rowData={invoicesList}
                              columnDefs={invoicesColDef}
                              loading={
                                  !(
                                      customersList.loaded &&
                                      productsList.loaded &&
                                      vatData.loaded &&
                                      zonesData.loaded
                                  ) || sendingData
                              }
                              postFilterChangedCallback={filterChangedHandler}
                              agGridProps={{
                                  rowSelection: "multiple",
                                  suppressRowClickSelection: true,
                                  checkboxSelection: true,
                                  onSelectionChanged: rowSelectionChanged
                              }} />
            </div>
            {selectedInvoices.length > 0 &&
            <>
                {currentUserHasPermissions(requiredProfitPermissions) &&
                <div style={{float: "right", border: "1px solid"}}>
                    <span>Selected Invoices Total: £{getSelectedInvoicesTotalAmount().toFixed(2)}</span>
                </div>
                }
                <div style={{float: "right", border: "1px solid", marginRight: "1em"}}>
                    <span>Selected Invoices Weight: {getSelectedInvoicesTotalWeight()}</span>
                </div>
            </>
            }
        </div>
    );
};

export default Invoices;