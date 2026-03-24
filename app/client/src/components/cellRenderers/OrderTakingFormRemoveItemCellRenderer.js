import React from 'react';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';
import LongMenu from "../OrderTakingFormLongMenu/OrderTakingFormLongMenu";

export const OrderTakingFormItemChooserActionCellRenderer = (props) => {

	return <Stack direction="row" spacing={0}>
		<Tooltip title="Delete">
			<IconButton aria-label="delete" onClick={() => props.deleteRow(props.rowIndex)} disabled={!props.canEdit}>
				<DeleteIcon />
			</IconButton>
		</Tooltip>
		<LongMenu
			currentCustomer={props.currentCustomer}
			customerItems={props.customerItems}
			currentItem={props.currentItem}
			updateCustomerItems={props.updateCustomerItems}
			setSnackState={props.setSnackState}
			setSendingData={props.setSendingData}
			showItemHistory={props.showItemHistory}
			showImage={props.showImage}
			quotation={props.quotation}
			selectedLead={props.selectedLead}
		/>
	</Stack>;
};