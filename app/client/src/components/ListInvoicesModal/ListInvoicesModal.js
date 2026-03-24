import React, {useState} from "react";
import Modal from '@mui/material/Modal';
import Box from "@mui/material/Box";
import {
    currentUserHasPermissions, dateStringComparator,
    defaultSnackState, getInvoiceReportsInNewTab, stringValueToNumberComparator
} from "../formFunctions/FormFunctions";
import {Button} from "@mui/material";
import DataViewGrid from "../DataViewGrid/DataViewGrid";
import {invoiceActionCellRenderer} from "../cellRenderers/InvoicesActionCellRenderer";
import PaymentsForm from "../PaymentsForm/PaymentsForm";
import {PriceCellRenderer} from "../cellRenderers/PriceCellRenderer";
import moment from "moment";

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

const ListInvoicesModal = modalProps => {
    const [snackState, setSnackState] = useState(defaultSnackState);
    const [openModal, setOpenModal] = useState(false);
    const [paymentsModalData, setPaymentsModalData] = useState({open: false});
    const requiredWritePermissions = [process.env.REACT_APP_WRITE_INVOICES_CLAIM];
    const requiredEditPermissions = [process.env.REACT_APP_EDIT_INVOICES_CLAIM];
    const requiredProfitPermissions = [process.env.REACT_APP_READ_INVOICE_MARGINS_CLAIM];

    const handleOpenPaymentsForm = (data) => setPaymentsModalData({open: true, data: data});
    const handleClosePaymentsForm = () => setPaymentsModalData({open: false});

    const handleOpenModal = () => {
        setOpenModal(true);
    };

    const handleClose = () => {
        setOpenModal(false);
    };

    const getActionCellRenderer = props => {
        const actionCellProps = {
            data : props.data,
            value: props.value,
            openInvoice: invoiceNo => getInvoiceReportsInNewTab([invoiceNo], "invoice.pdf", setSnackState),
            openInvoiceReprint: invoiceNo => getInvoiceReportsInNewTab([invoiceNo], "invoiceReprint.pdf", setSnackState),
            editCB: (invoiceData, canEdit) => modalProps.editInvoice(modalProps.customer, props.data, canEdit),
            openPayments: handleOpenPaymentsForm,
            requiredEditPermissions: requiredEditPermissions,
        };
        return <div style={{display: "inline-flex"}}>
            {invoiceActionCellRenderer(actionCellProps)}
        </div>
    }

    const getBalancePaidCellRenderer = props => {
        return props.data.payments.map(item => item.amount).reduce((a, b) => a + b, 0).toFixed(2);
    };

    const invoiceColDefs = [
        {
            field: "sale_number",
            headerName: "Invoice Number"
        },
        {
            field: "invoice_date",
            headerName: "Invoice Date",
            valueGetter: props => moment(props.data.invoice_date).format("DD/MM/YYYY"),
            comparator: dateStringComparator
        },
        {
            field: "_id",
            headerName: "Total Paid",
            cellRenderer: getBalancePaidCellRenderer,
            type: "rightAligned"
        },
        {
            field: "total_incl_vat",
            headerName: "Total Amount",
            type: "rightAligned"
        },
        ...currentUserHasPermissions(requiredProfitPermissions) ? [{ headerName: "Profit", field: "profit", cellRenderer: PriceCellRenderer, comparator: stringValueToNumberComparator, type: "rightAligned"}]: [],
        {
            field: "_id",
            headerName: "Actions",
            cellRenderer: getActionCellRenderer
        },
    ];

    return <div>
        <Button variant="contained" onClick={handleOpenModal} disabled={!currentUserHasPermissions(requiredWritePermissions)}>Show Invoices({modalProps.invoices.length})</Button>
        <Modal
            open={openModal}
            onClose={handleClose}
        >
            <Box sx={style}>
                <div style={{height: "100%"}}>
                    {modalProps.customer.customer_name}
                    <DataViewGrid rowData={modalProps.invoices} columnDefs={invoiceColDefs} />
                </div>
            </Box>
        </Modal>
        <PaymentsForm open={paymentsModalData.open} handleClose={handleClosePaymentsForm} data={paymentsModalData.data} postSubmitCallback={modalProps.reloadInvoicesTrigger} />
    </div>
};

export default ListInvoicesModal;