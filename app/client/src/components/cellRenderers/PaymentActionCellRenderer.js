import React from 'react';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';

export const PaymentActionCellRenderer = (props) => {
	const deleteAction = () => {
		if (window.confirm("Are you sure you want to delete this item?")) {
			props.deleteFunction(props.value);
		}
	};

	const editAction = () => {
		props.setEditModeCB(true);
		props.setFormValuesCB({...props.data, recorded_by: props.user.name});
	};

	return <Stack direction="row" spacing={1}>
		<Tooltip title="Edit">
			<IconButton aria-label="edit" onClick={editAction}>
				<EditIcon />
			</IconButton>
		</Tooltip>
		<Tooltip title="Delete">
			<IconButton aria-label="delete" onClick={deleteAction}>
				<DeleteIcon />
			</IconButton>
		</Tooltip>
	</Stack>;
};