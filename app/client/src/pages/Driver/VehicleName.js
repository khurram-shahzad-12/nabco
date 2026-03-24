import React, {useEffect, useState} from 'react';

import displaySnackState from "../../components/customisedSnackBar/DisplaySnackState";
import CustomisedSnackBar from "../../components/customisedSnackBar/CustomisedSnackBar";
import {LoadingButton} from "../../components/loadingButton/LoadingButton";
import {
    defaultLoadedFieldData, defaultSnackState,
    fetchAllEntriesAndSetRowData, fetchDropdownField,
    getActionColumnDef, getColumnDefs,
    getDefaultFormFields, getGridFormInputFields,
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

import LinkedFieldCellValueGetterRenderer from "../../components/cellRenderers/LinkedFieldCellValueGetterRenderer";
import DataViewGrid from "../../components/DataViewGrid/DataViewGrid";
import DialogClosingTitleBar from "../../components/DialogClosingTitleBar/DialogClosingTitleBar";
import cardStyles from "../../components/PopupCardDialogStyles/PopupCardDialogStyles.module.css";

const API_NAME = '/driver/vehicle';

export const VehicleName = () => {
    const [sendingData, setSendingData] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [snackState, setSnackState] = useState(defaultSnackState);
    const [rowData, setRowData] = useState([]);
    const requiredWritePermissions = [process.env.REACT_APP_WRITE_DRIVER_DETAILS_PERMISSION];

    const disableEditMode = () => {
        setFormValues(defaultFormState);
        setEditMode(false);
    };

    const inputChangeListener = event => {
        handleInputChange(event, formValues, setFormValues)
    };

    const fetchAllVehicles = () => {
        fetchAllEntriesAndSetRowData(API_NAME, null, setSendingData, setRowData, setSnackState);
    };

    const handleSubmit = event => {
        handleDataSubmit(API_NAME, event, setSendingData, formValues, setFormValues, defaultFormState, setSnackState, fetchAllVehicles);
    };

    const handleEditSubmit = event => {
        handleDataEditSubmit(API_NAME, event, setSendingData, setEditMode, formValues, setFormValues, defaultFormState, setSnackState, fetchAllVehicles);
    };

    const handleOpenDialog = () => {
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setEditMode(false);
        setDialogOpen(false);
        setFormValues(defaultFormState);
    };

    const nonDeleteAbleVehID = "659419c572707b2a064b1788";
    const isDeleteDisabled = (rowData) => {
        return rowData._id === nonDeleteAbleVehID;
    }
    const vehicleNameData = [
        {
            field: "name",
            label: "Name",
            type: "textfield",
            changeListener: inputChangeListener,
            textFieldProps: {
                required: true,
                type: "text",
                autoFocus: true
            }
        },
        {
            field: "capacity",
            label: "Capacity(KG)",
            type: "textfield",
            changeListener: inputChangeListener,
            textFieldProps: {
                required: true,
                type: "text",
                autoFocus: true
            }
        },
        {
            field: "status",
            label: "UnAssigned",
            type: "textfield",
            defaultValue: "unassigned",
            changeListener: inputChangeListener,
            textFieldProps: {
                required: true,
                type: "text",
                autoFocus: true,
                disabled: true,
            }
        },
    ];

    useEffect(() => {
        fetchAllVehicles();
    }, []);

    useEffect(() => {
        if (editMode) {
            setDialogOpen(true);
        } else {
            setDialogOpen(false);
        }
    }, [editMode]);

    const defaultFormState = getDefaultFormFields(vehicleNameData);
    const [formValues, setFormValues] = useState({...defaultFormState});
    const colDefs = [...getColumnDefs(vehicleNameData), getActionColumnDef(setEditMode, setFormValues, API_NAME, displaySnackState, setSnackState, setSendingData, fetchAllVehicles, isDeleteDisabled, requiredWritePermissions, null,)];

    return <div style={{height: "90%"}}>
        <CustomisedSnackBar {...snackState} setClosed={setSnackState}/>
        <Dialog open={dialogOpen} fullScreen>
            <DialogClosingTitleBar title={`${editMode ? "EDIT" : "ADD"} VEHICLE`} handleClose={handleCloseDialog}/>
            <div>
                <Card className={cardStyles.popupFormCard}>
                    <CardContent>
                        <form onSubmit={editMode ? handleEditSubmit : handleSubmit}>
                            {getGridFormInputFields(getInputFields(vehicleNameData, formValues))}
                            <LoadingButton loading={sendingData}
                                           icon={editMode ? <EditIcon/> : <AddIcon/>}
                                           buttonLabel={`${editMode ? "EDIT" : "ADD"} VEHICLE`} disabled={sendingData}/>
                            {editMode ? <Button variant="contained" color="error"
                                                onClick={disableEditMode}>CANCEL</Button> : ""}
                        </form>
                    </CardContent>
                </Card>
            </div>
        </Dialog>
        <Button variant="contained" onClick={handleOpenDialog} style={{marginRight: "1em"}} disabled={!currentUserHasPermissions(requiredWritePermissions)}>Add Vehicle</Button>
        <Button variant="contained" onClick={fetchAllVehicles}>Reload</Button>
        <DataViewGrid rowData={rowData} columnDefs={colDefs} loading={sendingData}/>
    </div>
};