const OrderTakingItemCellValueCalculator = (props) => {

	const vat_id = props.productsMap[props.value].vat;
	const vat_rate = props.vatMap[vat_id].rate
	const returnValue = props.data.quantity * props.data.rate * (1 + (vat_rate/100));
	return Number(returnValue.toFixed(2));
};

export default OrderTakingItemCellValueCalculator;