import React, { useEffect, useState } from 'react';

import displaySnackState from "../../components/customisedSnackBar/DisplaySnackState";
import CustomisedSnackBar from "../../components/customisedSnackBar/CustomisedSnackBar";
import {LoadingButton} from "../../components/loadingButton/LoadingButton";
import {
    defaultSnackState,
    fetchAllEntriesAndSetRowData,
    getActionColumnDef,
    getColumnDefs,
    getDefaultFormFields,
    getGridFormInputFields,
    getInputFields,
    handleDataEditSubmit,
    handleDataSubmit,
    handleInputChange,
    currentUserHasPermissions,
    handleNumberInputChange,
} from "../../components/formFunctions/FormFunctions";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import {Button, Dialog} from "@mui/material";

import DataViewGrid from "../../components/DataViewGrid/DataViewGrid";
import DialogClosingTitleBar from "../../components/DialogClosingTitleBar/DialogClosingTitleBar";
import cardStyles from "../../components/PopupCardDialogStyles/PopupCardDialogStyles.module.css";

const API_NAME = '/inventory-supplier';

export const InventorySupplier = () => {
    const [sendingData, setSendingData] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [snackState, setSnackState] = useState(defaultSnackState);
    const [rowData, setRowData] = useState([]);
    const requiredWritePermissions = [process.env.REACT_APP_WRITE_INVENTORY_SUPPLIERS_CLAIM];

    const disableEditMode = () => {
        setFormValues(defaultFormState);
        setEditMode(false);
    };

    const inputChangeListener = event => {
        handleInputChange(event, formValues, setFormValues)
    };
    const numberInputChangeListener = (event) => {
        handleNumberInputChange(event, formValues, setFormValues);
    };
        const holdCheckboxChangeListener = (event) => {
        const { checked, name } = event.target;
        setFormValues({
            ...formValues,
            [name]: checked
        });
    };
    const fetchAllInventorySuppliers = () => {
        fetchAllEntriesAndSetRowData(API_NAME, null, setSendingData, setRowData, setSnackState);
    };

    const handleSubmit = event => {
        handleDataSubmit(API_NAME, event, setSendingData, formValues, setFormValues, defaultFormState, setSnackState, fetchAllInventorySuppliers);
    };

    const handleEditSubmit = event => {
        handleDataEditSubmit(API_NAME, event, setSendingData, setEditMode, formValues, setFormValues, defaultFormState, setSnackState, fetchAllInventorySuppliers);
    };

    const handleOpenDialog = () => {
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setEditMode(false);
        setDialogOpen(false);
        setFormValues(defaultFormState);
    };

    useEffect(() => {
        fetchAllInventorySuppliers();
    }, []);

    useEffect(() => {
        if (editMode) {
            setDialogOpen(true);
        } else {
            setDialogOpen(false);
        }
    }, [editMode]);

    const supplierData = [
        {
            field: "account",
            label: "Account ID",
            type: "textfield",
            changeListener: inputChangeListener,
            textFieldProps: {
                required: true,
                autoFocus: true
            }
        },
        {
            field: "name",
            label: "Supplier",
            type: "textfield",
            changeListener: inputChangeListener,
            textFieldProps: {
                required: true,
                type: "text",
                autoFocus: true
            }
        },
        {
            field: "address",
            label: "Address",
            type: "textfield",
            changeListener: inputChangeListener,
            textFieldProps: {
                multiline: true,
                rows: 3
            }
        },
        {
            field: "postcode",
            label: "Postcode",
            type: "textfield",
            changeListener: inputChangeListener
        },
        {
            field: "accounts_contact",
            label: "Accounts Contact",
            type: "textfield",
            changeListener: inputChangeListener
        },
        {
            field: "account_email",
            label: "Accounts Email",
            type: "textfield",
            changeListener: inputChangeListener,
            textFieldProps: {
                type: "email"
            }
        },
        {
            field: "orders_contact",
            label: "Orders Contact",
            type: "textfield",
            changeListener: inputChangeListener
        },
        {
            field: "orders_email",
            label: "Orders Email",
            type: "textfield",
            changeListener: inputChangeListener,
            textFieldProps: {
                type: "email"
            }
        },
        {
            field: "phone",
            label: "Phone",
            type: "textfield",
            changeListener: inputChangeListener
        },
        {
            field: "mobile",
            label: "Mobile",
            type: "textfield",
            changeListener: inputChangeListener
        },
        {
            field: "website",
            label: "Website",
            type: "textfield",
            changeListener: inputChangeListener
        },
        {
            field: "credit_limit",
            label: "Credit Limit",
            type: "textfield",
            changeListener: numberInputChangeListener,
            textFieldProps: {
                type: "number"
            }
        },
        {
            field: "payee_name",
            label: "Payee Name",
            type: "textfield",
            changeListener: inputChangeListener
        },
        {
            field: "hold",
            label: "Hold",
            type: "checkbox",
            default: false,
            changeListener: holdCheckboxChangeListener
        }
    ];
    const defaultFormState = getDefaultFormFields(supplierData);
    const [formValues, setFormValues] = useState({...defaultFormState});
    const colDefs = [...getColumnDefs(supplierData), getActionColumnDef(setEditMode, setFormValues, API_NAME, displaySnackState, setSnackState, setSendingData, fetchAllInventorySuppliers, false, requiredWritePermissions, null)];

    return <div style={{height: "90%"}}>
        <CustomisedSnackBar {...snackState} setClosed={setSnackState} />
        <Dialog open={dialogOpen} fullScreen>
            <DialogClosingTitleBar title={`${editMode ? "EDIT" : "ADD"} ITEM SUPPLIER`} handleClose={handleCloseDialog}/>
            <div>
                <Card className={cardStyles.popupFormCard}>
                <CardContent>
                    <form onSubmit={editMode ? handleEditSubmit : handleSubmit}>
                        {getGridFormInputFields(getInputFields(supplierData, formValues))}
                        <LoadingButton loading={sendingData} icon={editMode ? <EditIcon /> : <AddIcon />} buttonLabel={`${editMode ? "EDIT" : "ADD"} ITEM SUPPLIER`} disabled={sendingData} />
                        {editMode ? <Button variant="contained" color="error" onClick={disableEditMode} >CANCEL</Button> : ""}
                    </form>
                </CardContent>
            </Card>
        </div>
        </Dialog>
        <Button variant="contained" onClick={handleOpenDialog} style={{marginRight: "1em"}} disabled={!currentUserHasPermissions(requiredWritePermissions)}>Add Item Supplier</Button>
        <Button variant="contained" onClick={fetchAllInventorySuppliers}>Reload</Button>
        <DataViewGrid rowData={rowData} columnDefs={colDefs} loading={sendingData} />
    </div>
};