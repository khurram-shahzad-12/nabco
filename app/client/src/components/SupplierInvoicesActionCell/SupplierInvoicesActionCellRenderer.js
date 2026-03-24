import React from 'react';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';
import {currentUserHasPermissions, handleDeleteEntry} from "../formFunctions/FormFunctions";
import PaymentsIcon from "@mui/icons-material/Payments";

export const SupplierInvoicesActionCellRenderer = (props) => {
    const WRITE_PAYMENT_PERMISSIONS = [process.env.REACT_APP_WRITE_SUPPLIER_INVOICE_PAYMENTS_DATA_CLAIM];

    const deleteAction = () => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            handleDeleteEntry(props.apiName, props.value, props.setSendingData, props.setSnackState, props.deleteCallback);
        }
    };

    const editAction = () => {
        props.setFormValuesCB(props.data);
        props.setEditModeCB(true);
    };

    const paymentsAction = () => {
        props.openPayments(props.data);
    };

    return <Stack direction="row" spacing={1}>
        <Tooltip title="Edit">
            <IconButton aria-label="edit" onClick={editAction} disabled={!currentUserHasPermissions(props.requiredWritePermissions)}>
                <EditIcon />
            </IconButton>
        </Tooltip>
        {
            (currentUserHasPermissions(WRITE_PAYMENT_PERMISSIONS) && !props.reduced) &&
            <Tooltip title="Record Payment(s)">
                <IconButton aria-label="record payments" onClick={paymentsAction}>
                    <PaymentsIcon />
                </IconButton>
            </Tooltip>
        }
        {!props.disabledDelete &&
        <Tooltip title="Delete">
            <IconButton aria-label="delete" onClick={deleteAction} disabled={!currentUserHasPermissions(props.requiredWritePermissions)}>
                <DeleteIcon />
            </IconButton>
        </Tooltip>
        }
    </Stack>;
};