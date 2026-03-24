import React, {useState} from "react";
import Modal from '@mui/material/Modal';
import Box from "@mui/material/Box";
import {
    defaultSnackState, getColumnDefs,
    getDefaultFormFields, getGridFormInputFields,
    getInputFields, handleDataEditSubmit,
    handleInputChange, stringValueToNumberComparator
} from "../formFunctions/FormFunctions";
import {Button, TextField} from "@mui/material";
import DataViewGrid from "../DataViewGrid/DataViewGrid";
import {LoadingButton} from "../loadingButton/LoadingButton";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import CustomisedSnackBar from "../customisedSnackBar/CustomisedSnackBar";
import {PaymentActionCellRenderer} from "../cellRenderers/PaymentActionCellRenderer";
import {PriceCellRenderer} from "../cellRenderers/PriceCellRenderer";
import { DateCellRenderer } from "../cellRenderers/DateCellRenderer";
import MenuItem from "@mui/material/MenuItem";
import {useAuth0} from "@auth0/auth0-react";

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: "70%",
    height: "70%",
    bgcolor: 'background.paper',
    border: '2px solid blue',
    boxShadow: 24,
    p: 4,
};

const API_NAME = "/supplier-invoices/recordPayments"

const SupplierPaymentsForm = props => {
    const {user} = useAuth0();
    const [sendingData, setSendingData] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [snackState, setSnackState] = useState(defaultSnackState);

    const disableEditMode = () => {
        setFormValues(defaultFormState);
        setEditMode(false);
    };

    const handleDateChange = (newDate, fieldName) => {
        setFormValues({
            ...formValues,
            [fieldName]: newDate,
        });
    };

    const submitCallback = () => {
        props.postSubmitCallback();
        setTimeout(() => {
            setSnackState(defaultSnackState);
            props.handleClose();
        }, 1000);
    }

    const handleSubmit = event => {
        let dataToSubmit = {...(props.data)};
        dataToSubmit.payments = [...(props.data.payments), formValues];
        handleDataEditSubmit(API_NAME, event, setSendingData, setEditMode, dataToSubmit, setFormValues, defaultFormState, setSnackState, submitCallback);
    };

    const handleEditSubmit = event => {
        let dataToSubmit = {...(props.data)};
        let updatedPayments = props.data.payments.filter(payment => payment._id !== formValues._id);
        dataToSubmit.payments = [...updatedPayments, formValues];
        handleDataEditSubmit(API_NAME, event, setSendingData, setEditMode, dataToSubmit, setFormValues, defaultFormState, setSnackState, submitCallback);
    };

    const handleDeleteSubmit = id => {
        let dataToSubmit = {...(props.data)};
        const newPayments = props.data.payments.filter(payment => payment._id !== id);
        dataToSubmit.payments = newPayments;
        handleDataEditSubmit(API_NAME, null, setSendingData, setEditMode, dataToSubmit, setFormValues, defaultFormState, setSnackState, submitCallback);
    }

    const inputChangeListener = event => {
        handleInputChange(event, formValues, setFormValues)
    };

    const getRemainingBalance = () => {
        if(props.data) {
            const totalPaid = props.data?.payments.map(item => item.amount).reduce((a, b) => a + b, 0);
            const remainingAmount = props.data?.total >= 0 ? props.data?.total - totalPaid : props.data?.total + totalPaid;
            return remainingAmount.toFixed(2);
        }
    };

    const paymentData = [
        {
            field: "date",
            label: "Payment Date",
            type: "datepicker",
            defaultState: new Date(),
            changeListener: newDate => handleDateChange(newDate, "date"),
             gridProps: {
                cellRenderer: DateCellRenderer
            }
        },
        {
            field: "amount",
            label: "Amount",
            type: "textfield",
            changeListener: inputChangeListener,
            textFieldProps: {
                required: true,
                type: "number",
                autoFocus: true,
                inputProps: {
                    step: 0.01
                }
            },
            gridProps: {
                type: "rightAligned",
                cellRenderer: PriceCellRenderer,
                comparator: stringValueToNumberComparator
            }
        },
        {
            field: "type",
            label: "Payment Type",
            type: "dropdown_fixed",
            changeListener: inputChangeListener,
            textFieldProps: {
                required: true
            },
            dropdownOptions: {
                loaded: true,
                menuEntries: [
                    <MenuItem value={"Card"} key={"Card"}>Card</MenuItem>,
                    <MenuItem value={"Cash"} key={"Cash"}>Cash</MenuItem>,
                    <MenuItem value={"BACS"} key={"BACS"}>BACS</MenuItem>,
                    <MenuItem value={"Cheque"} key={"Cheque"}>Cheque</MenuItem>,
                    <MenuItem value={"Credit"} key={"Credit"}>Credit</MenuItem>,
                ]
            }
        },
        {
            field: "recorded_by",
            label: "Recorded by",
            type: "textfield",
            textFieldProps: {
                type: "text",
                disabled: true
            }
        },
        {
            field: "comments",
            label: "Comments",
            type: "textfield",
            changeListener: inputChangeListener,
            textFieldProps: {
                type: "text",
                autoComplete: "off",
                multiline: true,
                rows: 2
            }
        }
    ];

    const getPaymentActionColumnDef = (setEditMode, setFormValues) => {
        return {
            field: "_id",
            headerName: "Action",
            floatingFilter: false,
            filter: false,
            cellRenderer: PaymentActionCellRenderer,
            cellRendererParams: {
                setEditModeCB: setEditMode,
                setFormValuesCB: setFormValues,
                user: user,
                deleteFunction: handleDeleteSubmit
            }
        }
    };

    const defaultFormState = {...getDefaultFormFields(paymentData), recorded_by: user.name};
    const [formValues, setFormValues] = useState({...defaultFormState});
    const colDefs = [...getColumnDefs(paymentData), getPaymentActionColumnDef(setEditMode, setFormValues)];
    const rowData = props.data?.payments;

    const staticBalanceField = <TextField
        name="remaining_balance"
        label="Remaining Balance"
        value={getRemainingBalance()}
        variant="outlined"
        fullWidth
        type="text"
        disabled
        InputLabelProps={{shrink: true}}
    />;

    const gridFields = getInputFields(paymentData, formValues);
    gridFields.splice(2, 0, staticBalanceField);

    return <Modal
        open={props.open}
        onClose={props.handleClose}
    >
        <Box sx={style}>
            <div style={{height: "100%"}}>
                <div>
                    <form onSubmit={editMode ? handleEditSubmit : handleSubmit}>
                        <CustomisedSnackBar {...snackState} setClosed={setSnackState} />
                        {getGridFormInputFields(gridFields)}
                        <LoadingButton loading={sendingData} icon={editMode ? <EditIcon /> : <AddIcon />} buttonLabel={`${editMode ? "EDIT" : "ADD"} PAYMENT`} disabled={sendingData} />
                        {editMode ? <Button variant="contained" color="error" onClick={disableEditMode} >CANCEL</Button> : ""}
                    </form>
                </div>
                <div style={{height: "70%"}}>
                    <DataViewGrid rowData={rowData} columnDefs={colDefs} />
                </div>

            </div>
        </Box>
    </Modal>
};

export default SupplierPaymentsForm;