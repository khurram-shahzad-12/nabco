import React from 'react';
import IconButton from '@mui/material/IconButton';
import ReceiptIcon from '@mui/icons-material/Receipt';
import RestorePageIcon from '@mui/icons-material/RestorePage';
import PaymentsIcon from '@mui/icons-material/Payments';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AttachEmailIcon from '@mui/icons-material/AttachEmail';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import PrintIcon from '@mui/icons-material/Print';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';
import {currentUserHasPermissions} from "../formFunctions/FormFunctions";
import moment from "moment";

export const invoiceActionCellRenderer = (props) => {
	const INVOICE_EDIT_LIMIT = process.env.REACT_APP_INVOICES_EDIT_DURATION_LIMIT;
	const INVOICE_EDIT_LIMIT_SALES = process.env.REACT_APP_INVOICES_EDIT_DURATION_LIMIT_SALES_STAFF_HOURS;
	const WRITE_PAYMENT_PERMISSIONS = [process.env.REACT_APP_WRITE_INVOICE_PAYMENTS_DATA_CLAIM];
	const todaysDate = moment(moment().format('YYYY-MM-DD'));
	const invoice_date = moment(moment(props.data.invoice_date).format('YYYY-MM-DD'));
	const ot_date = moment(moment(props.data.ot_date).format('YYYY-MM-DD'));
	const daysSinceInvoiceDate = todaysDate.diff(invoice_date, 'days');
	const hoursSinceInvoiceOTDate = todaysDate.diff(ot_date, 'hours');

	const editAction = () => {
		props.editCB(props.data, currentUserHasPermissions(WRITE_PAYMENT_PERMISSIONS) ?
			daysSinceInvoiceDate < INVOICE_EDIT_LIMIT
		:
			hoursSinceInvoiceOTDate < INVOICE_EDIT_LIMIT_SALES
		);
	};

	const paymentsAction = () => {
		props.openPayments(props.data);
	};

	const printInvoiceAction = () => {
		props.openInvoice && props.openInvoice(props.value);
	};

	const reprintInvoiceAction = () => {
		props.openInvoiceReprint && props.openInvoiceReprint(props.value);
	};

	const emailInvoiceAction = () => {
		if(props.emailInvoice) {
			if(window.confirm("Have you checked order and pricing?")) {
				props.emailInvoice(props.value);
			}
		}
	};

	const updatePrintedAction = () => {
		props.updatePrintedStatus(props.value, !props.data.printed);
	};
	const updatePickedAction = () => {
		props.updatePickedStatus(props.value, !props.data.picked);
	};

	return <Stack direction="row" spacing={1}>
		<Tooltip title={currentUserHasPermissions(WRITE_PAYMENT_PERMISSIONS) ? daysSinceInvoiceDate < INVOICE_EDIT_LIMIT ? "Edit" : "View"
			:
			hoursSinceInvoiceOTDate < INVOICE_EDIT_LIMIT_SALES ? "Edit" : "View"
		}>
			<IconButton aria-label="edit" onClick={editAction} disabled={!currentUserHasPermissions(props.requiredEditPermissions)}>
				{currentUserHasPermissions(WRITE_PAYMENT_PERMISSIONS) ? daysSinceInvoiceDate < INVOICE_EDIT_LIMIT ? <EditIcon/> : <VisibilityIcon/>
				: hoursSinceInvoiceOTDate < INVOICE_EDIT_LIMIT_SALES ? <EditIcon/> : <VisibilityIcon/>
				}
			</IconButton>
		</Tooltip>
		{
			props.openInvoice &&
			<Tooltip title="Print Invoice">
				<IconButton aria-label="print invoice" onClick={printInvoiceAction}>
					<ReceiptIcon />
				</IconButton>
			</Tooltip>
		}
		{
			props.openInvoiceReprint &&
			<Tooltip title="Reprint Invoice">
				<IconButton aria-label="reprint invoice" onClick={reprintInvoiceAction}>
					<RestorePageIcon />
				</IconButton>
			</Tooltip>
		}
		{
			props.emailInvoice && <Tooltip title={props.data.email_sent ? "Email already sent, click to send again" : "Email Invoice"}>
				<IconButton aria-label={props.data.email_sent ? "Email already sent, click to send again" : "Email Invoice"} onClick={emailInvoiceAction}>
					{props.data.email_sent ? <MarkEmailReadIcon /> : <AttachEmailIcon />}
				</IconButton>
			</Tooltip>
		}

		{
			(currentUserHasPermissions(WRITE_PAYMENT_PERMISSIONS) && !props.reduced) &&
			<Tooltip title="Record Payment(s)">
				<IconButton aria-label="record payments" onClick={paymentsAction}>
					<PaymentsIcon />
				</IconButton>
			</Tooltip>
		}

		{
			(props.updatePrintedStatus) &&
			<Tooltip title={props.data.printed ? "Unmark printed" : "Mark printed"}>
				<IconButton aria-label="mark printed" onClick={updatePrintedAction}>
					<PrintIcon style={{ color: props.data.printed ? 'green' : 'red' }} />
				</IconButton>
			</Tooltip>
		}
		{
			(props.updatePickedStatus) &&
			<Tooltip title={props.data.picked ? "Unmark picked" : "Mark picked"}>
				<IconButton aria-label="mark picked" onClick={updatePickedAction}>
					<ShoppingCartIcon style={{ color: props.data.printed ? props.data.picked ? 'green' : 'yellow' : 'red' }} />
				</IconButton>
			</Tooltip>
		}
	</Stack>;
}