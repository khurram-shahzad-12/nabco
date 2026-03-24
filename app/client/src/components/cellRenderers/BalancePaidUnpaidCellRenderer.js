export const BalancePaidUnpaidCellRenderer = (props) => {
	const field = props.colDef.field;

	const totalPaid = props.data?.payments.map(item => item.amount).reduce((a, b) => a + b, 0).toFixed(2);

	return +totalPaid === props.data[field] ? "PAID" : totalPaid > 0 ? "PART PAID" : "UNPAID";
};