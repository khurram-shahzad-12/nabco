import React from 'react';

const VATAmountCellRenderer = props => {
    const {quantity, rate, tax} = props.data;
    const vat_amount = (quantity * rate * (tax/100)).toFixed(2);
    return Number(vat_amount);
};

export default VATAmountCellRenderer;