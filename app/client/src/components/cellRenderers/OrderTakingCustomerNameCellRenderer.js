import React from 'react';
import CircleIcon from '@mui/icons-material/Circle';

const OrderTakingCustomerNameCellRenderer = (props) => {

    const hasInvoices = () => {
        return props.invoicesList.filter(invoice => invoice.customer === props.data._id).length > 0;
    };

    const getColouredCustomer = colour => {
        return <div style={{
            display: 'flex',
            alignItems: 'center',
            verticalAlign: 'middle',
        }}>
            <CircleIcon style={{ color: colour }} />
            <span>{props.value}</span>
        </div>
    };

    return props.data.active ? props.data.on_hold || props.data._id in props.cancelledInvoiceDayCustomers ? getColouredCustomer("orange") : hasInvoices() ? props.value : getColouredCustomer("green") : getColouredCustomer("red");
};

export default OrderTakingCustomerNameCellRenderer;