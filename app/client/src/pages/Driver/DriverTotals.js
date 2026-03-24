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
    currentUserHasPermissions, dateStringComparator, momentFormat, stringValueToNumberComparator
} from "../../components/formFunctions/FormFunctions";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import {Button, Dialog, TextField} from "@mui/material";

import LinkedFieldCellValueGetterRenderer from "../../components/cellRenderers/LinkedFieldCellValueGetterRenderer";
import DataViewGrid from "../../components/DataViewGrid/DataViewGrid";
import DialogClosingTitleBar from "../../components/DialogClosingTitleBar/DialogClosingTitleBar";
import cardStyles from "../../components/PopupCardDialogStyles/PopupCardDialogStyles.module.css";
import moment from "moment";
import MenuItem from "@mui/material/MenuItem";
import {useAuth0} from "@auth0/auth0-react";
import {PriceCellRenderer} from "../../components/cellRenderers/PriceCellRenderer";
import LocalizationProvider from "@mui/lab/LocalizationProvider";
import AdapterDateFns from "@mui/lab/AdapterDateFns";
import DatePicker from "@mui/lab/DatePicker";

const API_NAME = '/driver/total';

export const DriverTotals = () => {
    const {user} = useAuth0();
    const [sendingData, setSendingData] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [startDate, setStartDate] = useState(moment(new Date()).subtract(7, "days").format(momentFormat));
    const [endDate, setEndDate] = useState(moment(new Date()).format(momentFormat));
    const [zonesData, setZonesData] = useState(defaultLoadedFieldData);
    const [vehiclesData, setVehiclesData] = useState(defaultLoadedFieldData);
    const [driversData, setDriversData] = useState(defaultLoadedFieldData);
    const [snackState, setSnackState] = useState(defaultSnackState);
    const [rowData, setRowData] = useState([]);
    const requiredWritePermissions = [process.env.REACT_APP_WRITE_DRIVER_TOTALS_PERMISSION];

    const disableEditMode = () => {
        setFormValues(defaultFormState);
        setEditMode(false);
    };

    const handleSearchDateChange = (newDate, dateType) => {
        const momentDate = moment(newDate).format(momentFormat);
        if(dateType === "start") {
            setStartDate(momentDate);
        } else {
            setEndDate(momentDate);
        }
    };

    const inputChangeListener = event => {
        handleInputChange(event, formValues, setFormValues)
    };

    const fetchAllTotals = () => {
        fetchAllEntriesAndSetRowData(API_NAME, {params: {start: startDate, end: endDate}}, setSendingData, setRowData, setSnackState);
        fetchZones();
        fetchDrivers();
        fetchVehicles();
    };

    const fetchZones = () => {
        fetchDropdownField("/zone", setZonesData, setSnackState, false);
    };

    const fetchVehicles = () => {
        fetchDropdownField("/driver/vehicle", setVehiclesData, setSnackState, false);
    };

    const fetchDrivers = () => {
        fetchDropdownField("/driver/name", setDriversData, setSnackState, false);
    };

    const handleSubmit = event => {
        handleDataSubmit(API_NAME, event, setSendingData, formValues, setFormValues, defaultFormState, setSnackState, fetchAllTotals);
    };

    const handleEditSubmit = event => {
        handleDataEditSubmit(API_NAME, event, setSendingData, setEditMode, formValues, setFormValues, defaultFormState, setSnackState, fetchAllTotals);
    };

    const handleDateChange = (newDate, fieldName) => {
        setFormValues({
            ...formValues,
            [fieldName]: moment(newDate).format(momentFormat),
        });
    };

    const handleOpenDialog = () => {
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setEditMode(false);
        setDialogOpen(false);
        setFormValues(defaultFormState);
    };

    const driverTotalsData = [
        {
            field: "driver",
            label: "Driver Name",
            type: "dropdown",
            dropdownOptions: driversData,
            defaultState: [],
            changeListener: inputChangeListener,
            textFieldProps: {
                required: true,
                type: "text"
            },
            gridProps: {
                valueGetter: props => LinkedFieldCellValueGetterRenderer({
                    ...props,
                    idMapping: driversData.map,
                    mappedFieldName: "name",
                    mappingDataLoaded: driversData.loaded
                })
            }
        },
        {
            field: "vehicle",
            label: "Vehicle",
            type: "dropdown",
            dropdownOptions: vehiclesData,
            defaultState: [],
            changeListener: inputChangeListener,
            textFieldProps: {
                required: true,
                type: "text"
            },
            gridProps: {
                valueGetter: props => LinkedFieldCellValueGetterRenderer({
                    ...props,
                    idMapping: vehiclesData.map,
                    mappedFieldName: "name",
                    mappingDataLoaded: vehiclesData.loaded
                })
            }
        },
        {
            field: "date",
            label: "Date",
            type: "datepicker",
            changeListener: newDate => handleDateChange(newDate, "date"),
            gridProps: {
                valueGetter: props => moment(props.data.date).format("DD/MM/YYYY"),
                comparator: dateStringComparator
            }
        },
        {
            field: "helper",
            label: "Helper",
            type: "textfield",
            changeListener: inputChangeListener,
            textFieldProps: {
                type: "text"
            }
        },
        {
            field: "zone",
            label: "Zone",
            type: "dropdown",
            dropdownOptions: zonesData,
            defaultState: [],
            changeListener: inputChangeListener,
            textFieldProps: {
                required: true,
                type: "text"
            },
            gridProps: {
                valueGetter: props => LinkedFieldCellValueGetterRenderer({
                    ...props,
                    idMapping: zonesData.map,
                    mappedFieldName: "name",
                    mappingDataLoaded: zonesData.loaded
                })
            }
        },
        {
            field: "recorded_by",
            label: "Recorded by",
            type: "textfield",
            textFieldProps: {
                type: "text",
                disabled: true
            },
            gridProps: {
                hide: true
            }
        },
            ...currentUserHasPermissions([process.env.REACT_APP_WRITE_CHECKED_DRIVER_DETAILS_PERMISSION]) ? [{
                field: "checked_by",
                label: "Checked by",
                type: "textfield",
                textFieldProps: {
                    type: "text",
                    disabled: true
                },
                gridProps: {
                    hide: true
                }
            }] : [],
        {
            field: "notes",
            label: "Notes",
            type: "textfield",
            changeListener: inputChangeListener,
            textFieldProps: {
                type: "text",
                autoComplete: "off",
                multiline: true,
                rows: 2
            }
        },
        {
            field: "deduction_amount",
            label: "Deduction Amount",
            type: "textfield",
            changeListener: event => handleNumberInputChange(event, formValues, setFormValues),
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
            field: "card_total",
            label: "Card Total",
            type: "textfield",
            changeListener: event => handleNumberInputChange(event, formValues, setFormValues),
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
            field: "cash_total",
            label: "Cash Total",
            type: "textfield",
            changeListener: event => handleNumberInputChange(event, formValues, setFormValues),
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
            field: "cash_received",
            label: "Cash Received",
            type: "textfield",
            changeListener: event => handleNumberInputChange(event, formValues, setFormValues),
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
            field: "cash_difference",
            label: "Cash Difference",
            type: "textfield",
            changeListener: event => handleNumberInputChange(event, formValues, setFormValues),
            textFieldProps: {
                disabled: true,
                type: "number"
            },
            gridProps: {
                width: 150,
                type: "rightAligned",
                valueGetter: PriceCellRenderer,
                comparator: stringValueToNumberComparator,
                cellStyle: params => {
                    if(params.data.cash_received < params.data.cash_total) {
                        return {color: 'red'};
                    } else {
                        return {color: 'green'};
                    }
                }
            }
        },
        {
            field: "reason",
            label: "Reason",
            type: "dropdown_fixed",
            changeListener: inputChangeListener,
            textFieldProps: {
                required: true
            },
            dropdownOptions: {
                loaded: true,
                menuEntries: [
                    <MenuItem value={"Fuel"} key={"Fuel"}>Fuel</MenuItem>,
                    <MenuItem value={"Misc"} key={"Misc"}>Misc</MenuItem>
                ]
            }
        },
    ];

    useEffect(() => {
        fetchAllTotals();
    }, []);

    useEffect(() => {
        fetchAllTotals();
    }, [startDate, endDate]);

    useEffect(() => {
        if (editMode) {
            setDialogOpen(true);
        } else {
            setDialogOpen(false);
        }
    }, [editMode]);

    const defaultFormState = {...getDefaultFormFields(driverTotalsData), recorded_by: user.name, ...currentUserHasPermissions([process.env.REACT_APP_WRITE_CHECKED_DRIVER_DETAILS_PERMISSION]) ? {checked_by: user.name} : {}};
    const [formValues, setFormValues] = useState({...defaultFormState});
    const colDefs = [...getColumnDefs(driverTotalsData), getActionColumnDef(setEditMode, setFormValues, API_NAME, displaySnackState, setSnackState, setSendingData, fetchAllTotals, true, requiredWritePermissions, null)];

    return <div style={{height: "90%"}}>
        <CustomisedSnackBar {...snackState} setClosed={setSnackState}/>
        <Dialog open={dialogOpen} fullScreen>
            <DialogClosingTitleBar title={`${editMode ? "EDIT" : "ADD"} DRIVER TOTAL`} handleClose={handleCloseDialog}/>
            <div>
                <Card className={cardStyles.popupFormCard}>
                    <CardContent>
                        <form onSubmit={editMode ? handleEditSubmit : handleSubmit}>
                            {getGridFormInputFields(getInputFields(driverTotalsData, formValues))}
                            <LoadingButton loading={sendingData || !zonesData.loaded || !vehiclesData.loaded}
                                           icon={editMode ? <EditIcon/> : <AddIcon/>}
                                           buttonLabel={`${editMode ? "EDIT" : "ADD"} DRIVER TOTAL`} disabled={sendingData}/>
                            {editMode ? <Button variant="contained" color="error"
                                                onClick={disableEditMode}>CANCEL</Button> : ""}
                        </form>
                    </CardContent>
                </Card>
            </div>
        </Dialog>
        <span>From</span>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
                label="Start Date"
                value={startDate}
                onChange={newDate => handleSearchDateChange(newDate, "start")}
                inputFormat="dd/MM/yyyy"
                renderInput={(params) => <TextField {...params} />}
            />
        </LocalizationProvider>
        <span>To</span>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
                label="End Date"
                value={endDate}
                onChange={newDate => handleSearchDateChange(newDate, "end")}
                inputFormat="dd/MM/yyyy"
                renderInput={(params) => <TextField {...params} />}
            />
        </LocalizationProvider>
        <Button variant="contained" onClick={handleOpenDialog} style={{marginRight: "1em"}} disabled={!currentUserHasPermissions(requiredWritePermissions)}>Add Driver Total</Button>
        <Button variant="contained" onClick={fetchAllTotals}>Reload</Button>
        <DataViewGrid rowData={rowData} columnDefs={colDefs} loading={sendingData}/>
    </div>
};