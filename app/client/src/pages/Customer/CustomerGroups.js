import React, {useEffect, useState} from 'react';

import displaySnackState from "../../components/customisedSnackBar/DisplaySnackState";
import CustomisedSnackBar from "../../components/customisedSnackBar/CustomisedSnackBar";
import {LoadingButton} from "../../components/loadingButton/LoadingButton";
import {
    defaultLoadedFieldData, defaultSnackState,
    fetchAllEntriesAndSetRowData,
    fetchDropdownField,
    getActionColumnDef, getColumnDefs,
    getDefaultFormFields, getGridFormInputFields,
    getInputFields,
    handleDataEditSubmit,
    handleDataSubmit,
    handleInputChange,
    currentUserHasPermissions,
} from "../../components/formFunctions/FormFunctions";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import {Button, Dialog} from "@mui/material";

import {listChipsCellRenderer} from "../../components/cellRenderers/ListChipsCellRenderer";
import DataViewGrid from "../../components/DataViewGrid/DataViewGrid";
import DialogClosingTitleBar from "../../components/DialogClosingTitleBar/DialogClosingTitleBar";
import cardStyles from "../../components/PopupCardDialogStyles/PopupCardDialogStyles.module.css";
import axiosDefault from "../../components/axiosDefault/axiosDefault";
import {URL_API, URL_ROOT} from "../../configs/config";
import _ from "lodash";

const API_NAME = '/customerGroups';

export const CustomerGroups = () => {
    const [sendingData, setSendingData] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState({open: false});
    const [editMode, setEditMode] = useState(false);
    const [editModeOriginalDataCopy, setEditModeOriginalDataCopy] = useState({});
    const [customerData, setCustomerData] = useState(defaultLoadedFieldData);
    const [snackState, setSnackState] = useState(defaultSnackState);
    const [rowData, setRowData] = useState([]);
    const requiredWritePermissions = [process.env.REACT_APP_WRITE_CUSTOMER_GROUPS];
    const requiredDeletePermissions = [process.env.REACT_APP_WRITE_CUSTOMER_GROUPS];

    const disableEditMode = () => {
        setFormValues(defaultFormState);
        setEditMode(false);
    };

    const inputChangeListener = event => {
        handleInputChange(event, formValues, setFormValues)
    };

    const tagsChangeListener = (event, value) => {
        if(value !== formValues.customers) {
            const newCustomerID = value.filter(id => !formValues.customers.includes(id))[0];
            let foundDuplicate = false;
            let groupDupName = null;
            rowData.forEach(row => {
                if(row.customers.includes(newCustomerID)) {
                    foundDuplicate = true;
                    groupDupName = row.name;
                }
            });
            if(foundDuplicate) {
                alert(`Customer already in group: ${groupDupName}`);
                return;
            }
        }

        event.target = {
            value: value,
            name: "customers"
        }

        handleInputChange(event, formValues, setFormValues);
    }

    const fetchAllItems = () => {
        fetchCustomers();
        fetchAllEntriesAndSetRowData(API_NAME, null, setSendingData, setRowData, setSnackState);
    };

    const fetchCustomers = () => {
        fetchDropdownField("/customer", setCustomerData, setSnackState, true);
    };

    const handleSubmit = event => {
        handleDataSubmit(API_NAME, event, setSendingData, formValues, setFormValues, defaultFormState, setSnackState, fetchAllItems);
    };

    const handleEditSubmit = event => {
        event.preventDefault();
        if(editModeOriginalDataCopy.cost_price !== formValues.cost_price ||
            editModeOriginalDataCopy.min_sale_price !== formValues.min_sale_price ||
            editModeOriginalDataCopy.default_sale_price !== formValues.default_sale_price
        ) {
            setConfirmDialogOpen({
                open: true,
                callbacks: {
                    yes: () => submitEditData(event, true),
                    no: () => submitEditData(event, false),
                    cancel: () => setConfirmDialogOpen({open: false})
                }
            });
        } else {
            submitEditData(event, false);
        }
    };

    const submitEditData = (event, shouldUpdateCustomerPrices) => {
        const postSuccessEditSubmissionDisabledEditModeAndUpdateInvoices = () => {
            setEditMode(false);
            setConfirmDialogOpen({open: false});
            /*const originalItemData = rowData.find(item => item._id === formValues._id);
            if(
                originalItemData.cost_price !== formValues.cost_price ||
                originalItemData.min_sale_price !== formValues.min_sale_price ||
                originalItemData.default_sale_price !== formValues.default_sale_price ||
                originalItemData.vat !== formValues.vat
            ) {
                axiosDefault().post(URL_ROOT + URL_API + "/invoice/updateInvoiceItemPrices", {...formValues, tax: vatData.map[formValues.vat].rate})
                    .catch(error => {
                        console.error(error);
                        displaySnackState(`Failed to update invoices - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
                    })
            }*/
            const originalItemData = rowData.find(item => item._id === formValues._id);
            if(
                originalItemData.weight_grams !== formValues.weight_grams ||
                originalItemData.weight_kg !== formValues.weight_kg
            ) {
                axiosDefault().post(URL_ROOT + URL_API + "/invoice/updateInvoicesAfterWeightChange", formValues)
                    .catch(error => {
                        console.error(error);
                        displaySnackState(`Failed to update invoice weights - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
                    })
            }
        };
        if(shouldUpdateCustomerPrices) {
            let newPayload = _.cloneDeep(formValues);
            newPayload.updateCustomerPrices = shouldUpdateCustomerPrices;
            handleDataEditSubmit(API_NAME, event, setSendingData, postSuccessEditSubmissionDisabledEditModeAndUpdateInvoices,
                newPayload, setFormValues, defaultFormState, setSnackState, fetchAllItems);
        } else {
            handleDataEditSubmit(API_NAME, event, setSendingData, postSuccessEditSubmissionDisabledEditModeAndUpdateInvoices,
                formValues, setFormValues, defaultFormState, setSnackState, fetchAllItems);
        }
    };

    const handleOpenDialog = () => {
        setDialogOpen(true);
    };

    const filterChangedHandler = event => {
        if(event.api.getSelectedNodes().length > 0) {
            event.api.deselectAll();
        }
    };

    const handleCloseDialog = () => {
        setEditMode(false);
        setDialogOpen(false);
        setFormValues(defaultFormState);
    };

    const itemData = [
        {
            field: "name",
            label: "Group Name",
            type: "textfield",
            changeListener: inputChangeListener,
            textFieldProps: {
                required: true,
                type: "text",
                autoFocus: true
            }
        },
        {
            field: "customers",
            label: "Customers",
            type: "chips_dropdown",
            dropdownOptions: customerData,
            dropdownNameField: "customer_name",
            defaultState: [],
            changeListener: tagsChangeListener,
            textFieldProps: {
                required: true,
                type: "text"
            },
            gridProps: {
                cellRenderer: listChipsCellRenderer,
                cellRendererParams: {
                    idMapping: customerData.map,
                    mappingDataLoaded: customerData.loaded,
                    nameField: "customer_name"
                },
                // filter: tagsFilter,
                filterParams: {
                    columnName: "customers",
                    tagsList: customerData
                }
            }
        }
    ];

    useEffect(() => {
        fetchAllItems();
    }, []);

    useEffect(() => {
        if (editMode) {
            setEditModeOriginalDataCopy(_.cloneDeep(formValues));
            setDialogOpen(true);
        } else {
            setEditModeOriginalDataCopy(_.cloneDeep(formValues));
            setDialogOpen(false);
        }
    }, [editMode]);

    const defaultFormState = getDefaultFormFields(itemData);
    const [formValues, setFormValues] = useState({...defaultFormState});
    const colDefs = [getActionColumnDef(setEditMode, setFormValues, API_NAME, displaySnackState, setSnackState, setSendingData, fetchAllItems, !currentUserHasPermissions(requiredDeletePermissions), requiredWritePermissions), ...getColumnDefs(itemData)];

    return <div style={{height: "90%"}}>
        <CustomisedSnackBar {...snackState} setClosed={setSnackState}/>
        <Dialog open={dialogOpen} fullScreen>
            <DialogClosingTitleBar title={`${editMode ? "EDIT" : "ADD"} CUSTOMER GROUP`} handleClose={handleCloseDialog}/>
            <div>
                <Card className={cardStyles.popupFormCard}>
                    <CardContent>
                        <form onSubmit={editMode ? handleEditSubmit : handleSubmit}>
                            {getGridFormInputFields(getInputFields(itemData, formValues))}
                            <br />
                            <br />
                            <LoadingButton loading={sendingData} icon={editMode ? <EditIcon/> : <AddIcon/>}
                                           buttonLabel={`${editMode ? "EDIT" : "ADD"} CUSTOMER GROUP`} disabled={sendingData}/>
                            {editMode ? <Button variant="contained" color="error"
                                                onClick={disableEditMode}>CANCEL</Button> : ""}
                        </form>
                    </CardContent>
                </Card>
            </div>
        </Dialog>
        <Button variant="contained" onClick={handleOpenDialog} style={{marginRight: "1em"}} disabled={!currentUserHasPermissions(requiredWritePermissions)}>Add Customer Group</Button>
        <Button variant="contained" onClick={fetchAllItems} style={{marginRight: "1em"}}>Reload</Button>
        <DataViewGrid
            rowData={rowData}
            columnDefs={colDefs}
            loading={sendingData}
            postFilterChangedCallback={filterChangedHandler}
        />
    </div>
};