import React, {useEffect, useState} from "react";
import axiosDefault from "../axiosDefault/axiosDefault";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import {LoadingButton} from "../loadingButton/LoadingButton";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import {Backdrop, Button, CircularProgress, Grid, TextField} from '@mui/material';
import {
    defaultInvoiceItemEntry,
    defaultSnackState, fetchEntries,
    getGridFormInputFields, momentFormat
} from "../formFunctions/FormFunctions";
import {
    getInputFields,
    handleCheckboxChange,
    handleInputChange
} from "../formFunctions/FormFunctions";
import displaySnackState from "../customisedSnackBar/DisplaySnackState";
import CustomisedSnackBar from "../customisedSnackBar/CustomisedSnackBar";
import {ItemDropdownChooser} from "./ItemDropdownChooser";
import { v4 as uuidv4 } from 'uuid';
import Autocomplete from "@mui/material/Autocomplete";
import moment from "moment";
import ItemHistoryDisplay from "./ItemHistoryDisplay";
import UnpaidInvoicesDisplay from "./UnpaidInvoicesDisplay";
import {useAuth0} from "@auth0/auth0-react";
import AuditModal from "../AuditModal/AuditModal";

const getDefaultInvoiceDate = (currentDate, selectedCustomer, isInPersonInvoice) => {
    if(isInPersonInvoice) {
        return currentDate;
    }

    const currentDayOfWeek = moment(currentDate).day();
    let numberOfDaysToAdd = 0;

    //look forward for next available day
    let nextAvailableDay = 0;
    let counter = currentDayOfWeek+1;
    let found = false;
    while(counter < 7 && !found) {
        if(selectedCustomer.zones[counter]) {
            found = true;
            nextAvailableDay = counter;
            numberOfDaysToAdd = nextAvailableDay - currentDayOfWeek;
        }
        counter++;
    }

    //if not found, look back for a valid previous day value, then set daysToAdd to overlap into next week
    if(!found) {
        let counter = 0;
        while(counter < currentDayOfWeek && !found) {
            if(selectedCustomer.zones[counter]) {
                found = true;
                nextAvailableDay = counter;
                numberOfDaysToAdd = 7 - (currentDayOfWeek - nextAvailableDay);
            }
            counter++;
        }
    }
    const customerDefaultInvoiceDate = moment(currentDate);
    customerDefaultInvoiceDate.add(numberOfDaysToAdd, "days");
    return customerDefaultInvoiceDate.format(momentFormat);
};

const attachUUIDToItems = items => {
    return items.map(item => ({...item, key: uuidv4()}))
};

const InvoiceForm = props => {
    const {user} = useAuth0();
    const [auditModalOpen, setAuditModalOpen] = useState(false);
    const isEditMode = props.dialogDetails.mode === "EDIT";
    const isInPersonMode = props.collection_invoice;
    const {canEdit} = props.dialogDetails;
    const axios = axiosDefault();
    const customersArray = [];
    Object.keys(props.customersList.map).forEach(customer_id => {
        (props.customersList.map[customer_id].active && !props.customersList.map[customer_id].on_hold) &&
        customersArray.push(props.customersList.map[customer_id]);
    });
    const [selectedCustomer, setSelectedCustomer] = useState(props.dialogDetails.selectedCustomer);
    const defaultInvoiceFields = {
        invoice_date: moment().format(momentFormat),
        customer: selectedCustomer,
        ot_date: isEditMode ? props.dialogDetails.invoiceData.ot_date : props.dialogDetails.selectedOTDate,
        cash_invoice: isEditMode ? props.dialogDetails.invoiceData.cash_invoice : selectedCustomer.cash_invoice,
        in_person: isInPersonMode,
        remarks: "",
        driverNotes: "",
        items: [
            {...defaultInvoiceItemEntry()},
            {...defaultInvoiceItemEntry()},
            {...defaultInvoiceItemEntry()},
            {...defaultInvoiceItemEntry()},
            {...defaultInvoiceItemEntry()},
            {...defaultInvoiceItemEntry()},
        ]
    };
    const [sendingData, setSendingData] = useState(true);
    const [formValues, setFormValues] = useState(isEditMode ?
        {
            ...props.dialogDetails.invoiceData,
            invoice_date: props.dialogDetails.invoiceData.invoice_date,
            items: attachUUIDToItems(props.dialogDetails.invoiceData.items)
        }
        :
        {
            ...defaultInvoiceFields,
            created_by: user.name,
            customer: selectedCustomer._id,
            customer_sales_rep: selectedCustomer?.sales_rep,
            invoice_date: getDefaultInvoiceDate(defaultInvoiceFields.ot_date, selectedCustomer, isInPersonMode)
        }
        );
    const productsList = props.productsList;
    const vatData = props.vatData;
    const [snackState, setSnackState] = useState(defaultSnackState);
    const [totalsData, setTotalsData] = useState({
        total_no_vat: 0,
        vat_total: 0,
        total_incl_vat: 0
    });
    const [customerItems, setCustomerItems] = useState(null);
    const [itemHistoryConfig, setItemHistoryConfig] = useState({visible: false});
    const [itemsAudit, setItemsAudit] = useState({});
    const [unpaidInvoicesForCustomer, setUnpaidInvoicesForCustomer] = useState([]);

    const getRecalculatedOrderTotals = () => {
        let [newTotalNoVat, newVatTotal, newTotalInclVat] = [0, 0, 0];
        formValues.items.forEach(item => {
            if(item._id === null)
                return;
            const vat_id = item.vat;
            const vat_rate = vatData.map[vat_id].rate;
            newTotalNoVat += (Number(item.quantity) * Number(item.rate));
            newVatTotal += (Number(item.quantity) * Number(item.rate)) * (vat_rate/100);
            newTotalInclVat += (Number(item.quantity) * Number(item.rate)) * (1 + vat_rate/100);
        });
        setTotalsData({total_no_vat: Number(newTotalNoVat.toFixed(2)), vat_total: Number(newVatTotal.toFixed(2)), total_incl_vat: Number(newTotalInclVat.toFixed(2))});
    };

    const handleDateChange = (newDate, fieldName) => {
        setFormValues({
            ...formValues,
            [fieldName]: moment(newDate).format(momentFormat),
        });
    };

    const checkboxChangeListener = (event) => {
        handleCheckboxChange(event, formValues, setFormValues);
    };

    const setItems = items => {
        setFormValues({
            ...formValues,
            items: [...items]
        });
    };

    const handleEditSubmit = (event) => {
        event.preventDefault();
        const filteredItems = formValues.items.filter(item => item._id !== null && item.quantity > 0);
        if (filteredItems.length > 0 && isSelectedDeliveryDateValid()) {
            setSendingData(true);
            axios.put(`${process.env.REACT_APP_URL_ROOT}/api/invoice/${props.dialogDetails.invoiceData._id}`, {
                ...formValues, items: filteredItems
            })
                .then(response => {
                    props.postSubmitCallback();
                })
                .catch(error => {
                    console.error(error);
                    displaySnackState(`Failed to modify - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
                })
                .finally(() => {
                    setSendingData(false);
                })
        } else {
            displaySnackState("Please ensure at least 1 item is picked and a valid date is chosen", "warning", setSnackState);
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const filteredItems = formValues.items.filter(item => item._id !== null && item.quantity > 0);
        if (filteredItems.length > 0 && isSelectedDeliveryDateValid()) {
            setSendingData(true);
            axios.post(`${process.env.REACT_APP_URL_ROOT}/api/invoice/`, {
                ...formValues, items: filteredItems
            })
                .then(response => {
                    displaySnackState("Successfully added", "success", setSnackState);
                    props.postSubmitCallback();
                })
                .catch(error => {
                    console.error(error);
                    displaySnackState(`Failed to add - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
                })
                .finally(() => {
                    setSendingData(false);
                })
        } else {
            displaySnackState("Please ensure at least 1 item is picked and a valid date is chosen", "warning", setSnackState);
        }
    };

    const isSelectedCustomerZonesAllNull = zonesList => {
        return zonesList.filter(zone => zone !== null).length === 0;
    }

    const isSelectedDeliveryDateValid = () => {
        return isInPersonMode ? true : isSelectedCustomerZonesAllNull(selectedCustomer.zones)? true : selectedCustomer.zones[moment(formValues.invoice_date).day()];
    };

    const datePickerDisableDay = date => {
        if(selectedCustomer) {
            if(!isSelectedCustomerZonesAllNull(selectedCustomer.zones)) {
                return !selectedCustomer.zones[date.getDay()];
            }
            return false;
        }
        return true;
    };

    const handleAddMore = () => {
        const newItemsList = [...formValues.items, defaultInvoiceItemEntry()];
        setItems(newItemsList)
    };

    const printAudit = () => {
        setAuditModalOpen(true);
    };

    const handleCustomerChange = (event, newCustomer) => {
        setSelectedCustomer(newCustomer);
    };

    const inputChangeListener = event => {
        handleInputChange(event, formValues, setFormValues)
    };

    const getCustomerItems = setInitialItemsList => {
        const onSuccess = response => {
            if(response.data && setInitialItemsList && response.data.items.length > 0) {
                let newItemsList = [];
                response.data.items.forEach(customerItem => {
                    const fullItemDetails = productsList.map[customerItem._id]
                    newItemsList.push({
                        ...fullItemDetails,
                        rate: isInPersonMode ? fullItemDetails.collection_price : customerItem.rate,
                        quantity: 0,
                        tax: props.vatData.map[fullItemDetails.vat].rate,
                        key: uuidv4()
                    })
                });
                setItems(newItemsList);
            }
            setCustomerItems(response.data);
            setSendingData(false);
        };
        const onFail = error => {
            console.error(error);
            setSendingData(false);
            displaySnackState(`Failed to fetch customer items data - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
        }
        fetchEntries(`/customerItems/${selectedCustomer._id}`, onSuccess, onFail);
    };

    const showItemHistory = (item) => {
        setItemHistoryConfig({
            visible: true,
            item: item
        });
    };

    const closeItemHistory = () => {
        setItemHistoryConfig({visible: false});
    };

    const countNumberOfItemsOnOrder = () => {
        let total = 0;
        formValues.items.forEach(item => {
            if(item.quantity > 0) {
                total++;
            }
        });
        return total;
    };

    const countQuantityOfItemsOnOrder = () => {
        let total = 0;
        formValues.items.forEach(item => {
            total += item.quantity;
        });
        return total;
    };

    const invoiceData = [
        {
            field: "invoice_date",
            label: "Invoice Date",
            type: "datepicker",
            defaultValue: formValues.invoice_date,
            changeListener: newDate => handleDateChange(newDate, "invoice_date"),
            datePickerProps: {
                shouldDisableDate: datePickerDisableDay,
                disabled: selectedCustomer === null || !canEdit || isInPersonMode
            }
        },
        {
            field: "ot_date",
            label: "OT Date",
            type: "datepicker",
            defaultValue: formValues.ot_date,
            datePickerProps: {
                disabled: true
            }
        },
        {
            field: "cash_invoice",
            label: "Cash Invoice",
            type: "checkbox",
            checkboxProps: {
                disabled: !canEdit,
            },
            defaultState: formValues.cash_invoice,
            changeListener: checkboxChangeListener
        }
    ];

    const alertCustomerComments = () => {
        if(selectedCustomer.comments && selectedCustomer.comments.length > 0) {
            alert(`${selectedCustomer.customer_name} NOTES:\n${selectedCustomer.comments}`);
        }
    };

    const getUnpaidInvoices = customerID => {
        const onSuccess = response => {
            setUnpaidInvoicesForCustomer(response.data);
            setSendingData(false);
        };
        const onFail = error => {
            console.error(error);
            setSendingData(false);
            displaySnackState(`Failed to fetch unpaid invoices list - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
        }
        fetchEntries(`/invoice/getUnpaidInvoices/${customerID}`, onSuccess, onFail);
    };

    useEffect(() => {
        getRecalculatedOrderTotals();
    }, [formValues.items, productsList, vatData]);

    useEffect(() => {
        setFormValues({
            ...formValues,
            customer: selectedCustomer._id,
            invoice_date: props.dialogDetails.selectedCustomer === selectedCustomer ? formValues.invoice_date : getDefaultInvoiceDate(defaultInvoiceFields.ot_date, selectedCustomer, isInPersonMode)
        });
        getCustomerItems(false);
        getUnpaidInvoices(selectedCustomer._id);
        alertCustomerComments();
    }, [selectedCustomer]);

    useEffect(() => {
        if(!isEditMode) {
            getCustomerItems(true);
        } else {
            setSendingData(false);
        }
    }, []);

    const staticCustomerFields = [
        <TextField
            name="created_by"
            label="Invoice Created By"
            value={formValues.created_by}
            variant="outlined"
            size={"small"}
            autoComplete="off"
            fullWidth
            disabled
            InputLabelProps={{ shrink: true }}
        />,
        <Autocomplete
            name="Customer"
            options={customersArray}
            onChange={(event, newCustomer) => handleCustomerChange(event, newCustomer)}
            autoComplete={false}
            value={selectedCustomer}
            disableClearable
            disabled={!canEdit}
            renderInput={(params) => (
                <TextField
                    {...params}
                    variant="standard"
                    label={"Customer"}
                />
            )}
            getOptionLabel={option => option.customer_name}
        />,
        <TextField
            name="contact_name"
            label="Contact Name"
            value={selectedCustomer?.contact_name}
            variant="outlined"
            size={"small"}
            autoComplete="off"
            fullWidth
            disabled
            InputLabelProps={{ shrink: true }}
        />,
        <TextField
            name="mobile"
            label="Contact Mobile"
            value={selectedCustomer?.mobile}
            variant="outlined"
            size={"small"}
            autoComplete="off"
            fullWidth
            disabled
            InputLabelProps={{ shrink: true }}
        />,
        <TextField
            name="address"
            label="Address"
            value={selectedCustomer?.address}
            variant="outlined"
            size={"small"}
            autoComplete="off"
            fullWidth
            disabled
            InputLabelProps={{ shrink: true }}
        />,
        <TextField
            name="city"
            label="City"
            value={selectedCustomer?.city}
            variant="outlined"
            size={"small"}
            autoComplete="off"
            fullWidth
            disabled
            InputLabelProps={{ shrink: true }}
        />,
        <TextField
            name="postcode"
            label="Postcode"
            value={selectedCustomer?.postcode}
            variant="outlined"
            size={"small"}
            autoComplete="off"
            fullWidth
            disabled
            InputLabelProps={{ shrink: true }}
        />,
        ...selectedCustomer?.comments ? [
            <TextField
                label={"Customer Comments"}
                name={"comments"}
                value={selectedCustomer.comments}
                variant="outlined"
                autoComplete="off"
                fullWidth
                multiline
                rows={3}
                type={"text"}
                disabled
            />
        ] : []
    ];

    const customerSegmentHeight = itemHistoryConfig.visible ? "30%" : "20%";
    const customerSegmentWidth = itemHistoryConfig.visible ? "55%" : "70%"
    const itemChooserSegmentHeight = itemHistoryConfig.visible ? "60%" : "70%";

    return (
        <div style={{width: "100%", height: "100%", minHeight: "100%", maxHeight: "100%"}}>
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={sendingData}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
            <CustomisedSnackBar {...snackState} setClosed={setSnackState} />
            {auditModalOpen && <AuditModal auditItems={itemsAudit} handleClose={() => setAuditModalOpen(false)}/>}
            <div style={{height: customerSegmentHeight, minHeight: customerSegmentHeight, maxHeight: customerSegmentHeight, display: "flex"}}>
                <Card style={{height: "100%", overflowY: "auto", width: customerSegmentWidth}}>
                    <CardContent>
                        {getGridFormInputFields([...getInputFields(invoiceData, formValues), ...staticCustomerFields])}
                    </CardContent>
                </Card>
                {
                    itemHistoryConfig.visible ?
                    <div style={{height: "100%", overflowY: "auto", width: "45%"}}>
                        <ItemHistoryDisplay
                            customer={selectedCustomer}
                            item={itemHistoryConfig.item}
                            productsList={productsList}
                            setSnackState={setSnackState}
                            closeItemHistory={closeItemHistory}
                        />
                    </div>
                        :
                        <div style={{height: "100%", overflowY: "auto", width: "30%"}}>
                            <UnpaidInvoicesDisplay invoices={unpaidInvoicesForCustomer} loading={sendingData} />
                        </div>
                }
            </div>
            <div style={{height: itemChooserSegmentHeight, minHeight: itemChooserSegmentHeight, maxHeight: itemChooserSegmentHeight, marginRight: "5%", marginLeft: "5%"}}>
                <ItemDropdownChooser
                    productsList={productsList}
                    vatData={vatData}
                    itemsList={formValues.items}
                    setItems={setItems}
                    currentCustomer={selectedCustomer}
                    customerItems={customerItems}
                    updateCustomerItems={getCustomerItems}
                    setSendingData={setSendingData}
                    showItemHistory={showItemHistory}
                    canEdit={canEdit}
                    itemsAudit={itemsAudit}
                    setItemsAudit={setItemsAudit}
                    collection_invoice={isInPersonMode}
                />
            </div>
            <div style={{display: "inline-flex"}}>
                <Button variant="contained" onClick={handleAddMore} disabled={!canEdit}>ADD MORE</Button>
                <Button variant="contained" onClick={printAudit} disabled={!canEdit}>AUDIT</Button>
                <div style={{marginLeft: "5px"}}>
                    <TextField
                        name="total_items_ordered"
                        label="Total # Items"
                        value={countNumberOfItemsOnOrder()}
                        variant="outlined"
                        disabled
                    />
                    <TextField
                        name="total_items_quantity"
                        label="Total quantity"
                        value={countQuantityOfItemsOnOrder()}
                        variant="outlined"
                        disabled
                    />
                </div>
            </div>
            <div style={{width: "100%", display: "inline-flex", marginTop: "1em"}}>
                <div style={{width: "25%"}}>
                    <TextField
                        label={"Remarks"}
                        name={"remarks"}
                        value={formValues.remarks}
                        variant="outlined"
                        autoComplete="off"
                        size={"small"}
                        multiline
                        rows={3}
                        onChange={event => handleInputChange(event, formValues, setFormValues)}
                        fullWidth
                    />
                </div>
                <div style={{width: "25%"}}>
                    <TextField
                        label={"Driver Notes"}
                        name={"driverNotes"}
                        value={formValues.driverNotes}
                        variant="outlined"
                        autoComplete="off"
                        size={"small"}
                        multiline
                        rows={3}
                        onChange={event => handleInputChange(event, formValues, setFormValues)}
                        fullWidth
                    />
                </div>
                <div style={{width: "50%", display: "flex", justifyContent: "end"}}>
                    <Grid container spacing={1}>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                name="total_no_vat"
                                label="Total(excl vat)"
                                value={`£${totalsData.total_no_vat.toFixed(2)}`}
                                variant="outlined"
                                disabled
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                name="vat_total"
                                label="Vat Total"
                                value={`£${totalsData.vat_total.toFixed(2)}`}
                                variant="outlined"
                                disabled
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                name="total_incl_vat"
                                label="Total(incl vat)"
                                value={`£${totalsData.total_incl_vat.toFixed(2)}`}
                                variant="outlined"
                                disabled
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <form style={{width: "100%", height: "100%"}} onSubmit={isEditMode ? handleEditSubmit : handleSubmit}>
                                <LoadingButton loading={sendingData}
                                               icon={isEditMode ? <EditIcon/> : <AddIcon/>}
                                               buttonLabel={`${props.dialogDetails.mode} INVOICE`}
                                               disabled={sendingData || !canEdit}/>
                            </form>
                        </Grid>
                    </Grid>
                </div>
            </div>
        </div>
    );
};

export default InvoiceForm;