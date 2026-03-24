export const BalanceCellRenderer = (props) => {
	const getRemainingBalance = () => {
		return props.data?.payments.map(item => item.amount).reduce((a, b) => a + b, 0);
	};

	return `${getRemainingBalance().toFixed(2)}/${props.value.toFixed(2)}`;
};