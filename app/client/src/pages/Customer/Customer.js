import React, { useEffect, useState } from 'react';
import Box from "@mui/material/Box";
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import displaySnackState from "../../components/customisedSnackBar/DisplaySnackState";
import CustomisedSnackBar from "../../components/customisedSnackBar/CustomisedSnackBar";
import { LoadingButton } from "../../components/loadingButton/LoadingButton";
import {
    daysMap,
    defaultLoadedFieldData, defaultSnackState,
    fetchAllEntriesAndSetRowData, fetchDropdownField, fetchEntries,
    getActionColumnDef,
    getColumnDefs,
    getDefaultFormFields, handleCheckboxChange,
    handleDataEditSubmit,
    handleDataSubmit,
    handleInputChange,
    currentUserHasPermissions
} from "../../components/formFunctions/FormFunctions";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import { Button, Dialog, Grid, TextField } from "@mui/material";

import { listChipsCellRenderer } from "../../components/cellRenderers/ListChipsCellRenderer";
import BooleanFieldCellRenderer from "../../components/cellRenderers/BooleanFieldCellRenderer";
import { weekdaysCellRenderer } from "../../components/cellRenderers/WeekdaysCellRenderer";
import DataViewGrid from "../../components/DataViewGrid/DataViewGrid";
import { OrderTaking_dayOfWeekFilter } from "../../components/agGridFilters/orderTaking_dayOfWeekFilter";
import DialogClosingTitleBar from "../../components/DialogClosingTitleBar/DialogClosingTitleBar";
import { OTWeekdaysCellRenderer } from "../../components/cellRenderers/OTWeekdaysCellRenderer";
import { tagsFilter } from "../../components/agGridFilters/tagsFilter";
import { DeliveryDays_dayOfWeekFilter } from "../../components/agGridFilters/DeliveryDays_dayOfWeekFilter";
import { CustomerItems } from "./CustomerItems";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import FormGroup from "@mui/material/FormGroup";
import Autocomplete from "@mui/material/Autocomplete";
import FormLabel from "@mui/material/FormLabel";
import FormControl from "@mui/material/FormControl";
import { useForm, Controller } from "react-hook-form";
import DeliveryDayZonePicker from "../../components/DeliveryDayZonePicker/DeliveryDayZonePicker";
import MenuItem from "@mui/material/MenuItem";
import LinkedFieldCellValueGetterRenderer from "../../components/cellRenderers/LinkedFieldCellValueGetterRenderer";
import MapModal from './MapModal';
import TimePicker from '@mui/lab/TimePicker';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import { format } from 'date-fns';
import { Stack } from '@mui/material';
import { useLocation } from 'react-router-dom';
import axiosDefault from '../../components/axiosDefault/axiosDefault';

const API_NAME = '/customer';

export const Customer = () => {
    const axios = axiosDefault();
    const location = useLocation();
    const [sendingData, setSendingData] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [validSelections, setValidSelections] = useState(true);
    const [tagsData, setTagsData] = useState(defaultLoadedFieldData);
    const [salesRepData, setSalesRepData] = useState(defaultLoadedFieldData);
    const [paymentTermsData, setPaymentTermsData] = useState(defaultLoadedFieldData);
    const [zonesData, setZonesData] = useState(defaultLoadedFieldData);
    const [snackState, setSnackState] = useState(defaultSnackState);
    const [rowData, setRowData] = useState([]);
    const [currentTab, setCurrentTab] = React.useState(0);
    const [orderTakingDays, setOrderTakingDays] = useState([]);
    const [paymentTakingDays, setPaymentTakingDays] = useState([]);
    const [selectedZones, setSelectedZones] = useState([null, null, null, null, null, null, null]);
    const [customerTags, setCustomerTags] = useState([]);
    const [paymentTerm, setPaymentTerm] = useState(null);
    const [customerSalesRep, setCustomerSalesRep] = useState(null);
    const [teleCustomerSalesRep, setTeleCustomerSalesRep] = useState(null);
    const [paymentContactMethod, setPaymentContactMethod] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState(null);
    const [mapModalOpen, setMapModalOpen] = useState(false);
    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const { control, handleSubmit, reset, setValue } = useForm({
        defaultValues: {
            legal_entity: "",
            customer_name: "",
            contact_name: "",
            mobile: "",
            phone: "",
            address: "",
            city: "",
            postcode: "",
            email: "",
            sales_rep: customerSalesRep,
            tele_sales_rep: teleCustomerSalesRep,
            active: true,
            on_hold: false,
            shop_keys: false,
            cash_invoice: false,
            print_outstanding_balances: true,
            paymentTerm: paymentTerm,
            paymentContactMethod: paymentContactMethod,
            tags: [],
            comments: "",
            order_taking_days: [],
            payment_taking_days: [],
            payment_contact: "",
            payment_contact_detail: "",
            payment_method: "",
            payment_contact_method: "",
            do_not_call_for_payments: false,
            payment_comments: "",
            zones: selectedZones,
            director_name: "",
            director_address: "",
            company_number: "",
            vat_number: "",
            business_timings: "",
            business_start_hour: "",
            business_close_hour: "",
            latitude: null,
            longitude: null,
        }
    });
    const onSubmit = data => {
        if (validSelections) {
            if (editMode) {
                editCustomer(data);
            } else {
                addCustomer(data);
            }
        } else {
            displaySnackState("Ensure valid selections are made for delivery zones", "warning", setSnackState);
        }
    };

    const disableEditMode = () => {
        setFormValues(defaultFormState);
        setEditMode(false);
        reset(defaultFormState);
    };

    const inputChangeListener = event => {
        handleInputChange(event, formValues, setFormValues)
    };

    const tagsChangeListener = (event, value) => {
        setCustomerTags(value);
    };

    const salesRepChangeListener = (event) => {
        setCustomerSalesRep(event.target.value);
    };

    const checkboxChangeListener = (event) => {
        handleCheckboxChange(event, formValues, setFormValues);
    }

    const paymentTermChangeListener = event => {
        setPaymentTerm(event.target.value);
    };

    const paymentContactMethodChangeListener = event => {
        setPaymentContactMethod(event.target.value);
    };

    const paymentMethodChangeListener = event => {
        setPaymentMethod(event.target.value);
    };

    const multiCheckboxChangeListener = (event, collection, setCollection) => {
        const { checked } = event.target;
        const id = Number(event.target.id);
        let newCheckedState = [...collection];
        if (checked) {
            newCheckedState.push(id);
        } else {
            newCheckedState = newCheckedState.filter(item => item !== id);
        }
        setCollection(newCheckedState);
    }

    const fetchAllItems = () => {
        fetchTags();
        fetchSalesRepData();
        fetchPaymentTermsData();
        fetchZones();
        fetchAllEntriesAndSetRowData(API_NAME, null, setSendingData, setRowData, setSnackState);
    };

    const fetchZones = () => {
        fetchDropdownField("/zone", setZonesData, setSnackState, false);
    };

    const fetchTags = () => {
        fetchDropdownField("/customer-tag", setTagsData, setSnackState, true);
    };

    const fetchSalesRepData = () => {
        fetchDropdownField("/customerSalesRep", setSalesRepData, setSnackState, false);
    };

    const fetchPaymentTermsData = () => {
        fetchDropdownField("/payment-term", setPaymentTermsData, setSnackState, false);
    };

    const fetchCustomerById = async (id) => {
        try {
            const resp = await axios.get(`${process.env.REACT_APP_URL_ROOT}/api/customer/${id}`);
            console.log(resp[0])
            if (resp.status == 200) { return resp.data[0]; } else { displaySnackState(`Failed to saved, Try Again`, "error", setSnackState); }
        } catch (error) {
            console.log(error)
        }
    }

    const postDataSuccessfulSubmit = () => {
        fetchAllItems();
        reset(defaultFormState);
    };

    const finaliseData = data => {
        return {
            ...data,
            tags: customerTags,
            order_taking_days: orderTakingDays,
            payment_taking_days: paymentTakingDays,
            zones: selectedZones,
            payment_term: paymentTerm,
            payment_contact_method: paymentContactMethod,
            payment_method: paymentMethod,
            sales_rep: customerSalesRep,
            tele_sales_rep: teleCustomerSalesRep,
        };
    };

    const addCustomer = data => {
        const dataToSend = finaliseData(data);
        handleDataSubmit(API_NAME, null, setSendingData, dataToSend, () => { }, null, setSnackState, postDataSuccessfulSubmit);
    };

    const editCustomer = data => {
        const dataToSend = finaliseData(data);
        handleDataEditSubmit(API_NAME, null, setSendingData, setEditMode, dataToSend, () => { }, null, setSnackState, postDataSuccessfulSubmit);
    };

    const handleOpenDialog = () => {
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setEditMode(false);
        setDialogOpen(false);
        setCurrentTab(0);
        setFormValues(defaultFormState);
    };

    const deliveryZoneDaysChangeListener = (newZones) => {
        setSelectedZones(newZones)
    };

    const TabPanel = (props) => {
        const { children, value, index } = props;

        return (
            <div hidden={value !== index}>
                {value === index && children}
            </div>
        );
    };

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    useEffect(() => {
        fetchAllItems();
    }, []);

    useEffect(() => {
        if (editMode) {
            reset(formValues);
            setDialogOpen(true);
        } else {
            reset(defaultFormState);
            setDialogOpen(false);
        }
        setCustomerTags(formValues.tags);
        setOrderTakingDays(formValues.order_taking_days);
        setPaymentTakingDays(formValues.payment_taking_days);
        setSelectedZones(formValues.zones);
        setPaymentTerm(formValues.payment_term);
        setPaymentContactMethod(formValues.payment_contact_method);
        setPaymentMethod(formValues.payment_method);
        setCustomerSalesRep(formValues.sales_rep);
        setTeleCustomerSalesRep(formValues.tele_sales_rep);
        setLatitude(formValues.latitude || null)
        setLongitude(formValues.longitude || null)
    }, [editMode]);

    const customerData = [
        {
            field: "legal_entity",
            label: "Legal Entity",
            type: "textfield",
            columnOrder: 0,
            changeListener: inputChangeListener,
            textFieldProps: {
                required: false,
                type: "text",
                autoFocus: true
            }
        },
        {
            field: "customer_name",
            label: "Customer Name",
            type: "textfield",
            columnOrder: 1,
            changeListener: inputChangeListener,
            textFieldProps: {
                required: true,
                type: "text",
                autoFocus: true
            }
        },
        {
            field: "contact_name",
            label: "Contact Name",
            type: "textfield",
            columnOrder: 2,
            changeListener: inputChangeListener,
            textFieldProps: {
                type: "text"
            }
        },
        {
            field: "mobile",
            label: "Mobile",
            type: "textfield",
            columnOrder: 3,
            changeListener: inputChangeListener,
            textFieldProps: {
                type: "tel"
            }
        },
        {
            field: "phone",
            label: "Landline Number",
            type: "textfield",
            columnOrder: 4,
            changeListener: inputChangeListener,
            textFieldProps: {
                type: "tel"
            }
        },
        {
            field: "address",
            label: "Address",
            type: "textfield",
            columnOrder: 10,
            changeListener: inputChangeListener,
            gridProps: {
                hide: true
            },
            textFieldProps: {
                type: "text"
            }
        },
        {
            field: "city",
            label: "City",
            type: "textfield",
            columnOrder: 13,
            changeListener: inputChangeListener,
            gridProps: {
                hide: true
            },
            textFieldProps: {
                type: "text"
            }
        },
        {
            field: "postcode",
            label: "Postcode",
            type: "textfield",
            columnOrder: 14,
            changeListener: inputChangeListener,
            gridProps: {
                hide: true
            },
            textFieldProps: {
                type: "text"
            }
        },
        {
            field: "email",
            label: "Email",
            type: "textfield",
            columnOrder: 5,
            changeListener: inputChangeListener,
            textFieldProps: {
                type: "email"
            },
            gridProps: {
                hide: true
            }
        },
        {
            field: "sales_rep",
            label: "Sales Rep",
            type: "dropdown",
            columnOrder: 6,
            dropdownOptions: salesRepData,
            defaultState: "",
            changeListener: inputChangeListener,
            textFieldProps: {
                type: "text"
            },
            gridProps: {
                valueGetter: props => LinkedFieldCellValueGetterRenderer({
                    ...props,
                    idMapping: salesRepData.map,
                    mappedFieldName: "name",
                    mappingDataLoaded: salesRepData.loaded
                })
            }
        },
        {
            field: "active",
            label: "Active",
            type: "checkbox",
            columnOrder: 7,
            defaultState: true,
            changeListener: checkboxChangeListener,
            gridProps: {
                cellRenderer: BooleanFieldCellRenderer
            }
        },
        {
            field: "on_hold",
            label: "On HOLD",
            type: "checkbox",
            columnOrder: 8,
            defaultState: false,
            changeListener: checkboxChangeListener,
            gridProps: {
                cellRenderer: BooleanFieldCellRenderer
            }
        },
        {
            field: "shop_keys",
            label: "Shop Keys",
            type: "checkbox",
            columnOrder: 9,
            defaultState: false,
            changeListener: checkboxChangeListener,
            gridProps: {
                cellRenderer: BooleanFieldCellRenderer
            }
        },
        {
            field: "cash_invoice",
            label: "Cash Invoice",
            type: "checkbox",
            columnOrder: 11,
            defaultState: false,
            changeListener: checkboxChangeListener,
            gridProps: {
                cellRenderer: BooleanFieldCellRenderer
            }
        },
        {
            field: "print_outstanding_balances",
            label: "Print Outstanding Balances",
            type: "checkbox",
            columnOrder: 12,
            defaultState: true,
            changeListener: checkboxChangeListener,
            gridProps: {
                cellRenderer: BooleanFieldCellRenderer
            }
        },
        {
            field: "tags",
            label: "Tag(s)",
            type: "chips_dropdown",
            columnOrder: 22,
            dropdownOptions: tagsData,
            dropdownNameField: "name",
            defaultState: [],
            changeListener: tagsChangeListener,
            textFieldProps: {
                type: "text"
            },
            gridProps: {
                cellRenderer: listChipsCellRenderer,
                cellRendererParams: {
                    idMapping: tagsData.map,
                    mappingDataLoaded: tagsData.loaded,
                    nameField: "name"
                },
                filter: tagsFilter,
                filterParams: {
                    columnName: "tags",
                    tagsList: tagsData
                }
            }
        },
        {
            field: "comments",
            label: "Comments",
            type: "textfield",
            columnOrder: 23,
            changeListener: inputChangeListener,
            gridProps: {
                hide: true
            },
            textFieldProps: {
                type: "text"
            }
        },
        {
            field: "order_taking_days",
            label: "Order Taking Days",
            type: "checkbox_multi",
            columnOrder: 15,
            defaultState: [],
            changeListener: multiCheckboxChangeListener,
            formProps: {
                key: "order_taking_days"
            },
            checkboxProps: {
                optionLabels: daysMap
            },
            gridProps: {
                cellRenderer: OTWeekdaysCellRenderer,
                filter: OrderTaking_dayOfWeekFilter,
                filterParams: {
                    columnName: "order_taking_days"
                }
            }
        },
        {
            field: "payment_taking_days",
            label: "Payment Taking Days",
            type: "checkbox_multi",
            columnOrder: 16,
            defaultState: [],
            changeListener: multiCheckboxChangeListener,
            formProps: {
                key: "payment_taking_days"
            },
            checkboxProps: {
                optionLabels: daysMap
            },
            gridProps: {
                cellRenderer: OTWeekdaysCellRenderer,
                filter: OrderTaking_dayOfWeekFilter,
                filterParams: {
                    columnName: "payment_taking_days"
                }
            }
        },
        {
            field: "payment_contact_name",
            label: "Payment Contact Name",
            type: "textfield",
            columnOrder: 18,
            changeListener: inputChangeListener,
            textFieldProps: {
                required: true,
                type: "text",
                autoFocus: true
            }
        },
        {
            field: "payment_contact_detail",
            label: "Payment Contact Phone/Email",
            type: "textfield",
            columnOrder: 19,
            changeListener: inputChangeListener,
            textFieldProps: {
                required: true,
                type: "text",
                autoFocus: true
            }
        },
        {
            field: "payment_method",
            label: "Payment Method",
            type: "textfield",
            columnOrder: 17,
            changeListener: inputChangeListener,
            textFieldProps: {
                type: "text"
            }
        },
        {
            field: "do_not_call_for_payments",
            label: "DO NOT CALL FOR PAYMENTS",
            type: "checkbox",
            columnOrder: 20,
            defaultState: false,
            changeListener: checkboxChangeListener,
            gridProps: {
                cellRenderer: BooleanFieldCellRenderer
            }
        },
        {
            field: "payment_comments",
            label: "Payment Comments",
            type: "textfield",
            columnOrder: 24,
            changeListener: inputChangeListener,
            gridProps: {
                hide: true
            },
            textFieldProps: {
                type: "text"
            }
        },
        {
            field: "zones",
            label: "Zones",
            type: "delivery_day_section_picker",
            columnOrder: 21,
            defaultState: [null, null, null, null, null, null, null],
            changeListener: deliveryZoneDaysChangeListener,
            pickerProps: {
                zonesData: zonesData
            },
            gridProps: {
                cellRenderer: weekdaysCellRenderer,
                filter: DeliveryDays_dayOfWeekFilter,
                filterParams: {
                    columnName: "zones"
                }
            }
        },
        {
            field: "director_name",
            label: "Director Name",
            type: "textfield",
            columnOrder: 25,
            changeListener: inputChangeListener,
            textFieldProps: {
                type: "text",
                autoFocus: true
            }
        },
        {
            field: "director_address",
            label: "Director Address",
            type: "textfield",
            columnOrder: 26,
            changeListener: inputChangeListener,
            textFieldProps: {
                type: "text",
                autoFocus: true
            }
        },
        {
            field: "company_number",
            label: "Company Number",
            type: "textfield",
            columnOrder: 27,
            changeListener: inputChangeListener,
            textFieldProps: {
                type: "text",
                autoFocus: true
            }
        },
        {
            field: "vat_number",
            label: "VAT Number",
            type: "textfield",
            columnOrder: 28,
            changeListener: inputChangeListener,
            textFieldProps: {
                type: "text",
                autoFocus: true
            }
        },
        {
            field: "business_timings",
            label: "Business_Timings",
            type: "textfield",
            columnOrder: 29,
            changeListener: inputChangeListener,
            textFieldProps: {
                type: "text",
                autoFocus: true
            }
        },
    ];
    const requiredWritePermissions = [process.env.REACT_APP_WRITE_CUSTOMERS_CLAIM];
    const requiredPaymentTermsPermissions = [process.env.REACT_APP_WRITE_CUSTOMER_PAYMENT_TERM];
    const requiredCustomerHoldFlagPermissions = [process.env.REACT_APP_WRITE_CUSTOMER_HOLD_FLAG];
    const requiredCustomerPrintOutstandingBalancesPermissions = [process.env.REACT_APP_WRITE_CUSTOMER_PRINT_OUTSTANDING_BALANCES];
    const requiredWriteSalesRepPermissions = [process.env.REACT_APP_WRITE_CUSTOMER_SALES_REP_PERMISSION];
    const requiredWriteShopKeysPermissions = [process.env.REACT_APP_WRITE_CUSTOMER_SHOP_KEYS_PERMISSION];
    const defaultFormState = { ...getDefaultFormFields(customerData), latitude: null, longitude: null };
    const [formValues, setFormValues] = useState(defaultFormState);
    const colDefs = [getActionColumnDef(setEditMode, setFormValues, API_NAME, displaySnackState, setSnackState, setSendingData, fetchAllItems, true, requiredWritePermissions, null), ...getColumnDefs(customerData)];

    const handleOpenMapModal = () => setMapModalOpen(true);
    const handleCloseMapModal = () => setMapModalOpen(false);
    useEffect(() => {
        if (location.state?.openDialog) {
            setDialogOpen(true);
            const updatedValues = {
                ...defaultFormState,
                customer_name: location.state?.customer_name || "",
                contact_name: location.state?.contact_name || "",
                email: location.state?.email || "",
                mobile: location.state?.phone || "",
                address: location.state?.address || '',
                city: location.state?.city || "",
                postcode: location.state?.postcode || "",
            };
            reset(updatedValues);
            setFormValues(updatedValues);
            setTeleCustomerSalesRep(location.state?.telesalesRep?._id || null);
        } else if (location.state?.id) {
            setDialogOpen(true);
            fetchCustomerById(location.state.id).then(customerData => {
                const updatedCustomer = { ...customerData, tele_sales_rep: location.state?.telesalesRep?._id || customerData.tele_sales_rep }
                setFormValues(updatedCustomer);
                reset(updatedCustomer);
                setEditMode(true);
            });
        }
    }, [location.state]);
    const handleMapSave = (lat, lng) => {
        setValue('latitude', lat, { shouldValidate: true });
        setValue('longitude', lng, { shouldValidate: true });
        setLatitude(lat);
        setLongitude(lng);
        handleCloseMapModal();
    };
    return <div style={{ height: "90%" }}>
        <CustomisedSnackBar {...snackState} setClosed={setSnackState} />
        <Dialog open={dialogOpen} fullScreen>
            <DialogClosingTitleBar title={`${editMode ? "EDIT" : "ADD"} CUSTOMER`} handleClose={handleCloseDialog} />
            <Box sx={{ width: '100%' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex' }}>
                    <Tabs value={currentTab} onChange={handleTabChange} >
                        <Tab label="Details" />
                        <Tab label={`Items${!editMode ? "(available after saving)" : ""}`} disabled={!editMode} />
                    </Tabs>
                    <Typography align={"center"} variant={"h4"} textOverflow='center' sx={{ flex: 1, textAlign: 'center' }}>{formValues.customer_name}</Typography>
                </Box>
                <TabPanel value={currentTab} index={0}>
                    <div>
                        <Card>
                            <CardContent>
                                <form onSubmit={handleSubmit(data => { return onSubmit(data, reset) })}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6} md={2}>
                                            <TextField label={"Sales Rep"}
                                                name={"sales_rep"}
                                                value={customerSalesRep}
                                                variant="outlined"
                                                autoComplete="off"
                                                onChange={salesRepChangeListener}
                                                select
                                                fullWidth
                                                disabled={!currentUserHasPermissions(requiredWriteSalesRepPermissions)}
                                            >
                                                {
                                                    salesRepData.loaded ?
                                                        salesRepData.menuEntries
                                                        :
                                                        <MenuItem value="" disabled>Loading, please wait...</MenuItem>
                                                }
                                            </TextField>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={2}>
                                            <TextField label={"Tele Sales Rep"}
                                                name={"tele_sales_rep"}
                                                value={teleCustomerSalesRep}
                                                variant="outlined"
                                                autoComplete="off"
                                                onChange={(e) => setTeleCustomerSalesRep(e.target.value)}
                                                select
                                                fullWidth
                                                disabled={!currentUserHasPermissions(requiredWriteSalesRepPermissions)}
                                            >
                                                {
                                                    salesRepData.loaded ?
                                                        salesRepData.menuEntries
                                                        :
                                                        <MenuItem value="" disabled>Loading, please wait...</MenuItem>
                                                }
                                            </TextField>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={1}>
                                            <Controller
                                                name="active"
                                                control={control}
                                                render={({ field }) => (
                                                    <FormGroup>
                                                        <FormControlLabel
                                                            control={
                                                                <Checkbox
                                                                    name={"active"}
                                                                    onChange={(e) => field.onChange(e.target.checked)}
                                                                    checked={field.value}
                                                                />
                                                            }
                                                            label={"Active"} />
                                                    </FormGroup>
                                                )}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={1}>
                                            <Controller
                                                name="on_hold"
                                                control={control}
                                                render={({ field }) => (
                                                    <FormGroup>
                                                        <FormControlLabel
                                                            control={
                                                                <Checkbox
                                                                    name={"on_hold"}
                                                                    onChange={(e) => field.onChange(e.target.checked)}
                                                                    checked={field.value}
                                                                    disabled={!currentUserHasPermissions(requiredCustomerHoldFlagPermissions)}
                                                                />
                                                            }
                                                            label={"On HOLD"} />
                                                    </FormGroup>
                                                )}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={1}>
                                            <Controller
                                                name="shop_keys"
                                                control={control}
                                                render={({ field }) => (
                                                    <FormGroup>
                                                        <FormControlLabel
                                                            control={
                                                                <Checkbox
                                                                    name={"shop_keys"}
                                                                    onChange={(e) => field.onChange(e.target.checked)}
                                                                    checked={field.value}
                                                                    disabled={!currentUserHasPermissions(requiredWriteShopKeysPermissions)}
                                                                />
                                                            }
                                                            label={"Shop Keys"} />
                                                    </FormGroup>
                                                )}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={1}>
                                            <Controller
                                                name="cash_invoice"
                                                control={control}
                                                render={({ field }) => (
                                                    <FormGroup>
                                                        <FormControlLabel
                                                            control={
                                                                <Checkbox
                                                                    name={"cash_invoice"}
                                                                    onChange={(e) => {
                                                                        field.onChange(e.target.checked);
                                                                    }}
                                                                    checked={field.value}
                                                                />
                                                            }
                                                            label={"Cash Invoice"} />
                                                    </FormGroup>
                                                )}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={2}>
                                            <Controller
                                                name="print_outstanding_balances"
                                                control={control}
                                                render={({ field }) => (
                                                    <FormGroup>
                                                        <FormControlLabel
                                                            control={
                                                                <Checkbox
                                                                    name={"print_outstanding_balances"}
                                                                    onChange={(e) => {
                                                                        field.onChange(e.target.checked);
                                                                    }}
                                                                    checked={field.value}
                                                                    disabled={!currentUserHasPermissions(requiredCustomerPrintOutstandingBalancesPermissions)}
                                                                />
                                                            }
                                                            label={"Print Outstanding Balances"} />
                                                    </FormGroup>
                                                )}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={2}>
                                            <Controller
                                                name="do_not_call_for_payments"
                                                control={control}
                                                render={({ field }) => (
                                                    <FormGroup>
                                                        <FormControlLabel
                                                            control={
                                                                <Checkbox
                                                                    name={"do_not_call_for_payments"}
                                                                    onChange={(e) => field.onChange(e.target.checked)}
                                                                    checked={field.value}
                                                                    disabled={!currentUserHasPermissions(requiredPaymentTermsPermissions)}
                                                                />
                                                            }
                                                            label={"DO NOT CALL FOR PAYMENTS"} />
                                                    </FormGroup>
                                                )}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Controller
                                                render={({ field }) =>
                                                    <TextField
                                                        {...field}
                                                        label={"Legal Entity"}
                                                        name={"legal_entity"}
                                                        variant="outlined"
                                                        autoComplete="off"
                                                        fullWidth
                                                        type={"text"}
                                                        autoFocus={true}
                                                        required={false}
                                                    />
                                                }
                                                name="legal_entity"
                                                control={control}
                                            />
                                        </Grid>

                                        <Grid item xs={12} sm={6} md={3}>
                                            <Controller
                                                render={({ field }) =>
                                                    <TextField
                                                        {...field}
                                                        label={"Customer Name"}
                                                        name={"customer_name"}
                                                        variant="outlined"
                                                        autoComplete="off"
                                                        fullWidth
                                                        type={"text"}
                                                        autoFocus={true}
                                                        required={true}
                                                    />
                                                }
                                                name="customer_name"
                                                control={control}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Controller
                                                render={({ field }) =>
                                                    <TextField
                                                        {...field}
                                                        label={"Mobile"}
                                                        name={"mobile"}
                                                        variant="outlined"
                                                        autoComplete="off"
                                                        fullWidth
                                                        required={true}
                                                        type={"tel"}
                                                    />
                                                }
                                                name="mobile"
                                                control={control}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <TextField label={"Payment Term"}
                                                name={"payment_term"}
                                                value={paymentTerm}
                                                variant="outlined"
                                                autoComplete="off"
                                                onChange={paymentTermChangeListener}
                                                select
                                                fullWidth
                                                required
                                                disabled={!currentUserHasPermissions(requiredPaymentTermsPermissions)}
                                            >
                                                {
                                                    paymentTermsData.loaded ?
                                                        paymentTermsData.menuEntries
                                                        :
                                                        <MenuItem value="" disabled>Loading, please wait...</MenuItem>
                                                }
                                            </TextField>
                                        </Grid>

                                        <Grid item xs={12} sm={6} md={3}>
                                            <Controller
                                                render={({ field }) =>
                                                    <TextField
                                                        {...field}
                                                        label={"Director Name"}
                                                        name={"director_name"}
                                                        variant="outlined"
                                                        autoComplete="off"
                                                        fullWidth
                                                        type={"text"}
                                                    />
                                                }
                                                name="director_name"
                                                control={control}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Controller
                                                render={({ field }) =>
                                                    <TextField
                                                        {...field}
                                                        label={"Contact Name"}
                                                        name={"contact_name"}
                                                        variant="outlined"
                                                        autoComplete="off"
                                                        fullWidth
                                                        type={"text"}
                                                    />
                                                }
                                                name="contact_name"
                                                control={control}
                                            />

                                        </Grid>

                                        <Grid item xs={12} sm={6} md={3}>
                                            <Controller
                                                render={({ field }) =>
                                                    <TextField
                                                        {...field}
                                                        label={"Landline Number"}
                                                        name={"phone"}
                                                        variant="outlined"
                                                        autoComplete="off"
                                                        fullWidth
                                                        type={"tel"}
                                                    />
                                                }
                                                name="phone"
                                                control={control}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <TextField label={"Payment Method"}
                                                name={"payment_method"}
                                                value={paymentMethod}
                                                variant="outlined"
                                                autoComplete="off"
                                                onChange={paymentMethodChangeListener}
                                                select
                                                fullWidth
                                                disabled={!currentUserHasPermissions(requiredPaymentTermsPermissions)}
                                            >
                                                <MenuItem value={"Card"} key={"Card"}>Card</MenuItem>,
                                                <MenuItem value={"Cash"} key={"Cash"}>Cash</MenuItem>,
                                                <MenuItem value={"BACS"} key={"BACS"}>BACS</MenuItem>
                                            </TextField>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Controller
                                                render={({ field }) =>
                                                    <TextField
                                                        {...field}
                                                        label={"Director Address"}
                                                        name={"director_address"}
                                                        variant="outlined"
                                                        autoComplete="off"
                                                        fullWidth
                                                        type={"text"}
                                                    />
                                                }
                                                name="director_address"
                                                control={control}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Controller
                                                render={({ field }) =>
                                                    <TextField
                                                        {...field}
                                                        label={"Address"}
                                                        name={"address"}
                                                        variant="outlined"
                                                        autoComplete="off"
                                                        fullWidth
                                                        required={true}
                                                        type={"text"}
                                                    />}
                                                name="address"
                                                control={control}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Controller
                                                render={({ field }) =>
                                                    <TextField
                                                        {...field}
                                                        label={"Email"}
                                                        name={"email"}
                                                        variant="outlined"
                                                        autoComplete="off"
                                                        fullWidth
                                                        required={true}
                                                        type={"email"}
                                                    />}
                                                name="email"
                                                control={control}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Controller
                                                render={({ field }) =>
                                                    <TextField
                                                        {...field}
                                                        label={"Payment Contact Name"}
                                                        name={"payment_contact_name"}
                                                        variant="outlined"
                                                        autoComplete="off"
                                                        fullWidth
                                                        type={"text"}
                                                        disabled={!currentUserHasPermissions(requiredPaymentTermsPermissions)}
                                                    />
                                                }
                                                name="payment_contact_name"
                                                control={control}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Controller
                                                render={({ field }) =>
                                                    <TextField
                                                        {...field}
                                                        label={"Company Number"}
                                                        name={"company_number"}
                                                        variant="outlined"
                                                        autoComplete="off"
                                                        fullWidth
                                                        type={"text"}
                                                    />
                                                }
                                                name="company_number"
                                                control={control}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Controller
                                                render={({ field }) =>
                                                    <TextField
                                                        {...field}
                                                        label={"City"}
                                                        name={"city"}
                                                        variant="outlined"
                                                        autoComplete="off"
                                                        fullWidth
                                                        required={true}
                                                        type={"text"}
                                                    />}
                                                name="city"
                                                control={control}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Controller
                                                render={({ field }) =>
                                                    <TextField
                                                        {...field}
                                                        label={"Business Timings"}
                                                        name={"business_timings"}
                                                        variant="outlined"
                                                        autoComplete="off"
                                                        fullWidth
                                                        type={"text"}
                                                    />
                                                }
                                                name="business_timings"
                                                control={control}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <TextField label={"Payment Contact Method"}
                                                name={"payment_contact_method"}
                                                value={paymentContactMethod}
                                                variant="outlined"
                                                autoComplete="off"
                                                onChange={paymentContactMethodChangeListener}
                                                select
                                                fullWidth
                                                disabled={!currentUserHasPermissions(requiredPaymentTermsPermissions)}
                                            >
                                                <MenuItem value="Call">Call</MenuItem>
                                                <MenuItem value="Whatsapp">Whatsapp</MenuItem>
                                                <MenuItem value="Email">Email</MenuItem>
                                            </TextField>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Controller
                                                render={({ field }) =>
                                                    <TextField
                                                        {...field}
                                                        label={"VAT Number"}
                                                        name={"vat_number"}
                                                        variant="outlined"
                                                        autoComplete="off"
                                                        fullWidth
                                                        type={"text"}
                                                    />
                                                }
                                                name="vat_number"
                                                control={control}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Controller
                                                render={({ field }) =>
                                                    <TextField
                                                        {...field}
                                                        label={"Postcode"}
                                                        name={"postcode"}
                                                        variant="outlined"
                                                        autoComplete="off"
                                                        fullWidth
                                                        required={true}
                                                        type={"text"}
                                                    />}
                                                name="postcode"
                                                control={control}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Autocomplete
                                                multiple
                                                options={tagsData.menuEntries}
                                                defaultValue={customerTags}
                                                onChange={tagsChangeListener}
                                                loading={!tagsData.loaded}
                                                disableCloseOnSelect
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        variant="standard"
                                                        label="Tag(s)"
                                                    />
                                                )}
                                                getOptionLabel={option => tagsData.map[option]?.name}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Controller
                                                render={({ field }) =>
                                                    <TextField
                                                        {...field}
                                                        label={"Payment Contact Phone/Email"}
                                                        name={"payment_contact_detail"}
                                                        variant="outlined"
                                                        autoComplete="off"
                                                        fullWidth
                                                        type={"text"}
                                                        disabled={!currentUserHasPermissions(requiredPaymentTermsPermissions)}
                                                    />
                                                }
                                                name="payment_contact_detail"
                                                control={control}
                                            />
                                        </Grid>
                                        <Grid mt={2} mb={2} ml={2}>

                                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                                <Grid container spacing={2}>
                                                    {days.map((day, index) => (
                                                        <Grid item xs={12} sm={6} md={1.7} key={day}>
                                                            <Typography variant="subtitle2" mb={1}>{day}</Typography>
                                                            <Stack spacing={1}>
                                                                <Controller
                                                                    name={`business_start_hour[${index}]`}
                                                                    control={control}
                                                                    defaultValue={formValues.business_start_hour?.[index] || '15:00'}
                                                                    render={({ field: { onChange, value } }) => (
                                                                        <TimePicker
                                                                            label="Start Time"
                                                                            value={value ? new Date(`1970-01-01T${value}:00`) : null}
                                                                            onChange={(newValue) => {
                                                                                if (newValue instanceof Date && !isNaN(newValue)) {
                                                                                    onChange(format(newValue, 'HH:mm'));
                                                                                } else {
                                                                                    onChange('00:00');
                                                                                }
                                                                            }}
                                                                            minutesStep={1}
                                                                            renderInput={(params) => <TextField {...params} fullWidth />}
                                                                        />
                                                                    )}
                                                                />
                                                                <Controller
                                                                    name={`business_close_hour[${index}]`}
                                                                    control={control}
                                                                    defaultValue={formValues.business_close_hour?.[index] || '22:00'}
                                                                    render={({ field: { onChange, value } }) => (
                                                                        <TimePicker
                                                                            label="End Time"
                                                                            value={value ? new Date(`1970-01-01T${value}:00`) : null}
                                                                            onChange={(newValue) => {
                                                                                if (newValue instanceof Date && !isNaN(newValue)) {
                                                                                    onChange(format(newValue, 'HH:mm'));
                                                                                } else {
                                                                                    onChange('00:00');
                                                                                }
                                                                            }}
                                                                            minutesStep={1}
                                                                            renderInput={(params) => <TextField {...params} fullWidth />}
                                                                        />
                                                                    )}
                                                                />
                                                            </Stack>
                                                        </Grid>
                                                    ))}
                                                </Grid>
                                            </LocalizationProvider>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Grid item xs={12}>
                                                <div style={{ height: "350px" }} key={"delivery_day_zone_picker"}>
                                                    <span>Delivery Day Zones</span>
                                                    <DeliveryDayZonePicker zonesData={zonesData}
                                                        existingZoneSelection={selectedZones}
                                                        zoneChange={deliveryZoneDaysChangeListener}
                                                    />
                                                </div>
                                            </Grid>
                                            <Grid xs={12} container sx={{mt:"40px"}} spacing={2}>
                                                {/* <Grid item xs={12} sm={3}>
                                                    <Button variant='contained' onClick={handleOpenMapModal}>ADD MAP LOCATION</Button>
                                                </Grid> */}
                                                {/* <Grid item xs={12} sm={6} md={3} >
                                                    <Controller
                                                        name="latitude"
                                                        control={control}
                                                        rules={{ required: "Latitude is required" }}
                                                        render={({ field, fieldState }) => (
                                                            <TextField
                                                                {...field}
                                                                label="Latitude"
                                                                disabled
                                                                error={!!fieldState.error}
                                                                helperText={fieldState.error?.message}
                                                                fullWidth
                                                            />
                                                        )}
                                                    />
                                                </Grid> */}
                                                {/* <Grid item xs={12} sm={3}>
                                                    <Controller
                                                        name="longitude"
                                                        control={control}
                                                        rules={{ required: "Longitude is required" }}
                                                        render={({ field, fieldState }) => (
                                                            <TextField
                                                                {...field}
                                                                label="Longitude"
                                                                disabled
                                                                error={!!fieldState.error}
                                                                helperText={fieldState.error?.message}
                                                                fullWidth
                                                            />
                                                        )}
                                                    />
                                                </Grid> */}
                                            </Grid>
                                        </Grid>

                                        <Grid container xs={12} sm={6} sx={{ paddingTop: "10px", paddingLeft: "16px" }}>
                                            <Grid item xs={12}>
                                                <FormControl component="fieldset" variant="standard" key={"order_taking_days"}>
                                                    <FormLabel component="legend">{"Order Taking Days"}</FormLabel>
                                                    <FormGroup row>
                                                        {
                                                            daysMap.map((value, index) => {
                                                                return <FormControlLabel control={<Checkbox checked={orderTakingDays.includes(index)} name={"order_taking_days"} id={index} />} label={value} onChange={event => multiCheckboxChangeListener(event, orderTakingDays, setOrderTakingDays)} />
                                                            })
                                                        }
                                                    </FormGroup>
                                                </FormControl>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Controller
                                                    render={({ field }) =>
                                                        <TextField
                                                            {...field}
                                                            label={"Comments"}
                                                            name={"comments"}
                                                            variant="outlined"
                                                            autoComplete="off"
                                                            fullWidth
                                                            multiline
                                                            rows={2}
                                                            type={"text"}
                                                        />}
                                                    name="comments"
                                                    control={control}
                                                />
                                            </Grid>
                                            <Grid item xs={12}>
                                                <FormControl component="fieldset" variant="standard" key={"payment_taking_days"}>
                                                    <FormLabel component="legend">{"Payment Taking Days"}</FormLabel>
                                                    <FormGroup row>
                                                        {
                                                            daysMap.map((value, index) => {
                                                                return <FormControlLabel control={<Checkbox checked={paymentTakingDays.includes(index)} name={"payment_taking_days"} id={index} disabled={!currentUserHasPermissions(requiredPaymentTermsPermissions)} />} label={value} onChange={event => multiCheckboxChangeListener(event, paymentTakingDays, setPaymentTakingDays)} />
                                                            })
                                                        }
                                                    </FormGroup>
                                                </FormControl>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Controller
                                                    render={({ field }) =>
                                                        <TextField
                                                            {...field}
                                                            label={"Payment Comments"}
                                                            name={"payment_comments"}
                                                            variant="outlined"
                                                            autoComplete="off"
                                                            fullWidth
                                                            multiline
                                                            rows={2}
                                                            type={"text"}
                                                            disabled={!currentUserHasPermissions(requiredPaymentTermsPermissions)}
                                                        />}
                                                    name="payment_comments"
                                                    control={control}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sx={{ marginTop: "8px" }}>
                                                <LoadingButton loading={sendingData} icon={editMode ? <EditIcon /> : <AddIcon />} buttonLabel={`${editMode ? "EDIT" : "ADD"} CUSTOMER`} disabled={sendingData} />
                                                {editMode ? <Button sx={{ marginLeft: "10px" }} variant="contained" color="error" onClick={disableEditMode} >CANCEL</Button> : ""}
                                            </Grid>

                                        </Grid>
                                    </Grid>

                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </TabPanel>
                <TabPanel value={currentTab} index={1}>
                    <CustomerItems loading={true} selectedCustomerData={formValues} />
                </TabPanel>
            </Box>
        </Dialog>
        <Button variant="contained" onClick={handleOpenDialog} style={{ marginRight: "1em" }} disabled={!currentUserHasPermissions(requiredWritePermissions)}>Add Customer</Button>
        <Button variant="contained" onClick={fetchAllItems}>Reload</Button>
        <DataViewGrid rowData={rowData} columnDefs={colDefs} loading={sendingData} />
        {/* {mapModalOpen && <MapModal handleCloseMapModal={handleCloseMapModal} mapModalOpen={mapModalOpen} onSave={handleMapSave} latitude={latitude || '55.84869'} longitude={longitude || '-4.21531'} />} */}
    </div>
};