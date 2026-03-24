import React from 'react';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';
import {handleDeleteEntry} from "../formFunctions/FormFunctions";

export const CustomerItemRemoveCellRenderer = (props) => {
    const deleteAction = () => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            let newItemsList = [...props.customerItems.items].filter(item => item._id !== props.value);
            props.setCustomerItems({
                ...props.customerItems,
                items: newItemsList
            });
        }
    };

    return <Stack direction="row" spacing={1}>
        <Tooltip title="Delete">
            <IconButton aria-label="delete" onClick={deleteAction}>
                <DeleteIcon />
            </IconButton>
        </Tooltip>
    </Stack>;
};