import React from 'react';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import EditIcon from '@mui/icons-material/Edit';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';
import {currentUserHasPermissions, handleDeleteEntry} from "../formFunctions/FormFunctions";

export const btnActionCellRenderer = (props) => {
	const deleteAction = () => {
		if (window.confirm("Are you sure you want to delete this item?")) {
			handleDeleteEntry(props.apiName, props.value, props.setSendingData, props.setSnackState, props.deleteCallback);
		}
	};

	const editAction = () => {
		props.setFormValuesCB(props.data);
		props.setEditModeCB(true);
	};

	return <Stack direction="row" spacing={1}>
		<Tooltip title="Edit">
			<IconButton aria-label="edit" onClick={editAction} disabled={!currentUserHasPermissions(props.requiredWritePermissions)}>
				<EditIcon />
			</IconButton>
		</Tooltip>
		{props.showImage &&
		<Tooltip title="Image">
			<IconButton aria-label="image" onClick={() => props.showImage(props.data._id)}>
				<ImageIcon />
			</IconButton>
		</Tooltip>
		}
		{(()=>{
			if(typeof props.disabledDelete === 'function'){
				return !props.disabledDelete(props.data);
			} return !props.disabledDelete;
		}) ()&&(
		<Tooltip title="Delete">
			<IconButton aria-label="delete" onClick={deleteAction} disabled={!currentUserHasPermissions(props.requiredWritePermissions)}>
				<DeleteIcon />
			</IconButton>
		</Tooltip>
		)}
	</Stack>;
};