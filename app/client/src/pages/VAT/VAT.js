import React, {useEffect, useState} from 'react';

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
    handleInputChange, handleNumberInputChange,
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

const API_NAME = '/vat';

export const VAT = () => {
    const [sendingData, setSendingData] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [snackState, setSnackState] = useState(defaultSnackState);
    const [rowData, setRowData] = useState([]);
    const requiredWritePermissions = [process.env.REACT_APP_WRITE_VAT_CLAIM];

    const disableEditMode = () => {
        setFormValues(defaultFormState);
        setEditMode(false);
    };

    const inputChangeListener = event => {
        handleInputChange(event, formValues, setFormValues)
    };

    const fetchAllVATs = () => {
        fetchAllEntriesAndSetRowData(API_NAME, null, setSendingData, setRowData, setSnackState);
    };

    const handleSubmit = event => {
        handleDataSubmit(API_NAME, event, setSendingData, formValues, setFormValues, defaultFormState, setSnackState, fetchAllVATs);
    };

    const handleEditSubmit = event => {
        handleDataEditSubmit(API_NAME, event, setSendingData, setEditMode, formValues, setFormValues, defaultFormState, setSnackState, fetchAllVATs);
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
        fetchAllVATs();
    }, []);

    useEffect(() => {
        if (editMode) {
            setDialogOpen(true);
        } else {
            setDialogOpen(false);
        }
    }, [editMode]);

    const vatData = [
        {
            field: "name",
            label: "VAT Code",
            type: "textfield",
            changeListener: inputChangeListener,
            textFieldProps: {
                required: true,
                type: "text",
                autoFocus: true
            }
        },
        {
            field: "rate",
            label: "Rate",
            type: "textfield",
            changeListener: event => handleNumberInputChange(event, formValues, setFormValues),
            textFieldProps: {
                required: true,
                type: "number",
                inputProps: {
                    min: 0,
                    step: 0.01
                }
            }
        },
        {
            field: "order",
            label: "Order",
            type: "textfield",
            defaultState: 0,
            changeListener: inputChangeListener,
            textFieldProps: {
                type: "number",
                inputProps: {
                    min: 0
                }
            }
        }
    ];
    const defaultFormState = getDefaultFormFields(vatData);
    const [formValues, setFormValues] = useState({...defaultFormState});
    const colDefs = [...getColumnDefs(vatData), getActionColumnDef(setEditMode, setFormValues, API_NAME, displaySnackState, setSnackState, setSendingData, fetchAllVATs, true, requiredWritePermissions, null)];

    return <div style={{height: "90%"}}>
        <CustomisedSnackBar {...snackState} setClosed={setSnackState}/>
        <Dialog open={dialogOpen} fullScreen>
            <DialogClosingTitleBar title={`${editMode ? "EDIT" : "ADD"} VAT`} handleClose={handleCloseDialog}/>
            <div>
                <Card className={cardStyles.popupFormCard}>
                    <CardContent>
                        <form onSubmit={editMode ? handleEditSubmit : handleSubmit}>
                            {getGridFormInputFields(getInputFields(vatData, formValues))}
                            <LoadingButton loading={sendingData} icon={editMode ? <EditIcon/> : <AddIcon/>}
                                           buttonLabel={`${editMode ? "EDIT" : "ADD"} VAT`} disabled={sendingData}/>
                            {editMode ? <Button variant="contained" color="error"
                                                onClick={disableEditMode}>CANCEL</Button> : ""}
                        </form>
                    </CardContent>
                </Card>
            </div>
        </Dialog>
        <div>
            <Button variant="contained" onClick={handleOpenDialog} style={{marginRight: "1em"}} disabled={!currentUserHasPermissions(requiredWritePermissions)}>Add VAT</Button>
            <Button variant="contained" onClick={fetchAllVATs}>Reload</Button>
        </div>
        <DataViewGrid rowData={rowData} columnDefs={colDefs} loading={sendingData}/>
    </div>
};