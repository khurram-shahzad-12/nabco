import axiosDefault from "../axiosDefault/axiosDefault";
import displaySnackState from "../customisedSnackBar/DisplaySnackState";
import {URL_API, URL_ROOT} from "../../configs/config";
import {Grid, TextField} from "@mui/material";
import React from "react";
import {btnActionCellRenderer} from "../cellRenderers/ActionCellRenderer";
import MenuItem from "@mui/material/MenuItem";
import Autocomplete from "@mui/material/Autocomplete";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import FormGroup from "@mui/material/FormGroup";
import FormLabel from "@mui/material/FormLabel";
import FormControl from "@mui/material/FormControl";
import AdapterDateFns from "@mui/lab/AdapterDateFns";
import DatePicker from "@mui/lab/DatePicker";
import LocalizationProvider from "@mui/lab/LocalizationProvider";
import DeliveryDayZonePicker from "../DeliveryDayZonePicker/DeliveryDayZonePicker";
import { v4 as uuidv4 } from 'uuid';
import jwtDecode from "jwt-decode";
import Cookies from 'universal-cookie';
import moment from "moment";

const currentUserHasPermissions = (targetPermissions) => {
    const token = new Cookies().get("apiToken");
    const currentUserPermissions = jwtDecode(token).permissions;
    return currentUserPermissions.some(item => targetPermissions.includes(item));
};

const defaultColDef = {
    resizable: true,
    filter: true,
    floatingFilter: true,
    sortable: true
};

const defaultLoadedFieldData = {
    map: {},
    menuEntries: [],
    loaded: false
};

const defaultSnackState = {
    open: false,
    message: "test",
    severity: "success"
};

const daysMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const handleInputChange = (e, formValues, setFormValues) => {
    const {name, value} = e.target;
    // console.log(`${name}=${value}`);
    setFormValues({
        ...formValues,
        [name]: value,
    });
};

const handleNumberInputChange = (e, formValues, setFormValues) => {
    const {name, value} = e.target;
    // console.log(`${name}=${value}`);
    setFormValues({
        ...formValues,
        [name]: Number(value)
    });
};

const handleCheckboxChange = (e, formValues, setFormValues) => {
    const { checked, name } = e.target;
    e.target = {
        name: name,
        value: checked
    };
    handleInputChange(e, formValues, setFormValues);
};

const handleCheckboxGroupChange = (e, formValues, setFormValues) => {
    const { checked, name } = e.target;
    const id = Number(e.target.id);
    let newCheckedState = [...formValues[name]];
    if(checked) {
        newCheckedState.push(id);
    } else {
        newCheckedState = newCheckedState.filter(item => item !== id);
    }
    e.target = {
        name: name,
        value: newCheckedState
    };
    handleInputChange(e, formValues, setFormValues);
};

const fetchEntries = (API_NAME, onSuccess, onFail) => {
    axiosDefault().get(URL_ROOT + URL_API + API_NAME)
        .then(onSuccess)
        .catch(onFail)
};

const fetchAllEntriesAndSetRowData = (API_NAME, axiosConfig, setSendingData, setRowData, setSnackState, finalCallback) => {
    setSendingData(true);
    axiosDefault().get(URL_ROOT + URL_API + API_NAME, axiosConfig)
        .then(response => {
            setRowData(response.data);
        })
        .catch(error => {
            console.error(error);
            displaySnackState(`Failed to load data - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
        })
        .finally(() => {
            setSendingData(false);
            if(finalCallback)
                finalCallback();
        });
};

const fetchAllEntriesAndSetRowDataViaPost = (API_NAME, data, setSendingData, setRowData, setSnackState, finalCallback) => {
    setSendingData(true);
    axiosDefault().post(URL_ROOT + URL_API + API_NAME, {...data})
        .then(response => {
            setRowData(response.data);
        })
        .catch(error => {
            console.error(error);
            displaySnackState(`Failed to load data - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
        })
        .finally(() => {
            setSendingData(false);
            if(finalCallback)
                finalCallback();
        });
};

const createCustomerItemsList = (API_NAME, data, setSendingData, setSnackState, finalCallback) => {
    setSendingData(true);
    axiosDefault().post(URL_ROOT + URL_API + API_NAME, {
        ...data
    })
        .then(response => {
            displaySnackState("Items saved successfully", "success", setSnackState);
        })
        .catch(error => {
            console.error(error);
            displaySnackState(`Failed to save - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
        })
        .finally(() => {
            setSendingData(false);
            if(finalCallback)
                finalCallback();
        })
};

const editCustomerItemsList = (API_NAME, data, setSendingData, setSnackState, finalCallback) => {
    setSendingData(true);
    axiosDefault().put(URL_ROOT + URL_API + API_NAME + `/${data._id}`, {
        ...data
    })
        .then(response => {
            displaySnackState("Items saved successfully", "success", setSnackState);
        })
        .catch(error => {
            console.error(error);
            displaySnackState(`Failed to save - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
        })
        .finally(() => {
            setSendingData(false);
            if(finalCallback)
                finalCallback();
        })
};

const updateFieldsData = (API_NAME, data, setSendingData, setSnackState, finalCallback) => {
    setSendingData(true);
    axiosDefault().put(URL_ROOT + URL_API + API_NAME, {data})
        .then(response => {
            displaySnackState("Items saved successfully", "success", setSnackState);
        })
        .catch(error => {
            console.error(error);
            displaySnackState(`Failed to save - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
        })
        .finally(() => {
            setSendingData(false);
            if(finalCallback)
                finalCallback();
        })
};

const handleDataSubmit = (API_NAME, event, setSendingData, formValues, setFormValues, defaultFormState, setSnackState, finalCallback) => {
    event?.preventDefault();
    setSendingData(true);
    axiosDefault().post(URL_ROOT + URL_API + API_NAME, {
        ...formValues
    })
        .then(response => {
            setFormValues(defaultFormState);
        })
        .catch(error => {
            console.error(error);
            displaySnackState(`Failed to add - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
        })
        .finally(() => {
            setSendingData(false);
            if(finalCallback)
                finalCallback();
        })
};

const handleDataEditSubmit = (API_NAME, event, setSendingData, setEditMode, formValues, setFormValues, defaultFormState, setSnackState, finalCallback) => {
    event?.preventDefault();
    setSendingData(true);
    axiosDefault().put(URL_ROOT + URL_API + API_NAME + '/' + formValues._id, {
        ...formValues
    })
        .then(response => {
            setFormValues(defaultFormState);
            setEditMode(false);
        })
        .catch(error => {
            console.error(error);
            displaySnackState(`Failed to update - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
        })
        .finally(() => {
            setSendingData(false);
            if(finalCallback)
                finalCallback();
        })
};

const handleDeleteEntry = (API_NAME, id, setSendingData, setSnackState, finalCallback) => {
    setSendingData(true);
    axiosDefault().delete(URL_ROOT + URL_API + API_NAME + '/' + id)
        .catch(error => {
            console.error(error);
            displaySnackState(`Failed to remove - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
        })
        .finally(() => {
            setSendingData(false);
            if(finalCallback)
                finalCallback();
        })
};

const getTextField = (item, formValues) => {
    return <TextField label={item.label}
                      name={item.field}
                      value={formValues[item.field]}
                      variant="outlined"
                      autoComplete="off"
                      onChange={item.changeListener}
                      fullWidth
                      {...item.textFieldProps}
    />
};

const getDropdown = (item, formValues) => {
    return <TextField label={item.label}
                      name={item.field}
                      value={formValues[item.field]}
                      variant="outlined"
                      autoComplete="off"
                      onChange={item.changeListener}
                      select
                      fullWidth
                      {...item.textFieldProps}
    >
        {
            item.dropdownOptions.loaded ?
                item.dropdownOptions.menuEntries
                :
                <MenuItem value="" disabled>Loading, please wait...</MenuItem>
        }
    </TextField>
};

const getDropdownAutocomplete = (item) => {
    return <Autocomplete
        name={item.field}
        options={item.dropdownOptions.menuEntries}
        onChange={item.changeListener}
        loading={!item.dropdownOptions.loaded}
        autoComplete={false}
        renderInput={(params) => (
            <TextField
                {...params}
                variant="standard"
                label={item.label}
            />
        )}
        getOptionLabel={option => item.dropdownOptions.map[option]?.name}
        {...item.dropdownProps}
    />
};

const getChipsDropdown = (item, formValues) => {
    return <Autocomplete
        multiple
        options={item.dropdownOptions.menuEntries}
        value={formValues[item.field]}
        onChange={item.changeListener}
        loading={!item.dropdownOptions.loaded}
        disableCloseOnSelect
        renderInput={(params) => (
            <TextField
                {...params}
                variant="standard"
                label={item.label}
            />
        )}
        getOptionLabel={option => item.dropdownOptions.map[option]?.[item.dropdownNameField]}
    />
};

const getSingleCheckbox = (item, formValues) => {
    return <FormGroup>
        <FormControlLabel control={<Checkbox checked={formValues[item.field]} onChange={item.changeListener} name={item.field} key={Math.random()} {...item.checkboxProps} />} label={item.label} key={Math.random()} />
    </FormGroup>
};

const getMultiCheckbox = (item, formValues) => {
    return <FormControl component="fieldset" variant="standard" {...item.formProps}>
        <FormLabel component="legend">{item.label}</FormLabel>
        <FormGroup row>
            {
                item.checkboxProps.optionLabels.map((value, index) => {
                    return <FormControlLabel control={<Checkbox checked={formValues[item.field].includes(index)} onChange={item.changeListener} name={item.field} id={index} />} label={value} />
                })
            }
        </FormGroup>
    </FormControl>
};

const getDatepicker = (item, formValues) => {
    return <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker
            label={item.label}
            name={item.field}
            value={formValues[item.field]}
            onChange={item.changeListener}
            inputFormat="dd/MM/yyyy"
            {...item.datePickerProps}
            renderInput={(params) => <TextField {...params} />}
        />
    </LocalizationProvider>
};

const getDeliveryDayZonePicker = (item, formValues) => {
    return <div style={{height: "400px"}} key={"delivery_day_zone_picker"}>
        <span>Delivery Days</span>
        <DeliveryDayZonePicker zonesData={item.pickerProps.zonesData}
                               existingZoneSelection={formValues.zones}
                               zoneChange={item.changeListener}
        />
    </div>
}

const getInputFields = (data, formValues) => {
    return data.map(item => {
        switch (item.type) {
            case "textfield":
                return getTextField(item, formValues);
            case "dropdown":
            case "dropdown_fixed":
                return getDropdown(item, formValues);
            case "dropdown_autocomplete":
                return getDropdownAutocomplete(item, formValues);
            case "chips_dropdown":
                return getChipsDropdown(item, formValues);
            case "checkbox":
                return getSingleCheckbox(item, formValues);
            case "checkbox_multi":
                return getMultiCheckbox(item, formValues);
            case "datepicker":
                return getDatepicker(item, formValues);
            case "delivery_day_zone_picker":
                return getDeliveryDayZonePicker(item, formValues);
        }
    });
};

const getGridFormInputFields = (fields) => {
    return <Grid container spacing={2}>
        {fields.map(field => <Grid item xs={12} sm={6} md={3}>{field}</Grid>)}
    </Grid>;
};

const getCustomerGridFormInputFields = (fields) => {
    return <Grid container spacing={2}>
        {fields.map(field => {
            return field.key !== null ?
                <Grid item xs={12} sm={6}>{field}</Grid> :
                <Grid item xs={12} sm={6} md={3}>{field}</Grid>
        })}
    </Grid>;
};

const getMenuItemsForDropdown = data => {
    return data.map(item => <MenuItem value={item._id} key={item._id}>{item.name}</MenuItem>);
};

const getIDMappingForElement = data => {
    let mapping = {};
    data.forEach(item => mapping[item._id] = item);
    return mapping;
}

const getDefaultFormFields = data => {
    let defaultState = {};
    data.forEach(item => {
        if('defaultState' in item) {
            defaultState[item.field] = item.defaultState;
        } else {
            defaultState[item.field] = ""
        }
    });
    return defaultState;
};

const getColumnDefs = (data) => {
    let colDef = Array(data.length);
    data.forEach((item, index) => {
        const currentColumnDef = {
            field: item.field,
            headerName: item.label,
            ...item.gridProps
        };
        if("columnOrder" in item) {
            colDef[item.columnOrder] = currentColumnDef;
        } else {
            colDef[index] = currentColumnDef;
        }
    });
    return colDef;
};

const getActionColumnDef = (setEditMode, setFormValues, API_NAME, displaySnackState, setSnackState, setSendingData, deleteCallback, disabledDelete, requiredWritePermissions, showImage) => {
    return {
        field: "_id",
        headerName: "Action",
        floatingFilter: false,
        filter: false,
        cellRenderer: btnActionCellRenderer,
        cellRendererParams: {
            setEditModeCB: setEditMode,
            setFormValuesCB: setFormValues,
            apiName: API_NAME,
            displaySnackState: displaySnackState,
            setSnackState: setSnackState,
            setSendingData: setSendingData,
            deleteCallback: deleteCallback,
            disabledDelete: disabledDelete,
            requiredWritePermissions: requiredWritePermissions,
            showImage: showImage,
        }
    }
};

const fetchDropdownField = (API_NAME, setFieldState, setSnackState, isTag) => {
    const fetchSuccess = response => {
        const idMapping = getIDMappingForElement(response.data);
        const menuItems = isTag ? Object.keys(idMapping) : getMenuItemsForDropdown(response.data);
        setFieldState({
            map: idMapping,
            menuEntries: menuItems,
            loaded: true
        });
    };

    const fetchFail = error => {
        console.error(error);
        setFieldState({
            map: {},
            menuEntries: [],
            loaded: true
        });
        displaySnackState(`Failed to retrieve ${API_NAME} data - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
    };
    setFieldState({
        map: {},
        menuEntries: [],
        loaded: false
    });
    fetchEntries(API_NAME, fetchSuccess, fetchFail);
};

const getAndOpenReportsInNewTab = (payload, parentApi, api, setSnackState) => {
    axiosDefault().post(`${process.env.REACT_APP_URL_ROOT}/api/${parentApi}/${api}`,
        payload,
        {responseType: 'blob'}
    )
        .then(response => {
            //Create a Blob from the PDF Stream
            const file = new Blob(
                [response.data],
                {type: 'application/pdf'});
            //Build a URL from the file
            const fileURL = URL.createObjectURL(file);
            //Open the URL on new Window
            const newWindow = window.open(fileURL);
            setTimeout(() => {
                newWindow.document.title = `${api}-${new Date().toLocaleDateString()}`;
            }, 500);
        })
        .catch(error => {
            console.error(error);
            displaySnackState(`Failed to load ${api} list - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
        });
};

const downloadAndOpenExcel = async(payload, parentApi, api, setSnackState) => {
  try {
    const response = await axiosDefault().post(`${process.env.REACT_APP_URL_ROOT}/api/${parentApi}/${api}`,payload, {responseType:'blob'})
    const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileURL = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = fileURL;
    link.setAttribute('download', 'SupplierInvoicesVAT.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error('Error downloading Excel:', error);
     displaySnackState(`Failed to load ${api} list - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
  }
};


const getAndOpenCustomerItemsPrintoutInNewTab = (customerId, setSnackState,type) => {
    axiosDefault().get(`${URL_ROOT}/api/customerItems/printCustomerItems/${customerId}?type=${type}`, {responseType: 'blob'}
    )
        .then(response => {
            //Create a Blob from the PDF Stream
            const file = new Blob(
                [response.data],
                {type: 'application/pdf'});
            //Build a URL from the file
            const fileURL = URL.createObjectURL(file);
            //Open the URL on new Window
            const newWindow = window.open(fileURL);
            setTimeout(() => {
                newWindow.document.title = `Print Customer Items (${type}) -${new Date().toLocaleDateString()}`;
            }, 500);
        })
        .catch(error => {
            console.error(error);
            displaySnackState(`Failed to load customer items printout - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
        });
};

const getAndOpenCustomerGroupItemsPrintoutInNewTab = (customerGroupId, setSnackState) => {
    axiosDefault().get(`${URL_ROOT}/api/customerGroups/printCustomerGroupItems/${customerGroupId}`, {responseType: 'blob'}
    )
        .then(response => {
            //Create a Blob from the PDF Stream
            const file = new Blob(
                [response.data],
                {type: 'application/pdf'});
            //Build a URL from the file
            const fileURL = URL.createObjectURL(file);
            //Open the URL on new Window
            const newWindow = window.open(fileURL);
            setTimeout(() => {
                newWindow.document.title = `Print Customer Group Items-${new Date().toLocaleDateString()}`;
            }, 500);
        })
        .catch(error => {
            console.error(error);
            displaySnackState(`Failed to load customer group items printout - ${error.response ? error.response.data : error.message}`, "error", setSnackState);
        });
};

const getSalesTrackerData = async ({url, setState, setReload, setSearchTerm, setPage, setIsOpen, setSnackState, onSuccess}) => {
    try {
        setReload && setReload(false);
        setSearchTerm && setSearchTerm("");
        setPage && setPage(0);
        setIsOpen && setIsOpen(false);
        const resp = await axiosDefault().get(`${URL_ROOT}/${url}`);
        if(resp.status === 200) {setState && setState(resp.data); onSuccess && onSuccess(resp.data)}else{
            displaySnackState('No data found', "error", setSnackState)
        }
    } catch (error) {
        console.error("Error fetching data ", error);
        displaySnackState(`Failed to load data - ${error.response ? error.response.data : error.message}`,'error', setSnackState);
    }
}

const getInvoiceReportsInNewTab = (invoiceList, api, setSnackState) => {
    const payload = {invoices: invoiceList};
    getAndOpenReportsInNewTab(payload, "invoice", api, setSnackState);
};

const getInvoiceReprintReportsInNewTab = (invoiceList, api, setSnackState) => {
    const payload = {invoices: invoiceList};
    getAndOpenReportsInNewTab(payload, "invoice", api, setSnackState);
};

const getItemReportsInNewTab = (itemsList, api, setSnackState) => {
    const payload = {items: itemsList};
    getAndOpenReportsInNewTab(payload, "inventory", api, setSnackState);
};

const getTotalItemsWeightInGrams = (itemsList) => {
    let totalWeightInGrams = 0;

    itemsList.forEach(item => {
        totalWeightInGrams += ((item.weight_kg * 1000) + item.weight_grams) * item.quantity;
    });

    return totalWeightInGrams;
};

const formatWeightToString = weightAmount => {
    if(weightAmount < 1000) {
        return `${weightAmount}g`;
    } else {
        return `${(weightAmount/1000).toFixed(1)}kg`;
    }
}

const stringValueToNumberComparator = (valueA, valueB) => {
    valueA = +valueA;
    valueB = +valueB;
    return valueA === valueB ? 0 : valueA > valueB ? 1 : -1;
};

const dateStringComparator = (valueA, valueB) => {
    const inputFormat = "DD/MM/YYYY";
    valueA = moment(valueA, inputFormat);
    valueB = moment(valueB, inputFormat);

    return moment().isSame(valueA, valueB) ? 0 : moment().isAfter(valueA, valueB) ? 1 : -1;
}

const defaultInvoiceItemEntry = () => ({
    _id: null,
    name: "",
    quantity: 1,
    rate: 0,
    vat: null,
    key: uuidv4()
});

const momentFormat = "YYYY-MM-DD";

export {
    currentUserHasPermissions,
    defaultColDef,
    defaultLoadedFieldData,
    defaultSnackState,
    daysMap,
    handleInputChange,
    handleNumberInputChange,
    handleCheckboxChange,
    handleCheckboxGroupChange,
    fetchEntries,
    fetchAllEntriesAndSetRowData,
    fetchAllEntriesAndSetRowDataViaPost,
    createCustomerItemsList,
    editCustomerItemsList,
    handleDataSubmit,
    handleDataEditSubmit,
    handleDeleteEntry,
    getTextField,
    getDefaultFormFields,
    getInputFields,
    getGridFormInputFields,
    getCustomerGridFormInputFields,
    getMenuItemsForDropdown,
    getIDMappingForElement,
    getColumnDefs,
    getActionColumnDef,
    fetchDropdownField,
    getAndOpenReportsInNewTab,
    getAndOpenCustomerItemsPrintoutInNewTab,
    getAndOpenCustomerGroupItemsPrintoutInNewTab,
    getInvoiceReportsInNewTab,
    getInvoiceReprintReportsInNewTab,
    getItemReportsInNewTab,
    getTotalItemsWeightInGrams,
    formatWeightToString,
    stringValueToNumberComparator,
    dateStringComparator,
    defaultInvoiceItemEntry,
    downloadAndOpenExcel,
    momentFormat,
    updateFieldsData,
    getSalesTrackerData,
};
