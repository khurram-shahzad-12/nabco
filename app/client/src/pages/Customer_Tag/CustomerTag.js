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
import {Button, Dialog, TextField} from "@mui/material";

import DataViewGrid from "../../components/DataViewGrid/DataViewGrid";
import DialogClosingTitleBar from "../../components/DialogClosingTitleBar/DialogClosingTitleBar";
import cardStyles from "../../components/PopupCardDialogStyles/PopupCardDialogStyles.module.css";

const API_NAME = '/customer-tag';

export const CustomerTag = () => {
    const [sendingData, setSendingData] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [snackState, setSnackState] = useState(defaultSnackState);
    const [rowData, setRowData] = useState([]);
    const requiredWritePermissions = [process.env.REACT_APP_WRITE_CUSTOMER_TAGS_CLAIM];

    const disableEditMode = () => {
        setFormValues(defaultFormState);
        setEditMode(false);
    };

    const inputChangeListener = event => {
        handleInputChange(event, formValues, setFormValues)
    };

    const fetchAllCustomerTags = () => {
        fetchAllEntriesAndSetRowData(API_NAME, null, setSendingData, setRowData, setSnackState);
    };

    const handleSubmit = event => {
        handleDataSubmit(API_NAME, event, setSendingData, formValues, setFormValues, defaultFormState, setSnackState, fetchAllCustomerTags);
    };

    const handleEditSubmit = event => {
        handleDataEditSubmit(API_NAME, event, setSendingData, setEditMode, formValues, setFormValues, defaultFormState, setSnackState, fetchAllCustomerTags);
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
        fetchAllCustomerTags();
    }, []);

    useEffect(() => {
        if (editMode) {
            setDialogOpen(true);
        } else {
            setDialogOpen(false);
        }
    }, [editMode]);

    const customerTagData = [
        {
            field: "name",
            label: "Tag",
            type: "textfield",
            changeListener: inputChangeListener,
            textFieldProps: {
                required: true,
                type: "text",
                autoFocus: true
            }
        }
    ];
    const defaultFormState = getDefaultFormFields(customerTagData);
    const [formValues, setFormValues] = useState({...defaultFormState});
    const colDefs = [...getColumnDefs(customerTagData), getActionColumnDef(setEditMode, setFormValues, API_NAME, displaySnackState, setSnackState, setSendingData, fetchAllCustomerTags, false, requiredWritePermissions, null)];


    return <div style={{height: "90%"}}>
        <CustomisedSnackBar {...snackState} setClosed={setSnackState} />
        <Dialog open={dialogOpen} fullScreen>
            <DialogClosingTitleBar title={`${editMode ? "EDIT" : "ADD"} TAG`} handleClose={handleCloseDialog}/>
            <div>
                <Card className={cardStyles.popupFormCard}>
                <CardContent>
                    <form onSubmit={editMode ? handleEditSubmit : handleSubmit}>
                        {getGridFormInputFields(getInputFields(customerTagData, formValues))}
                        <LoadingButton loading={sendingData} icon={editMode ? <EditIcon /> : <AddIcon />} buttonLabel={`${editMode ? "EDIT" : "ADD"} TAG`} disabled={sendingData} />
                        {editMode ? <Button variant="contained" color="error" onClick={disableEditMode} >CANCEL</Button> : ""}
                    </form>
                </CardContent>
            </Card>
        </div>
        </Dialog>
        <Button variant="contained" onClick={handleOpenDialog} style={{marginRight: "1em"}} disabled={!currentUserHasPermissions(requiredWritePermissions)}>Add Tag</Button>
        <Button variant="contained" onClick={fetchAllCustomerTags}>Reload</Button>
        <DataViewGrid rowData={rowData} columnDefs={colDefs} loading={sendingData} />
    </div>
};