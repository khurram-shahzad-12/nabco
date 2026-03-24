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
    currentUserHasPermissions
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
            field: "name",
            label: "Supplier",
            type: "textfield",
            changeListener: inputChangeListener,
            textFieldProps: {
                required: true,
                type: "text",
                autoFocus: true
            }
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