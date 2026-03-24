import React, { useEffect, useState } from 'react';

import displaySnackState from "../../components/customisedSnackBar/DisplaySnackState";
import CustomisedSnackBar from "../../components/customisedSnackBar/CustomisedSnackBar";
import {LoadingButton} from "../../components/loadingButton/LoadingButton";
import {
    defaultSnackState,
    fetchAllEntriesAndSetRowData,
    getColumnDefs,
    getDefaultFormFields,
    getGridFormInputFields,
    getInputFields,
    handleDataEditSubmit,
    handleDataSubmit,
    handleInputChange,
    currentUserHasPermissions,
    fetchDropdownField,
    momentFormat,
    handleNumberInputChange,
    stringValueToNumberComparator,
    dateStringComparator, getAndOpenReportsInNewTab,
    downloadAndOpenExcel
} from "../../components/formFunctions/FormFunctions";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import {Button, Dialog, Box, TextField} from "@mui/material";

import DataViewGrid from "../../components/DataViewGrid/DataViewGrid";
import DialogClosingTitleBar from "../../components/DialogClosingTitleBar/DialogClosingTitleBar";
import cardStyles from "../../components/PopupCardDialogStyles/PopupCardDialogStyles.module.css";
import LinkedFieldCellValueGetterRenderer from "../../components/cellRenderers/LinkedFieldCellValueGetterRenderer";
import moment from "moment";
import {PriceCellRenderer} from "../../components/cellRenderers/PriceCellRenderer";
import MenuItem from "@mui/material/MenuItem";
import {SupplierInvoicesActionCellRenderer} from "../../components/SupplierInvoicesActionCell/SupplierInvoicesActionCellRenderer";
import SupplierPaymentsForm from "../../components/SupplierInvoicePaymentsForm/SupplierInvoicesPaymentsForm";
import {BalancePaidUnpaidCellRenderer} from "../../components/cellRenderers/BalancePaidUnpaidCellRenderer";
import DatePicker from "@mui/lab/DatePicker";
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import axiosDefault from '../../components/axiosDefault/axiosDefault';

const API_NAME = '/supplier-invoices';

export const SupplierInvoices = () => {
    const axios = axiosDefault();
    const [sendingData, setSendingData] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [snackState, setSnackState] = useState(defaultSnackState);
    const [rowData, setRowData] = useState([]);
    const [inventorySuppliers, setInventorySuppliers] = useState([]);
    const [selectedInvoices, setSelectedInvoices] = useState([]);
    const [paymentsModalData, setPaymentsModalData] = useState({open: false});
    const [dialogState, setDialogState] = React.useState({open: false});
    const [startDate, setStartDate] = useState(moment("2024-12-01").format(momentFormat));
    const [endDate, setEndDate] = useState(moment(new Date()).format(momentFormat));
    const [gridApi,setGridApi] = useState(null);
    const requiredWritePermissions = [process.env.REACT_APP_WRITE_INVENTORY_SUPPLIERS_CLAIM];

    const disableEditMode = () => {
        setFormValues(defaultFormState);
        setEditMode(false);
    };

    const rowSelectionChanged = event => {
        setSelectedInvoices(event.api.getSelectedNodes().map(node => node.data._id));
    };

    const getSelectedInvoicesCount = () => {
        return selectedInvoices.length > 0 ? `(${selectedInvoices.length})`: ""
    };

    const inputChangeListener = event => {
        handleInputChange(event, formValues, setFormValues)
    };

    const handleDateChange = (newDate, fieldName) => {
        setFormValues({
            ...formValues,
            [fieldName]: moment(newDate).format(momentFormat),
        });
    };

    const handleDateLimit = (newDate, dateType) => {
        const momentDate = moment(newDate).format(momentFormat);
        if(dateType === "start"){
            setStartDate(momentDate)
        }else{
            setEndDate(momentDate)
        }
    }

    const handleOpenPaymentsForm = (data) => setPaymentsModalData({open: true, data: data});
    const handleClosePaymentsForm = () => setPaymentsModalData({open: false});

    const fetchInventorySuppliers = () => {
        fetchDropdownField("/inventory-supplier", setInventorySuppliers, setSnackState, false);
    };

    const fetchAllSupplierInvoices = () => {
        fetchAllEntriesAndSetRowData(API_NAME, {params: {supplier_day_start: startDate, supplier_day_end: endDate}}, setSendingData, setRowData, setSnackState);
    };

    const handleSubmit = event => {
        handleDataSubmit(API_NAME, event, setSendingData, formValues, setFormValues, defaultFormState, setSnackState, fetchAllSupplierInvoices);
    };

    const handleEditSubmit = event => {
        handleDataEditSubmit(API_NAME, event, setSendingData, setEditMode, formValues, setFormValues, defaultFormState, setSnackState, fetchAllSupplierInvoices);
    };

    const handleOpenDialog = () => {
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setEditMode(false);
        setDialogOpen(false);
        setFormValues(defaultFormState);
    };

    const openSelectedSupplierInvoicesPDF = () => {
        getAndOpenReportsInNewTab(selectedInvoices, 'supplier-invoices', 'supplierInvoices.pdf', setSnackState);
    };

    const openSelectedSupplierInvoicesVAT_PDF = () => {
        getAndOpenReportsInNewTab(selectedInvoices, 'supplier-invoices', 'supplierInvoicesVAT.pdf', setSnackState);
    };

    const openSelectedSupplierInvoicesVAT_XLSX = () => {
        downloadAndOpenExcel(selectedInvoices, 'supplier-invoices', 'supplierInvoicesVAT.xlsx', setSnackState);
    }

    const postPaymentSubmitCallback = () => {
        fetchAllData();
    };

    const fetchAllData = () => {
        fetchAllSupplierInvoices();
        fetchInventorySuppliers();
    };

    useEffect(() => {
        if (editMode) {
            setDialogOpen(true);
        } else {
            setDialogOpen(false);
        }
    }, [editMode]);

    let totalAmount = 0;
    const getSelectedInvoicesTotalAmount = () => {
        const selectedInvoiceData = rowData.filter(invoice => selectedInvoices.includes(invoice._id));
        selectedInvoiceData.forEach((invoice)=>{            
            if(invoice.total > 0){
                totalAmount += Math.abs(invoice.total);
            }else{
                totalAmount -= Math.abs(invoice.total)
            }
        });
        return totalAmount;
    };

    const getSelectedInvoicesRemainingTotal = () => {
        let paidAmount = 0;
        const selectedInvoiceData = rowData.filter(invoice => selectedInvoices.includes(invoice._id));       
        selectedInvoiceData.forEach((invoice)=>{            
            if(invoice.invoice_type === 'Credit Note'){
                invoice.payments.forEach(payment => { paidAmount -= payment.amount });
            }else{
                invoice.payments.forEach(payment => { paidAmount += payment.amount });
            }
        });
        const remainingAmount = totalAmount-paidAmount;
        return remainingAmount
    };

    const SupplierInvoicesBalancePaidUnpaidCellRenderer = (props) => {
        const field = props.colDef.field;

        const totalPaid = props.data?.payments.map(item => item.amount).reduce((a, b) => a + b, 0).toFixed(2);

        return +totalPaid === Math.abs(props.data[field]) ? "PAID" : totalPaid > 0 ? "PART PAID" : "UNPAID";
    };

    const supplierData = [
        {
            field: "supplier",
            label: "Supplier",
            type: "dropdown",
            dropdownOptions: inventorySuppliers,
            defaultState: [],
            changeListener: inputChangeListener,
            textFieldProps: {
                required: true,
                type: "text",
            },
            gridProps: {
                width: 150,
                valueGetter: props => LinkedFieldCellValueGetterRenderer({
                    ...props,
                    idMapping: inventorySuppliers.map,
                    mappedFieldName: "name",
                    mappingDataLoaded: inventorySuppliers.loaded
                })
            }
        },
        {
            field: "invoice_number",
            label: "Invoice Number",
            type: "textfield",
            changeListener: inputChangeListener,
            textFieldProps: {
                required: true,
                type: "text"
            }
        },
        {
            field: "invoice_date",
            label: "Invoice Date",
            type: "datepicker",
            changeListener: newDate => handleDateChange(newDate, "invoice_date"),
            gridProps: {
                valueGetter: props => moment(props.data.invoice_date).format("DD/MM/YYYY"),
                comparator: dateStringComparator
            }
        },
        {
            field: "total",
            label: "Total",
            type: "textfield",
            changeListener: event => handleInputChange(event, formValues, setFormValues),
            textFieldProps: {
                required: true,
                type: "number",
                inputProps: {
                    step: 0.01
                }
            },
            gridProps: {
                width: 150,
                type: "rightAligned",
                valueGetter: PriceCellRenderer,
                comparator: stringValueToNumberComparator
            }
        },
        {
            field: "vat",
            label: "VAT",
            type: "textfield",
            changeListener: event => handleNumberInputChange(event, formValues, setFormValues),
            textFieldProps: {
                type: "number",
                required: true,
                inputProps: {
                    step: 0.01
                }
            },
            gridProps: {
                width: 150,
                type: "rightAligned",
                valueGetter: PriceCellRenderer,
                comparator: stringValueToNumberComparator,
                hide: true
            }
        },
        {
            field: "standard_rate",
            label: "Standard Rate(Automatically calculated)",
            type: "textfield",
            changeListener: event => handleNumberInputChange(event, formValues, setFormValues),
            textFieldProps: {
                type: "number",
                inputProps: {
                    step: 0.01
                },
                disabled: true
            },
            gridProps: {
                width: 150,
                type: "rightAligned",
                valueGetter: PriceCellRenderer,
                comparator: stringValueToNumberComparator,
                hide: true
            }
        },
        {
            field: "zero_rate",
            label: "Zero Rate(Automatically calculated)",
            type: "textfield",
            changeListener: event => handleNumberInputChange(event, formValues, setFormValues),
            textFieldProps: {
                type: "number",
                inputProps: {
                    step: 0.01
                },
                disabled: true
            },
            gridProps: {
                width: 150,
                type: "rightAligned",
                valueGetter: PriceCellRenderer,
                comparator: stringValueToNumberComparator,
                hide: true
            }
        },
        {
            field: "delivery_status",
            label: "Delivery Status",
            type: "dropdown_fixed",
            changeListener: inputChangeListener,
            textFieldProps: {
                required: true
            },
            dropdownOptions: {
                loaded: true,
                menuEntries: [
                    <MenuItem value={"Delivered"} key={"Delivered"}>Delivered</MenuItem>,
                    <MenuItem value={"Not Delivered"} key={"Not Delivered"}>Not Delivered</MenuItem>,
                    <MenuItem value={"Collected"} key={"Collected"}>Collected</MenuItem>
                ]
            }
        },
        {
            field: "invoice_type",
            label: "Invoice Type",
            type: "dropdown_fixed",
            changeListener: inputChangeListener,
            textFieldProps: {
                required: true
            },
            dropdownOptions: {
                loaded: true,
                menuEntries: [
                    <MenuItem value={"Invoiced"} key={"Invoiced"}>Invoiced</MenuItem>,
                    <MenuItem value={"Pro Forma Invoice"} key={"Pro Forma Invoice"}>Pro Forma Invoice</MenuItem>,
                    <MenuItem value={"Delivery Note"} key={"Delivery Note"}>Delivery Note</MenuItem>,
                    <MenuItem value={"Credit Note"} key={"Credit Note"}>Credit Note</MenuItem>,
                ]
            }
        },
        {
            field: "expense_type",
            label: "Expense Type",
            type: "dropdown_fixed",
            changeListener: inputChangeListener,
            textFieldProps: {
                required: true
            },
            dropdownOptions: {
                loaded: true,
                menuEntries: [
                    <MenuItem value={"Inventory"} key={"Inventory"}>Inventory</MenuItem>,
                    <MenuItem value={"Expense"} key={"Expense"}>Expense</MenuItem>,
                ]
            }
        }
    ];

    const rowSelectionColumnDef = {
        headerName: "",
        checkboxSelection: true,
        headerCheckboxSelection: true,
        headerCheckboxSelectionFilteredOnly:true,
        filter: false,
        minWidth: 90,
        maxWidth: 90
    };
    const createdDateColDef = {
        headerName: "Created",
        field: "created",
        valueGetter: props => moment(props.data.created).format("DD/MM/YYYY h:mm:ss a"),
        comparator: dateStringComparator,
        hide: true
    };
    const actionsColDef = setFormValues => {
        return {
            headerName: "Actions",
            field: "_id",
            filter: false,
            floatingFilter: false,
            cellRenderer: SupplierInvoicesActionCellRenderer,
            cellRendererParams:
                {
                    setEditModeCB: setEditMode,
                    setFormValuesCB: setFormValues,
                    apiName: API_NAME,
                    displaySnackState: displaySnackState,
                    setSnackState: setSnackState,
                    setSendingData: setSendingData,
                    deleteCallback: fetchAllSupplierInvoices,
                    disabledDelete: false,
                    requiredWritePermissions: requiredWritePermissions,
                    openPayments: handleOpenPaymentsForm,
                }
        }
    };
    const paidStatusColumn = {
        headerName: "Paid/Unpaid",
        field: "total",
        valueGetter: SupplierInvoicesBalancePaidUnpaidCellRenderer,
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
    };
    const defaultFormState = getDefaultFormFields(supplierData);
    const [formValues, setFormValues] = useState({...defaultFormState});
    const colDefs = [rowSelectionColumnDef, ...getColumnDefs(supplierData), paidStatusColumn, createdDateColDef, actionsColDef(setFormValues)];

    const handleGridApi = (api) => {
        setGridApi(api)
    }
    
     useEffect(()=>{
        fetchAllSupplierInvoices()
     },[startDate,endDate]);
     
     useEffect(()=>{
        fetchAllData();
     },[])

    return <div style={{height: "90%"}}>
        <Card sx={{width: "70%", marginLeft: "15%", marginBottom:"20px"}}>
                <CardContent>
                    <Box sx={{display:"flex", justifyContent:"center", alignItems:"center"}}>
                        <Dialog open={dialogState.open} onClose={handleCloseDialog} fullScreen >
                            <DialogClosingTitleBar title={`${dialogState.mode} INVOICE`} handleClose={handleCloseDialog} />                            
                        </Dialog>                        
                        <span style={{margin:"20px"}}>From</span>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="Start Date"
                                value={startDate}
                                onChange={newDate => handleDateLimit(newDate, "start")}
                                inputFormat="dd/MM/yyyy"
                                renderInput={(params) => <TextField {...params} />}
                            />
                        </LocalizationProvider>
                        <span style={{margin:"20px"}}>To</span>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="End Date"
                                value={endDate}
                                onChange={newDate => handleDateLimit(newDate, "end")}
                                inputFormat="dd/MM/yyyy"
                                renderInput={(params) => <TextField {...params} />}
                            />
                        </LocalizationProvider>
                        <Box sx={{display:"inline-block", mx:"20px"}}>
                        <Button variant="contained" onClick={fetchAllData}>Reload</Button>
                        </Box>
                        
                    </Box>
                </CardContent>
            </Card>
    
        <CustomisedSnackBar {...snackState} setClosed={setSnackState} />
        <Dialog open={dialogOpen} fullScreen>
            <DialogClosingTitleBar title={`${editMode ? "EDIT" : "ADD"} INVOICE`} handleClose={handleCloseDialog}/>
            <div>
                <Card className={cardStyles.popupFormCard}>
                <CardContent>
                    <form onSubmit={editMode ? handleEditSubmit : handleSubmit}>
                        {getGridFormInputFields(getInputFields(supplierData, formValues))}
                        <LoadingButton loading={sendingData} icon={editMode ? <EditIcon /> : <AddIcon />} buttonLabel={`${editMode ? "EDIT" : "ADD"} INVOICE`} disabled={sendingData} />
                        {editMode ? <Button variant="contained" color="error" onClick={disableEditMode} >CANCEL</Button> : ""}
                    </form>
                </CardContent>
            </Card>
        </div>
        </Dialog>
        <SupplierPaymentsForm open={paymentsModalData.open} handleClose={handleClosePaymentsForm} data={paymentsModalData.data} postSubmitCallback={postPaymentSubmitCallback} />
        <Button variant="contained" onClick={handleOpenDialog} style={{marginRight: "1em"}} disabled={!currentUserHasPermissions(requiredWritePermissions)}>Add Supplier Invoice</Button>
        <Button variant="contained" onClick={fetchAllData} style={{marginRight: "1em"}}>Reload</Button>
        <Button variant="contained" disabled={selectedInvoices.length === 0} style={{marginRight: "1em"}} onClick={openSelectedSupplierInvoicesPDF}>Print Invoices{getSelectedInvoicesCount()}</Button>
        <Button variant="contained" disabled={selectedInvoices.length === 0} onClick={openSelectedSupplierInvoicesVAT_PDF}>Print VAT{getSelectedInvoicesCount()}</Button>
        <Button variant="contained" disabled={selectedInvoices.length === 0} onClick={openSelectedSupplierInvoicesVAT_XLSX} style={{marginLeft: "1em"}}>Print VAT(Excel){getSelectedInvoicesCount()}</Button>
        <DataViewGrid
            rowData={rowData}
            columnDefs={colDefs}
            loading={sendingData}
            agGridProps={{
                rowSelection: "multiple",
                suppressRowClickSelection: true,
                checkboxSelection: true,
                onSelectionChanged: rowSelectionChanged,
            }}
            getGridApi = {handleGridApi}
        />
        {selectedInvoices.length > 0 &&
        <>
            <div style={{float: "right", border: "1px solid"}}>
                <span>Selected Invoices Total: £{getSelectedInvoicesTotalAmount().toFixed(2)}</span>
            </div>
            <div style={{float: "right", border: "1px solid", marginRight: "1em"}}>
                <span>Selected Invoices Remaining Balance: £{getSelectedInvoicesRemainingTotal().toFixed(2)}</span>
            </div>
        </>
        }
    </div>
};